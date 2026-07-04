import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'
import type { DynamicScheduler } from '../scheduler/DynamicScheduler'

/**
 * System tools that let the LLM schedule, cancel, and list tasks.
 *
 * The LLM should:
 * - Convert natural language times to ISO datetime or cron expressions
 * - Call schedule_task with the structured time + goal description
 *
 * Example LLM call:
 *   schedule_task({
 *     schedule: "2024-01-15T17:00:00",
 *     goal: "查询今日天气预报",
 *     description: "下午五点天气提醒",
 *     one_shot: true
 *   })
 */
export function createScheduleTools(scheduler: DynamicScheduler): Tool[] {
  return [
    scheduleTaskTool(scheduler),
    cancelScheduledTaskTool(scheduler),
    listScheduledTasksTool(scheduler),
  ]
}

// ─── schedule_task ────────────────────────────────────────────────────────────

function scheduleTaskTool(scheduler: DynamicScheduler): Tool {
  return {
    name: 'schedule_task',
    type: 'function',
    function: {
      name: 'schedule_task',
      description: `Schedule a future task that will run automatically at the specified time.
The system will execute the task and notify you (via QQ) when it's done.

For the 'schedule' parameter:
- One-time: use ISO datetime like "2024-01-15T17:00:00" (today at 5pm = compute current date + T17:00:00)
- Recurring: use cron expression like "0 17 * * *" (every day at 5pm)

Use this when the user asks to do something later, at a specific time, or repeatedly on a schedule.`,
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Short human-readable description of the task (shown in notifications)',
          },
          goal: {
            type: 'string',
            description: 'The task goal — what the agent should do when the task fires. Be specific.',
          },
          schedule: {
            type: 'string',
            description: 'ISO datetime (e.g. "2024-01-15T17:00:00") for one-time tasks, or cron expression (e.g. "0 17 * * *") for recurring tasks',
          },
          one_shot: {
            type: 'boolean',
            description: 'true = run once and stop, false = recurring (use cron expression)',
          },
          skill_name: {
            type: 'string',
            description: 'Optional: name of a Skill whose workflow/plan to execute at fire time. When provided, the task routes directly to that skill instead of running a plain LLM goal. Use this when the task should trigger a specific workflow.',
          },
        },
        required: ['description', 'goal', 'schedule', 'one_shot'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const description = args['description'] as string
      const goal = args['goal'] as string
      const scheduleExpr = args['schedule'] as string
      const oneShot = args['one_shot'] as boolean
      const skillName = args['skill_name'] as string | undefined

      const event = context?.getEvent()
      const userId = String(event?.sender?.user_id ?? 'unknown')
      const groupId = event?.group?.group_id ? String(event.group.group_id) : undefined

      try {
        const task = await scheduler.scheduleTask({
          description,
          goal,
          schedule: scheduleExpr,
          oneShot,
          userId,
          groupId,
          skillName,
        })

        return JSON.stringify({
          taskId: task.id,
          description: task.description,
          schedule: task.schedule,
          nextFireAt: task.nextFireAt,
          oneShot: task.oneShot,
          skillName: task.skillName,
          message: `已安排任务"${description}"，将在 ${task.nextFireAt ?? task.schedule} 执行${task.skillName ? `，触发技能 "${task.skillName}"` : ''}，完成后会通知你。任务ID: ${task.id}`,
        })
      } catch (err) {
        return JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
          hint: '请检查 schedule 格式是否正确。ISO时间示例: "2024-01-15T17:00:00"，Cron示例: "0 17 * * *"',
        })
      }
    },
  }
}

// ─── cancel_scheduled_task ────────────────────────────────────────────────────

function cancelScheduledTaskTool(scheduler: DynamicScheduler): Tool {
  return {
    name: 'cancel_scheduled_task',
    type: 'function',
    function: {
      name: 'cancel_scheduled_task',
      description: 'Cancel a previously scheduled task by its task ID.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'The task ID returned by schedule_task',
          },
        },
        required: ['task_id'],
      },
    },
    async run(args) {
      const taskId = args['task_id'] as string
      const cancelled = await scheduler.cancelTask(taskId)
      return JSON.stringify({
        success: cancelled,
        message: cancelled ? `任务 ${taskId} 已取消` : `未找到任务 ${taskId}`,
      })
    },
  }
}

// ─── list_scheduled_tasks ─────────────────────────────────────────────────────

function listScheduledTasksTool(scheduler: DynamicScheduler): Tool {
  return {
    name: 'list_scheduled_tasks',
    type: 'function',
    function: {
      name: 'list_scheduled_tasks',
      description: 'List all active scheduled tasks for the current user.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    async run(args, context?: ChaiteContext) {
      const event = context?.getEvent()
      const userId = String(event?.sender?.user_id ?? 'unknown')

      const tasks = await scheduler.listTasks(userId)
      if (tasks.length === 0) {
        return JSON.stringify({ tasks: [], message: '当前没有已安排的任务' })
      }

      return JSON.stringify({
        tasks: tasks.map(t => ({
          taskId: t.id,
          description: t.description,
          schedule: t.schedule,
          nextFireAt: t.nextFireAt,
          oneShot: t.oneShot,
        })),
      })
    },
  }
}
