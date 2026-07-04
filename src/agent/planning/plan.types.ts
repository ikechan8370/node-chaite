export type PlanStepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped' | 'revised'
export type PlanStatus = 'planning' | 'executing' | 'reviewing' | 'done' | 'failed'

export interface PlanStep {
  id: string
  /** 1-based display index */
  index: number
  /** Short title shown in progress notifications */
  title: string
  description: string
  /** Hint about which tool to use; LLM may suggest this */
  toolHint?: string
  /** Step ids this step depends on */
  dependsOn?: string[]
  status: PlanStepStatus
  /** Step output after execution */
  result?: string
  startedAt?: number
  completedAt?: number
  retryCount: number
}

export interface Plan {
  id: string
  /** Associated background job id, if running asynchronously */
  jobId?: string
  goal: string
  steps: PlanStep[]
  status: PlanStatus
  /** How many times the plan has been revised during execution */
  revision: number
  createdAt: number
  updatedAt: number
}

/** Compact progress snapshot for QQ push notifications */
export interface PlanProgress {
  planId: string
  goal: string
  status: PlanStatus
  totalSteps: number
  doneSteps: number
  currentStep?: {
    index: number
    title: string
    status: PlanStepStatus
  }
  revision: number
}

export function getPlanProgress(plan: Plan): PlanProgress {
  const done = plan.steps.filter(s => s.status === 'done').length
  const current = plan.steps.find(s => s.status === 'running' || s.status === 'pending')

  return {
    planId: plan.id,
    goal: plan.goal,
    status: plan.status,
    totalSteps: plan.steps.length,
    doneSteps: done,
    currentStep: current
      ? { index: current.index, title: current.title, status: current.status }
      : undefined,
    revision: plan.revision,
  }
}
