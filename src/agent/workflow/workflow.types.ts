export type WorkflowStepType =
  | 'llm'         // LLM call, result stored as step output
  | 'tool'        // Direct tool call via ToolExecutor
  | 'condition'   // Branch based on expression over previous step outputs
  | 'parallel'    // Run multiple sub-steps concurrently
  | 'background'  // Spawn as a background job (fire and forget)
  | 'plan'        // Delegate to the Planning module (dynamic sub-plan)
  | 'subworkflow' // Inline nested workflow

export type OnError = 'abort' | 'skip' | 'retry'

export interface WorkflowStepBase {
  id: string
  type: WorkflowStepType
  /** Human-readable label shown in progress output */
  label?: string
  /** Step ids that must complete before this step runs */
  dependsOn?: string[]
  onError?: OnError
  retryMax?: number
}

export interface LlmStep extends WorkflowStepBase {
  type: 'llm'
  /** Goal/prompt to send to the LLM */
  goal: string
  /** Injected outputs from prior steps: {stepId} is replaced with that step's output */
  model?: string
}

export interface ToolStep extends WorkflowStepBase {
  type: 'tool'
  toolName: string
  /** Static args; use "{{stepId}}" template to reference prior step outputs */
  args?: Record<string, unknown>
}

export interface ConditionStep extends WorkflowStepBase {
  type: 'condition'
  /**
   * A JavaScript expression string evaluated with `new Function`.
   * Available variable: `outputs` (Record<stepId, string>).
   * Should return a string: the id of the branch step to run next.
   */
  expression: string
  branches: Record<string, WorkflowStep[]>
}

export interface ParallelStep extends WorkflowStepBase {
  type: 'parallel'
  steps: WorkflowStep[]
}

export interface BackgroundStep extends WorkflowStepBase {
  type: 'background'
  description: string
  /** Inner workflow or goal to run as a background job */
  goal?: string
  workflowDef?: WorkflowDefinition
}

export interface PlanStep extends WorkflowStepBase {
  type: 'plan'
  goal: string
  planningModel?: string
}

export interface SubworkflowStep extends WorkflowStepBase {
  type: 'subworkflow'
  workflowDef: WorkflowDefinition
}

export type WorkflowStep =
  | LlmStep
  | ToolStep
  | ConditionStep
  | ParallelStep
  | BackgroundStep
  | PlanStep
  | SubworkflowStep

export type WorkflowOnComplete = 'push_qq' | 'reply' | 'silent'

export interface WorkflowDefinition {
  id: string
  name?: string
  description?: string
  steps: WorkflowStep[]
  onComplete?: WorkflowOnComplete
}

export interface WorkflowStepResult {
  stepId: string
  status: 'done' | 'failed' | 'skipped'
  output?: string
  error?: string
  startedAt: number
  completedAt: number
}

export interface WorkflowRunResult {
  workflowId: string
  status: 'done' | 'failed'
  stepResults: WorkflowStepResult[]
  finalOutput?: string
  error?: string
  startedAt: number
  completedAt: number
}
