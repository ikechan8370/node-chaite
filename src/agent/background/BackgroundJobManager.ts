import * as crypto from 'node:crypto'
import type EventEmitter from 'node:events'
import type { BasicStorage } from '../../types/storage'
import type { ILogger } from '../../types/common'
import type { AgentRunContext, BackgroundJobSpec, IBackgroundJobManager } from '../contracts'
import type { BackgroundJob, JobCompletePayload, JobProgressPayload } from './job.types'

const JOB_STORAGE_PREFIX = 'job:'

export interface BackgroundJobManagerOptions {
  storage: BasicStorage<BackgroundJob>
  eventEmitter: EventEmitter
  logger: ILogger
  /** Max concurrent running jobs. Default: 3 */
  maxConcurrent?: number
}

/**
 * JobExecutorFn is the actual async work of a job.
 * It receives the jobId and an onProgress callback to emit intermediate updates.
 * It should return the final output string.
 */
export type JobExecutorFn = (
  jobId: string,
  onProgress: (progress: Omit<JobProgressPayload, 'jobId'>) => void,
) => Promise<string>

/**
 * BackgroundJobManager manages the full lifecycle of background jobs:
 *   create → queue → run → complete/fail → emit events
 *
 * Consumers (e.g. karin-plugin-chaite) listen to Chaite EventEmitter:
 *   chaite.on('job:complete', (payload: JobCompletePayload) => { ... send QQ message })
 *   chaite.on('job:progress', (payload: JobProgressPayload) => { ... update status })
 *
 * System tools (spawn_background_task, check_job_status) interact with this manager
 * via ChaiteContext.getChaite().getBackgroundJobManager().
 */
export class BackgroundJobManager implements IBackgroundJobManager {
  private runningCount = 0
  private readonly maxConcurrent: number
  private readonly queue: Array<{ job: BackgroundJob; executor: JobExecutorFn }> = []

  constructor(private readonly opts: BackgroundJobManagerOptions) {
    this.maxConcurrent = opts.maxConcurrent ?? 3
  }

  /**
   * Create a job and schedule it for execution.
   * @returns jobId
   */
  async createAndRun(spec: BackgroundJobSpec, executor?: JobExecutorFn): Promise<string> {
    const jobId = crypto.randomUUID()
    const now = Date.now()

    const job: BackgroundJob = {
      id: jobId,
      description: spec.description,
      userId: spec.userId,
      groupId: spec.groupId,
      skillName: spec.skillName,
      conversationId: spec.conversationId,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    }

    await this.opts.storage.setItem(JOB_STORAGE_PREFIX + jobId, job)

    this.opts.eventEmitter.emit('job:queued', { jobId, userId: spec.userId, groupId: spec.groupId })

    const effectiveExecutor = executor ?? this.makeDefaultExecutor(spec)

    // Schedule without blocking the caller
    setImmediate(() => this.schedule(job, effectiveExecutor))

    return jobId
  }

  async getJob(jobId: string): Promise<BackgroundJob | null> {
    return this.opts.storage.getItem(JOB_STORAGE_PREFIX + jobId)
  }

  async listJobs(userId?: string): Promise<BackgroundJob[]> {
    const all = await this.opts.storage.listItems()
    return userId ? all.filter(j => j.userId === userId) : all
  }

  private schedule(job: BackgroundJob, executor: JobExecutorFn): void {
    if (this.runningCount >= this.maxConcurrent) {
      this.queue.push({ job, executor })
      this.opts.logger.info(`[BackgroundJobManager] Job ${job.id} queued (${this.queue.length} waiting)`)
      return
    }
    this.start(job, executor)
  }

