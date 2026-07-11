/**
 * Operation log types for tracking all AI system activities.
 */

/** Fine-grained categories of AI system operations */
export type OperationLogType =
  // LLM calls
  | 'llm.call'
  | 'processor.call'
  | 'processor.error'
  | 'trigger.call'
  | 'trigger.error'
  // Tool execution
  | 'tool.call'
  | 'tool.error'
  // Background jobs
  | 'job.queued'
  | 'job.start'
  | 'job.complete'
  | 'job.failed'
  | 'job.progress'
  // Dynamic scheduled tasks
  | 'task.fire'
  | 'task.complete'
  | 'task.failed'
  // Agent planning
  | 'plan.start'
  | 'plan.step.start'
  | 'plan.step.end'
  | 'plan.complete'
  | 'plan.failed'

export type OperationLogLevel = 'info' | 'warn' | 'error'

export interface OperationLog {
  id: string
  timestamp: number
  type: OperationLogType
  level: OperationLogLevel
  /** Short human-readable summary */
  summary: string
  /** Extended detail, error message or result snippet */
  detail?: string
  userId?: string
  /** QQ group id; omitted for private conversations and system tasks */
  groupId?: string
  conversationId?: string
  channelId?: string
  channelName?: string
  /** Model name for LLM calls */
  model?: string
  presetId?: string
  presetName?: string
  /** Tool name for tool.call / tool.error */
  toolName?: string
  processorName?: string
  triggerName?: string
  skillName?: string
  jobId?: string
  planId?: string
  stepId?: string
  /** Elapsed time in milliseconds */
  durationMs?: number
  /** Input tokens consumed (LLM calls) */
  inputTokens?: number
  /** Output tokens produced (LLM calls) */
  outputTokens?: number
  totalTokens?: number
  cachedTokens?: number
  reasoningTokens?: number
  /** Arbitrary extra metadata */
  metadata?: Record<string, unknown>
}

export interface ListLogsFilter {
  type?: OperationLogType
  level?: OperationLogLevel
  userId?: string
  groupId?: string
  channelId?: string
  model?: string
  presetId?: string
  toolName?: string
  processorName?: string
  triggerName?: string
  /** Unix ms — only logs at or after this time */
  from?: number
  /** Unix ms — only logs at or before this time */
  to?: number
  /** Keyword search in summary / detail */
  keyword?: string
  page?: number
  pageSize?: number
}

export interface LogsPage {
  items: OperationLog[]
  total: number
  page: number
  pageSize: number
}

export interface LogsStats {
  total: number
  byType: Partial<Record<OperationLogType, number>>
  byLevel: Record<OperationLogLevel, number>
  /** Count of logs in last 24 h */
  last24h: number
  /** Avg LLM call duration ms */
  avgLlmDurationMs: number
  /** Total tokens (input + output) */
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  errorRate: number
  byChannel: Record<string, number>
  byModel: Record<string, number>
  byPreset: Record<string, number>
}
