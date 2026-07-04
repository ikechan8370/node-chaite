import schedule, { Job } from '@karinjs/node-schedule'
import * as crypto from 'node:crypto'
import type EventEmitter from 'node:events'
import type { BasicStorage } from '../../types/storage'
import type { ILogger } from '../../types/common'
import type { AgentRunContext } from '../contracts'

export interface ScheduledTask {
  id: string
  description: string
  /** ISO datetime string OR cron expression (e.g. "0 17 * * *") */
  schedule: string
  /** If true, task cancels itself after first execution */
  oneShot: boolean
  userId: string
  groupId?: string
  /** The agent goal to run when the task fires */
  goal: string
  /**
   * Optional: name of a Skill whose workflow/plan to execute at fire time.
   * When set, the task routes directly to that skill's executionMode
   * instead of relying on keyword matching from the goal string.
   */
  skillName?: string
  status: 'active' | 'cancelled' | 'done'
  createdAt: number
  /** Timestamp of last execution */
  lastFiredAt?: number
  /** Next scheduled execution (ISO string, for display) */
  nextFireAt?: string
}

const TASK_STORAGE_PREFIX = 'scheduled_task:'

export interface DynamicSchedulerOptions {
  storage: BasicStorage<ScheduledTask>
  eventEmitter: EventEmitter
  logger: ILogger
  /** Called when a task fires — runs the agent and returns output */
  runAgent: (task: ScheduledTask, ctx: AgentRunContext) => Promise<string>
  /**
   * Build a run context for a scheduled task execution.
   * Implementations MUST forward task.skillName to buildAgentRunContext({ skillName: task.skillName })
   * so that skills with executionMode=workflow|plan are correctly routed.
   *
   * Example:
   *   buildRunContext: (task) => chaite.buildAgentRunContext({
   *     skillName: task.skillName,
   *     userId: task.userId,
   *     groupId: task.groupId,
   *   })
   */
  buildRunContext: (task: ScheduledTask) => AgentRunContext
}

/**
 * DynamicScheduler allows programmatic (LLM-driven) creation of scheduled tasks.
 *
 * Unlike the static CronTrigger (which requires a developer to write a .js file),
 * DynamicScheduler tasks are created at runtime via the schedule_task tool and
 * persisted in storage so they can be restored after restarts.
 *
 * At fire time:
 *   1. Build AgentRunContext
 *   2. Call runAgent(task, ctx) → the agent fetches data and returns output
 *   3. Emit 'job:complete' with the output → consumed by QQ plugin → sends message
 */
export class DynamicScheduler {
  private jobs: Map<string, Job> = new Map()

  constructor(private readonly opts: DynamicSchedulerOptions) {}

  /**
   * Schedule a new task. Returns the task id.
   * @param schedule ISO datetime OR cron expression
   * @param goal Agent goal to run when the task fires
   * @param oneShot If true, runs once and cancels
   */
  async scheduleTask(params: {
    schedule: string
    goal: string
    description: string
    oneShot: boolean
    userId: string
    groupId?: string
    skillName?: string
  }): Promise<ScheduledTask> {
    const taskId = crypto.randomUUID()
    const task: ScheduledTask = {
      id: taskId,
      description: params.description,
      schedule: params.schedule,
      goal: params.goal,
      oneShot: params.oneShot,
      userId: params.userId,
      groupId: params.groupId,
      skillName: params.skillName,
      status: 'active',
      createdAt: Date.now(),
    }

    const job = this.createJob(task)
    if (!job) {
      throw new Error(`Invalid schedule expression: "${params.schedule}"`)
    }

    task.nextFireAt = job.nextInvocation()?.toISOString() ?? undefined
    await this.opts.storage.setItem(TASK_STORAGE_PREFIX + taskId, task)

    this.opts.logger.info(
      `[DynamicScheduler] Task "${task.description}" scheduled (${task.schedule}), next fire: ${task.nextFireAt}`,
    )

    return task
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = await this.opts.storage.getItem(TASK_STORAGE_PREFIX + taskId)
    if (!task) return false

    const job = this.jobs.get(taskId)
    if (job) {
      job.cancel()
      this.jobs.delete(taskId)
    }

    task.status = 'cancelled'
    await this.opts.storage.setItem(TASK_STORAGE_PREFIX + taskId, task)
    this.opts.logger.info(`[DynamicScheduler] Task ${taskId} cancelled`)
    return true
  }

