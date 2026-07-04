import type { AgentRunContext } from '../contracts'
import type { Plan, PlanStep } from './plan.types'
import * as crypto from 'node:crypto'

/**
 * Abstract Planner interface.
 * Takes a goal and returns a structured Plan (not yet executed).
 */
export interface Planner {
  createPlan(goal: string, ctx: AgentRunContext): Promise<Plan>
}

/**
 * Default LLM-based planner.
 * Asks the LLM to produce a JSON plan with structured steps.
 * If the LLM output cannot be parsed as structured JSON, falls back to
 * a single-step plan with a direct LLM call.
 */
export class LlmPlanner implements Planner {
  constructor(private readonly planningModel?: string) {}

  async createPlan(goal: string, ctx: AgentRunContext): Promise<Plan> {
    const systemPrompt = `You are a planning assistant. Given a user goal, produce a structured execution plan.

Respond with ONLY a valid JSON array of steps, no markdown, no explanation. Format:
[
  {
    "title": "Short step title",
    "description": "Detailed description of what this step does",
    "toolHint": "optional_tool_name_or_null",
    "dependsOn": []
  }
]

Rules:
- Break the goal into 2-8 concrete, actionable steps
- Each step should be independently executable
- Use toolHint when a specific tool is clearly needed
- dependsOn should list step titles (exactly as written) that must complete first
- Keep titles short (under 10 words)`

    let rawJson = ''
    try {
      const resp = await ctx.sendMessage(`GOAL: ${goal}`, {
        model: this.planningModel,
        systemOverride: systemPrompt,
        disableHistorySave: true,
      })
      rawJson = resp.contents?.map(c => ('text' in c ? (c as { text: string }).text : '')).join('') ?? ''
    } catch (err) {
      ctx.logger.warn(`[Planner] LLM call failed, falling back to single-step plan: ${String(err)}`)
    }

    return this.parsePlanJson(rawJson, goal)
  }

  private parsePlanJson(rawJson: string, goal: string): Plan {
    const now = Date.now()
    const planId = crypto.randomUUID()

    let rawSteps: Array<{ title: string; description: string; toolHint?: string; dependsOn?: string[] }> = []

    try {
      // Extract JSON array from potential markdown code fences
      const jsonMatch = rawJson.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        rawSteps = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Fallback: single step
    }

    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      rawSteps = [{ title: 'Execute goal', description: goal }]
    }

    // Build a title→stepId map for dependsOn resolution
    const titleToId = new Map<string, string>()
    const steps: PlanStep[] = rawSteps.map((raw, i) => {
      const stepId = crypto.randomUUID()
      titleToId.set(raw.title, stepId)
      return {
        id: stepId,
        index: i + 1,
        title: raw.title ?? `Step ${i + 1}`,
        description: raw.description ?? '',
        toolHint: raw.toolHint ?? undefined,
        dependsOn: [],
        status: 'pending',
        retryCount: 0,
      }
    })

    // Resolve dependsOn titles to ids
    rawSteps.forEach((raw, i) => {
      if (Array.isArray(raw.dependsOn)) {
        steps[i].dependsOn = raw.dependsOn
          .map(title => titleToId.get(title))
          .filter((id): id is string => Boolean(id))
      }
    })

    return {
      id: planId,
      goal,
      steps,
      status: 'planning',
      revision: 0,
      createdAt: now,
      updatedAt: now,
    }
  }
}
