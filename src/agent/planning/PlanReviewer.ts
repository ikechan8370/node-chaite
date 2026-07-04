import type { AgentRunContext } from '../contracts'
import type { Plan, PlanStep } from './plan.types'
import * as crypto from 'node:crypto'

export interface ReviewResult {
  /** Whether the remaining plan should be revised */
  shouldRevise: boolean
  /** Replacement for remaining pending steps; undefined = keep as-is */
  revisedSteps?: PlanStep[]
  reason?: string
}

/**
 * Abstract PlanReviewer interface.
 * Called after each step completes to decide whether to revise the remaining plan.
 */
export interface PlanReviewer {
  review(plan: Plan, completedStepId: string, ctx: AgentRunContext): Promise<ReviewResult>
}

/**
 * LLM-based plan reviewer.
 * Asks the LLM whether the remaining steps should be revised given what was learned.
 * Only triggers if the step result is significantly unexpected.
 */
export class LlmPlanReviewer implements PlanReviewer {
  constructor(private readonly model?: string) {}

  async review(plan: Plan, completedStepId: string, ctx: AgentRunContext): Promise<ReviewResult> {
    const completedStep = plan.steps.find(s => s.id === completedStepId)
    if (!completedStep) return { shouldRevise: false }

    const pendingSteps = plan.steps.filter(s => s.status === 'pending' || s.status === 'running')
    if (pendingSteps.length === 0) return { shouldRevise: false }

    const doneSteps = plan.steps.filter(s => s.status === 'done')
    const doneContext = doneSteps
      .map(s => `[${s.index}] ${s.title}: ${(s.result ?? '').slice(0, 300)}`)
      .join('\n')

    const pendingContext = pendingSteps
      .map(s => `[${s.index}] ${s.title}: ${s.description}`)
      .join('\n')

    const systemPrompt = `You are a plan reviewer. Evaluate whether a remaining execution plan needs revision based on what was just learned.

Respond with ONLY a JSON object:
{
  "shouldRevise": true/false,
  "reason": "Brief reason (optional)",
  "revisedSteps": [  // Only include if shouldRevise=true
    { "title": "...", "description": "...", "toolHint": "..." }
  ]
}`

    const prompt = `GOAL: ${plan.goal}

COMPLETED STEPS:
${doneContext}

JUST COMPLETED: [${completedStep.index}] ${completedStep.title}
Result: ${(completedStep.result ?? '').slice(0, 500)}

REMAINING STEPS:
${pendingContext}

Should the remaining steps be revised?`

    try {
      const resp = await ctx.sendMessage(prompt, {
        model: this.model,
        systemOverride: systemPrompt,
        disableHistorySave: true,
      })
      const rawJson = resp.contents?.map(c => ('text' in c ? (c as { text: string }).text : '')).join('') ?? ''
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { shouldRevise: false }

      const parsed = JSON.parse(jsonMatch[0]) as {
        shouldRevise: boolean
        reason?: string
        revisedSteps?: Array<{ title: string; description: string; toolHint?: string }>
      }

      if (!parsed.shouldRevise) return { shouldRevise: false, reason: parsed.reason }

      // Build new PlanStep list for pending steps
      const startIndex = (doneSteps.length) + 1
      const revisedSteps: PlanStep[] = (parsed.revisedSteps ?? []).map((raw, i) => ({
        id: crypto.randomUUID(),
        index: startIndex + i,
        title: raw.title,
        description: raw.description,
        toolHint: raw.toolHint,
        dependsOn: [],
        status: 'pending' as const,
        retryCount: 0,
      }))

      return { shouldRevise: true, revisedSteps, reason: parsed.reason }
    } catch (err) {
      ctx.logger.warn(`[PlanReviewer] Review failed, keeping original plan: ${String(err)}`)
      return { shouldRevise: false }
    }
  }
}

/**
 * No-op reviewer that never revises.
 * Use when you want deterministic execution without LLM-based self-correction.
 */
export class NoopPlanReviewer implements PlanReviewer {
  review(_plan: Plan, _completedStepId: string, _ctx: AgentRunContext): Promise<ReviewResult> {
    return Promise.resolve({ shouldRevise: false })
  }
}
