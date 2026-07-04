import type { AgentRunContext } from '../contracts'
import type { Planner } from './Planner'
import type { PlanReviewer } from './PlanReviewer'
import type { Plan, PlanStep } from './plan.types'
import { getPlanProgress } from './plan.types'
import * as crypto from 'node:crypto'

const PLAN_STORAGE_PREFIX = 'plan:'

export interface PlanExecutorOptions {
  planner: Planner
  /** If provided, self-correction is enabled after each step */
  reviewer?: PlanReviewer
  /** Max retries per step */
  maxStepRetries?: number
  /** Storage key prefix; defaults to "plan:" */
  storagePrefix?: string
}

/**
 * Executes a Plan created by a Planner.
 *
 * Lifecycle:
 *  1. planner.createPlan → structured Plan object
 *  2. Persist plan to storage (planId queryable by check_plan_progress)
 *  3. For each pending step (topological order):
 *     a. Set status=running, persist
 *     b. Execute step (LLM call or tool call based on toolHint)
 *     c. Set status=done/failed, persist
 *     d. Emit plan:step:end audit event (Chaite.emit job:progress)
 *     e. Optional: reviewer.review → if shouldRevise, replace pending steps
 *  4. Set plan.status=done/failed, persist
 *  5. Return final output
 */
export class PlanExecutor {
  private readonly storagePrefix: string

  constructor(private readonly opts: PlanExecutorOptions) {
    this.storagePrefix = opts.storagePrefix ?? PLAN_STORAGE_PREFIX
  }

  async execute(goal: string, ctx: AgentRunContext, jobId?: string): Promise<{ plan: Plan; output: string }> {
    // 1. Create plan
    const plan = await this.opts.planner.createPlan(goal, ctx)
    plan.jobId = jobId
    plan.status = 'executing'
    plan.updatedAt = Date.now()

    // 2. Persist
    await this.savePlan(plan, ctx)

    ctx.emitAudit?.({
      type: 'plan:start',
      timestamp: Date.now(),
      planId: plan.id,
      jobId,
      data: { goal, stepCount: plan.steps.length },
    })

    let output = ''

    try {
      output = await this.runPendingSteps(plan, ctx, jobId)
      plan.status = 'done'
    } catch (err) {
      plan.status = 'failed'
      plan.updatedAt = Date.now()
      await this.savePlan(plan, ctx)

      ctx.emitAudit?.({
        type: 'plan:failed',
        timestamp: Date.now(),
        planId: plan.id,
        jobId,
        data: { error: err instanceof Error ? err.message : String(err) },
      })

      throw err
    }

    plan.updatedAt = Date.now()
    await this.savePlan(plan, ctx)

    ctx.emitAudit?.({
      type: 'plan:complete',
      timestamp: Date.now(),
      planId: plan.id,
      jobId,
      data: { output: output.slice(0, 200) },
    })

    return { plan, output }
  }