  private start(job: BackgroundJob, executor: JobExecutorFn): void {
    this.runningCount++

    const onProgress = (progress: Omit<JobProgressPayload, 'jobId'>) => {
      const payload: JobProgressPayload = { jobId: job.id, ...progress }
      this.opts.eventEmitter.emit('job:progress', payload)
    }

    const run = async () => {
      job.status = 'running'
      job.updatedAt = Date.now()
      await this.opts.storage.setItem(JOB_STORAGE_PREFIX + job.id, job)

      this.opts.eventEmitter.emit('job:start', {
        jobId: job.id,
        userId: job.userId,
        groupId: job.groupId,
      })

      this.opts.logger.info(`[BackgroundJobManager] Job ${job.id} started: "${job.description}"`)

      let result: string | undefined
      let error: string | undefined

      try {
        result = await executor(job.id, onProgress)
        job.status = 'done'
        job.result = result
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
        job.status = 'failed'
        job.error = error
        this.opts.logger.error(`[BackgroundJobManager] Job ${job.id} failed: ${error}`)
      }

      job.updatedAt = Date.now()
      await this.opts.storage.setItem(JOB_STORAGE_PREFIX + job.id, job)

      const eventName: 'job:complete' | 'job:failed' = job.status === 'done' ? 'job:complete' : 'job:failed'
      const payload: JobCompletePayload = {
        jobId: job.id,
        userId: job.userId,
        groupId: job.groupId,
        status: job.status,
        result: job.result,
        error: job.error,
        planId: job.planId,
      }
      this.opts.eventEmitter.emit(eventName, payload)
      this.opts.logger.info(`[BackgroundJobManager] Job ${job.id} ${job.status}`)

      this.runningCount--
      this.drainQueue()
    }

    // Run asynchronously, do not await
    run().catch((err: unknown) => {
      this.opts.logger.error(`[BackgroundJobManager] Unexpected error in job ${job.id}: ${String(err)}`)
      this.runningCount--
      this.drainQueue()
    })
  }

  private drainQueue(): void {
    if (this.queue.length > 0 && this.runningCount < this.maxConcurrent) {
      const next = this.queue.shift()!
      this.start(next.job, next.executor)
    }
  }

  /**
   * Default executor used when createAndRun is called without an explicit executor
   * (e.g. from the spawn_background_task tool).
   * Subclasses or factory patterns can override this to inject plan/workflow execution.
   */
  private makeDefaultExecutor(spec: BackgroundJobSpec): JobExecutorFn {
    // This will be replaced with proper plan/LLM execution once AgentRunContext is wired.
    // A thin default that logs the payload — callers should provide a real executor.
    return async (jobId, _onProgress) => {
      this.opts.logger.info(
        `[BackgroundJobManager] Default executor for job ${jobId}: "${spec.description}"`,
      )
      return `Job "${spec.description}" was queued but no executor was provided.`
    }
  }

  /**
   * Build an executor that runs a full agent pipeline for a given goal.
   * Called by the Chaite composition root after wiring ctx.
   */
  buildAgentExecutor(
    makeRunContext: (jobId: string) => AgentRunContext,
    planExecutor?: import('../planning/PlanExecutor').PlanExecutor,
  ): JobExecutorFn {
    return async (jobId: string, onProgress) => {
      const ctx = makeRunContext(jobId)

      if (planExecutor) {
        const job = await this.getJob(jobId)
        const goal = (job?.description) ?? 'execute task'

        // Wire progress → job:progress event via onProgress
        const origEmit = ctx.emitAudit
        ctx.emitAudit = (event) => {
          origEmit?.(event)
          if (event.type === 'job:progress' && event.data) {
            onProgress({
              userId: job?.userId ?? '',
              groupId: job?.groupId,
              planId: event.planId,
              stepIndex: (event.data as { doneSteps?: number }).doneSteps,
              stepTotal: (event.data as { totalSteps?: number }).totalSteps,
              stepTitle: (event.data as { currentStep?: { title: string } }).currentStep?.title,
            })
          }
        }

        const { output, plan } = await planExecutor.execute(goal, ctx, jobId)

        // Update job's planId
        const storedJob = await this.getJob(jobId)
        if (storedJob) {
          storedJob.planId = plan.id
          await this.opts.storage.setItem(JOB_STORAGE_PREFIX + jobId, storedJob as unknown as never)
        }

        return output
      }

      // Fallback: simple single-turn LLM call
      const job = await this.getJob(jobId)
      const goal = job?.description ?? 'execute task'
      const resp = await ctx.sendMessage(goal)
      return resp.contents?.map(c => ('text' in c ? (c as { text: string }).text : '')).join('') ?? ''
    }
  }
}
