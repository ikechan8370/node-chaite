import type { AgentRunContext } from '../contracts'
import type { WorkflowEngine } from './WorkflowEngine'
import type {
  BackgroundStep,
  ConditionStep,
  LlmStep,
  ParallelStep,
  PlanStep,
  SubworkflowStep,
  ToolStep,
  WorkflowDefinition,
  WorkflowRunResult,
  WorkflowStep,
  WorkflowStepResult,
} from './workflow.types'
import * as crypto from 'node:crypto'

/**
 * Lightweight workflow runner.
 * Supports: sequential, conditional branching, parallel (Promise.all),
 * background jobs, plan steps, and nested sub-workflows.
 */
export class SimpleWorkflowRunner implements WorkflowEngine {
  async run(workflow: WorkflowDefinition, ctx: AgentRunContext): Promise<WorkflowRunResult> {
    const startedAt = Date.now()
    const stepResults: WorkflowStepResult[] = []
    /** Map of stepId → string output for template interpolation */
    const outputs: Record<string, string> = {}

    try {
      await this.runSteps(workflow.steps, ctx, stepResults, outputs)

      const finalOutput = stepResults.length > 0
        ? (stepResults.at(-1)?.output ?? '')
        : ''

      return {
        workflowId: workflow.id,
        status: 'done',
        stepResults,
        finalOutput,
        startedAt,
        completedAt: Date.now(),
      }
    } catch (err) {
      return {
        workflowId: workflow.id,
        status: 'failed',
        stepResults,
        error: err instanceof Error ? err.message : String(err),
        startedAt,
        completedAt: Date.now(),
      }
    }
  }

  private async runSteps(
    steps: WorkflowStep[],
    ctx: AgentRunContext,
    results: WorkflowStepResult[],
    outputs: Record<string, string>,
  ): Promise<void> {
    // Build a simple topological order respecting dependsOn
    const remaining = [...steps]

    while (remaining.length > 0) {
      // Find all steps whose dependencies are satisfied
      const ready = remaining.filter(
        s => !s.dependsOn || s.dependsOn.every(dep => dep in outputs),
      )

      if (ready.length === 0) {
        const ids = remaining.map(s => s.id).join(', ')
        throw new Error(`Workflow deadlock: unsatisfied dependencies for steps [${ids}]`)
      }

      // Run all ready steps that aren't part of a conditional branch
      for (const step of ready) {
        remaining.splice(remaining.indexOf(step), 1)
        const result = await this.runStep(step, ctx, outputs)
        results.push(result)
        if (result.status !== 'skipped') {
          outputs[step.id] = result.output ?? ''
        }
        if (result.status === 'failed' && step.onError === 'abort') {
          throw new Error(`Step "${step.id}" failed: ${result.error}`)
        }
      }
    }
  }

  private async runStep(
    step: WorkflowStep,
    ctx: AgentRunContext,
    outputs: Record<string, string>,
  ): Promise<WorkflowStepResult> {
    const startedAt = Date.now()
    const base = { stepId: step.id, startedAt, completedAt: 0 }

    const retries = step.retryMax ?? 0
    let lastErr: Error | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const output = await this.executeStep(step, ctx, outputs)
        return { ...base, status: 'done', output, completedAt: Date.now() }
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err))
        if (attempt < retries) {
          ctx.logger.warn(`[Workflow] Step "${step.id}" failed (attempt ${attempt + 1}), retrying: ${lastErr.message}`)
        }
      }
    }

    if (step.onError === 'skip') {
      return { ...base, status: 'skipped', completedAt: Date.now() }
    }

    return {
      ...base,
      status: 'failed',
      error: lastErr?.message ?? 'Unknown error',
      completedAt: Date.now(),
    }
  }

  private interpolate(template: string, outputs: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, id: string) => outputs[id] ?? '')
  }

  private async executeStep(
    step: WorkflowStep,
    ctx: AgentRunContext,
    outputs: Record<string, string>,
  ): Promise<string> {
    switch (step.type) {
    case 'llm': {
      const llmStep = step as LlmStep
      const goal = this.interpolate(llmStep.goal, outputs)
      const resp = await ctx.sendMessage(goal, llmStep.model ? { model: llmStep.model } : undefined)
      return resp.contents?.map(c => ('text' in c ? (c as { text: string }).text : '')).join('') ?? ''
    }

    case 'tool': {
      const toolStep = step as ToolStep
      if (!ctx.toolExecutor) {
        throw new Error('No toolExecutor configured for tool step')
      }
      const args: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(toolStep.args ?? {})) {
        args[k] = typeof v === 'string' ? this.interpolate(v, outputs) : v
      }
      const result = await ctx.toolExecutor.execute(
        { id: crypto.randomUUID(), name: toolStep.toolName, arguments: args },
        { runId: crypto.randomUUID(), userId: 'workflow' },
      )
      if (!result.ok) throw new Error(result.error?.message ?? 'Tool failed')
      return result.outputText
    }

    case 'condition': {
      const condStep = step as ConditionStep
      // eslint-disable-next-line no-new-func
      const branchId = new Function('outputs', `return (${condStep.expression})`)(outputs) as string
      const branchSteps = condStep.branches[branchId]
      if (!branchSteps) throw new Error(`Condition branch "${branchId}" not found`)
      const subResults: WorkflowStepResult[] = []
      const subOutputs = { ...outputs }
      await this.runSteps(branchSteps, ctx, subResults, subOutputs)
      return subResults.at(-1)?.output ?? ''
    }

    case 'parallel': {
      const parallelStep = step as ParallelStep
      const settled = await Promise.allSettled(
        parallelStep.steps.map(async s => {
          const r = await this.runStep(s, ctx, outputs)
          return r.output ?? ''
        }),
      )
      return settled
        .map(r => (r.status === 'fulfilled' ? r.value : `[ERROR: ${r.reason}]`))
        .join('\n')
    }

    case 'background': {
      const bgStep = step as BackgroundStep
      if (!ctx.jobManager) {
        throw new Error('No jobManager configured for background step')
      }
      const jobId = await ctx.jobManager.createAndRun({
        description: bgStep.description,
        userId: 'workflow',
        payload: bgStep.goal ? { goal: bgStep.goal } : { workflowDef: bgStep.workflowDef },
      })
      return jobId
    }

    case 'plan': {
      const planStep = step as PlanStep
      // Dynamic plan execution — delegated to PlanExecutor via sendMessage with special prefix
      const goal = this.interpolate(planStep.goal, outputs)
      const resp = await ctx.sendMessage(goal, planStep.planningModel ? { model: planStep.planningModel } : undefined)
      return resp.contents?.map(c => ('text' in c ? (c as { text: string }).text : '')).join('') ?? ''
    }

    case 'subworkflow': {
      const subStep = step as SubworkflowStep
      const subResult = await this.run(subStep.workflowDef, ctx)
      if (subResult.status === 'failed') throw new Error(subResult.error)
      return subResult.finalOutput ?? ''
    }

    default: {
      const _exhaustive: never = step
      throw new Error(`Unknown workflow step type: ${(_exhaustive as WorkflowStep).type}`)
    }
    }
  }
}