  private async runPendingSteps(plan: Plan, ctx: AgentRunContext, jobId?: string): Promise<string> {
    let lastOutput = ''

    while (true) {
      const nextStep = this.getNextReady(plan)
      if (!nextStep) break

      // Mark running
      nextStep.status = 'running'
      nextStep.startedAt = Date.now()
      plan.updatedAt = Date.now()
      await this.savePlan(plan, ctx)

      ctx.emitAudit?.({
        type: 'plan:step:start',
        timestamp: Date.now(),
        planId: plan.id,
        jobId,
        stepId: nextStep.id,
        data: { title: nextStep.title, index: nextStep.index },
      })

      // Emit progress event for QQ notification
      ctx.emitAudit?.({
        type: 'job:progress',
        timestamp: Date.now(),
        planId: plan.id,
        jobId,
        data: getPlanProgress(plan) as unknown as Record<string, unknown>,
      })

      let stepOutput = ''
      let stepError: string | undefined

      try {
        stepOutput = await this.executeStep(nextStep, plan, ctx)
        nextStep.status = 'done'
        nextStep.result = stepOutput
        lastOutput = stepOutput
      } catch (err) {
        if (nextStep.retryCount < (this.opts.maxStepRetries ?? 1)) {
          nextStep.retryCount++
          nextStep.status = 'pending'
          ctx.logger.warn(`[PlanExecutor] Step "${nextStep.title}" failed, retrying (${nextStep.retryCount})`)
        } else {
          nextStep.status = 'failed'
          stepError = err instanceof Error ? err.message : String(err)
          nextStep.result = stepError
        }
      }

      nextStep.completedAt = Date.now()
      plan.updatedAt = Date.now()
      await this.savePlan(plan, ctx)

      ctx.emitAudit?.({
        type: 'plan:step:end',
        timestamp: Date.now(),
        planId: plan.id,
        jobId,
        stepId: nextStep.id,
        data: { status: nextStep.status, title: nextStep.title, error: stepError },
      })

      if (nextStep.status === 'failed') {
        throw new Error(`Plan step "${nextStep.title}" failed: ${stepError}`)
      }

      // Optional self-correction
      if (this.opts.reviewer && nextStep.status === 'done') {
        plan.status = 'reviewing'
        await this.savePlan(plan, ctx)

        const reviewResult = await this.opts.reviewer.review(plan, nextStep.id, ctx)
        if (reviewResult.shouldRevise && reviewResult.revisedSteps) {
          // Replace pending steps with revised ones
          for (let i = plan.steps.length - 1; i >= 0; i--) {
            if (plan.steps[i].status === 'pending') {
              plan.steps.splice(i, 1)
            }
          }
          plan.steps.push(...reviewResult.revisedSteps)
          plan.revision++
          plan.updatedAt = Date.now()
          await this.savePlan(plan, ctx)

          ctx.emitAudit?.({
            type: 'plan:step:revised',
            timestamp: Date.now(),
            planId: plan.id,
            jobId,
            data: { reason: reviewResult.reason, newStepCount: reviewResult.revisedSteps.length },
          })

          ctx.logger.info(`[PlanExecutor] Plan revised (revision ${plan.revision}): ${reviewResult.reason}`)
        }

        plan.status = 'executing'
        await this.savePlan(plan, ctx)
      }
    }

    return lastOutput
  }

  private getNextReady(plan: Plan): PlanStep | null {
    const doneIds = new Set(plan.steps.filter(s => s.status === 'done' || s.status === 'skipped').map(s => s.id))

    return (
      plan.steps.find(s => {
        if (s.status !== 'pending') return false
        return !s.dependsOn || s.dependsOn.every(depId => doneIds.has(depId))
      }) ?? null
    )
  }

  private async executeStep(step: PlanStep, plan: Plan, ctx: AgentRunContext): Promise<string> {
    // Build context from prior steps
    const doneContext = plan.steps
      .filter(s => s.status === 'done' && s.result)
      .map(s => `[${s.index}] ${s.title}: ${(s.result ?? '').slice(0, 400)}`)
      .join('\n')

    const contextPrefix = doneContext
      ? `Context from previous steps:\n${doneContext}\n\n`
      : ''

    // Try tool first if hinted
    if (step.toolHint && ctx.toolExecutor) {
      const toolSchemas = await ctx.toolExecutor.listAvailableTools?.({
        runId: crypto.randomUUID(),
        userId: 'planner',
        planId: plan.id,
      })
      const toolExists = toolSchemas?.some(t => t.name === step.toolHint)

      if (toolExists) {
        const result = await ctx.toolExecutor.execute(
          {
            id: crypto.randomUUID(),
            name: step.toolHint,
            arguments: { query: step.description, context: contextPrefix },
          },
          {
            runId: crypto.randomUUID(),
            userId: 'planner',
            planId: plan.id,
          },
        )
        if (result.ok) return result.outputText
        ctx.logger.warn(`[PlanExecutor] Tool "${step.toolHint}" failed for step "${step.title}", falling back to LLM`)
      }
    }

    // LLM fallback
    const prompt = `${contextPrefix}Task: ${step.title}\n\nDetails: ${step.description}\n\nGoal: ${plan.goal}`
    const resp = await ctx.sendMessage(prompt)
    return resp.contents?.map(c => ('text' in c ? (c as { text: string }).text : '')).join('') ?? ''
  }

  async getPlan(planId: string, ctx: AgentRunContext): Promise<Plan | null> {
    return (ctx.storage.getItem(this.storagePrefix + planId) as Promise<Plan | null>)
  }

  private async savePlan(plan: Plan, ctx: AgentRunContext): Promise<void> {
    await ctx.storage.setItem(this.storagePrefix + plan.id, plan as unknown as never)
  }
}