  async getTask(taskId: string): Promise<ScheduledTask | null> {
    return this.opts.storage.getItem(TASK_STORAGE_PREFIX + taskId)
  }

  async listTasks(userId?: string): Promise<ScheduledTask[]> {
    const all = await this.opts.storage.listItems()
    return userId ? all.filter(t => t.userId === userId && t.status === 'active') : all
  }

  /**
   * Restore all active tasks from storage on startup.
   * Should be called once during initialization.
   */
  async restoreFromStorage(): Promise<void> {
    const tasks = await this.opts.storage.listItems()
    let restored = 0
    for (const task of tasks) {
      if (task.status !== 'active') continue

      // For one-shot ISO datetime tasks, skip if already in the past
      if (task.oneShot && this.isIsoDatetime(task.schedule)) {
        const fireDate = new Date(task.schedule)
        if (fireDate <= new Date()) {
          task.status = 'done'
          await this.opts.storage.setItem(TASK_STORAGE_PREFIX + task.id, task)
          continue
        }
      }

      const job = this.createJob(task)
      if (job) {
        task.nextFireAt = job.nextInvocation()?.toISOString() ?? undefined
        await this.opts.storage.setItem(TASK_STORAGE_PREFIX + task.id, task)
        restored++
      }
    }
    if (restored > 0) {
      this.opts.logger.info(`[DynamicScheduler] Restored ${restored} scheduled task(s)`)
    }
  }

  private createJob(task: ScheduledTask): Job | null {
    const scheduleExpr: string | Date = this.isIsoDatetime(task.schedule)
      ? new Date(task.schedule)
      : task.schedule

    const job = schedule.scheduleJob(scheduleExpr, () => {
      this.fire(task)
    })

    if (!job) return null

    this.jobs.set(task.id, job)
    return job
  }

  private fire(task: ScheduledTask): void {
    const ctx = this.opts.buildRunContext(task)

    const run = async () => {
      task.lastFiredAt = Date.now()

      this.opts.logger.info(`[DynamicScheduler] Firing task "${task.description}"`)

      try {
        const output = await this.opts.runAgent(task, ctx)

        // Emit as job:complete so the QQ plugin can pick it up
        this.opts.eventEmitter.emit('job:complete', {
          jobId: task.id,
          userId: task.userId,
          groupId: task.groupId,
          status: 'done',
          result: output,
        })

        this.opts.logger.info(`[DynamicScheduler] Task "${task.description}" completed`)
      } catch (err) {
        this.opts.logger.error(`[DynamicScheduler] Task "${task.description}" failed: ${String(err)}`)
        this.opts.eventEmitter.emit('job:failed', {
          jobId: task.id,
          userId: task.userId,
          groupId: task.groupId,
          status: 'failed',
          error: String(err),
        })
      }

      if (task.oneShot) {
        task.status = 'done'
        this.jobs.delete(task.id)
        await this.opts.storage.setItem(TASK_STORAGE_PREFIX + task.id, task)
        this.opts.logger.info(`[DynamicScheduler] One-shot task "${task.description}" done and removed`)
      } else {
        // Update nextFireAt for recurring tasks
        const job = this.jobs.get(task.id)
        task.nextFireAt = job?.nextInvocation()?.toISOString() ?? undefined
        await this.opts.storage.setItem(TASK_STORAGE_PREFIX + task.id, task)
      }
    }

    run().catch((err: unknown) => {
      this.opts.logger.error(`[DynamicScheduler] Unexpected error in task ${task.id}: ${String(err)}`)
    })
  }

  private isIsoDatetime(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)
  }
}
