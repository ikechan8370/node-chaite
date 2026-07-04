import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'
import type { BackgroundJobManager } from '../background/BackgroundJobManager'
import { getPlanProgress } from '../planning/plan.types'
import type { PlanExecutor } from '../planning/PlanExecutor'

/**
 * Returns the set of built-in system tools to register with Chaite.
 * These tools give the LLM the ability to spawn background tasks,
 * check job status, and query plan progress — all backed by
 * structured storage rather than LLM-narrated status.
 */
export function createSystemTools(
  jobManager: BackgroundJobManager,
  planExecutor?: PlanExecutor,
): Tool[] {
  return [
    spawnBackgroundTaskTool(jobManager),
    checkJobStatusTool(jobManager),
    ...(planExecutor ? [checkPlanProgressTool(planExecutor)] : []),
  ]
}

// ─── spawn_background_task ────────────────────────────────────────────────────

function spawnBackgroundTaskTool(jobManager: BackgroundJobManager): Tool {
  return {
    name: 'spawn_background_task',
    type: 'function',
    function: {
      name: 'spawn_background_task',
      description:
        'Spawn a long-running task in the background. ' +
        'Returns a job ID immediately. The user will be notified when the task finishes. ' +
        'Use this when a task will take a long time or involves multiple steps.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'A clear description of the task goal',
          },
          skill_name: {
            type: 'string',
            description: 'Optional: the skill name to activate for this task',
          },
        },
        required: ['description'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const description = args['description'] as string
      const skillName = args['skill_name'] as string | undefined

      const event = context?.getEvent()
      const userId = String(event?.sender?.user_id ?? 'unknown')
      const groupId = event?.group?.group_id ? String(event.group.group_id) : undefined

      const chaite = context?.getChaite()
      const bgManager = chaite?.getBackgroundJobManager() ?? jobManager

      const jobId = await bgManager.createAndRun({
        description,
        userId,
        groupId,
        skillName,
      })

      return JSON.stringify({
        jobId,
        message: `Task "${description}" has been started in the background (job: ${jobId}). I'll notify you when it's done.`,
      })
    },
  }
}

// ─── check_job_status ─────────────────────────────────────────────────────────

function checkJobStatusTool(jobManager: BackgroundJobManager): Tool {
  return {
    name: 'check_job_status',
    type: 'function',
    function: {
      name: 'check_job_status',
      description: 'Check the status of a background job by its job ID. Returns structured status data.',
      parameters: {
        type: 'object',
        properties: {
          job_id: {
            type: 'string',
            description: 'The job ID returned by spawn_background_task',
          },
        },
        required: ['job_id'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const jobId = args['job_id'] as string
      const chaite = context?.getChaite()
      const bgManager = chaite?.getBackgroundJobManager() ?? jobManager

      const job = await bgManager.getJob(jobId)
      if (!job) {
        return JSON.stringify({ error: `Job "${jobId}" not found` })
      }

      return JSON.stringify({
        jobId: job.id,
        description: job.description,
        status: job.status,
        planId: job.planId,
        result: job.status === 'done' ? job.result?.slice(0, 500) : undefined,
        error: job.status === 'failed' ? job.error : undefined,
        createdAt: new Date(job.createdAt).toISOString(),
        updatedAt: new Date(job.updatedAt).toISOString(),
      })
    },
  }
}

// ─── check_plan_progress ──────────────────────────────────────────────────────

function checkPlanProgressTool(planExecutor: PlanExecutor): Tool {
  return {
    name: 'check_plan_progress',
    type: 'function',
    function: {
      name: 'check_plan_progress',
      description:
        'Check the detailed step-by-step progress of a plan by its plan ID. ' +
        'Returns structured progress data including each step status.',
      parameters: {
        type: 'object',
        properties: {
          plan_id: {
            type: 'string',
            description: 'The plan ID (found in job status or returned by spawn_background_task)',
          },
        },
        required: ['plan_id'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const planId = args['plan_id'] as string

      // Build a minimal AgentRunContext to access storage
      const chaite = context?.getChaite()
      if (!chaite) {
        return JSON.stringify({ error: 'No chaite context available' })
      }

      const storage = chaite.getAgentStorage()
      if (!storage) {
        return JSON.stringify({ error: 'Agent storage not configured' })
      }

      const plan = await planExecutor.getPlan(planId, {
        sendMessage: () => Promise.reject(new Error('not available')),
        storage,
        logger: chaite.getLogger(),
      })

      if (!plan) {
        return JSON.stringify({ error: `Plan "${planId}" not found` })
      }

      const progress = getPlanProgress(plan)
      const stepsDetail = plan.steps.map(s => ({
        index: s.index,
        title: s.title,
        status: s.status,
        result: s.status === 'done' ? s.result?.slice(0, 200) : undefined,
        error: s.status === 'failed' ? s.result : undefined,
      }))

      return JSON.stringify({
        ...progress,
        steps: stepsDetail,
        revision: plan.revision,
      })
    },
  }
}
