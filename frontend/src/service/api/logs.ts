import { request } from '../http'

export type OperationLogType =
  | 'llm.call'
  | 'tool.call'
  | 'tool.error'
  | 'job.queued'
  | 'job.start'
  | 'job.complete'
  | 'job.failed'
  | 'job.progress'
  | 'task.fire'
  | 'task.complete'
  | 'task.failed'
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
  summary: string
  detail?: string
  userId?: string
  conversationId?: string
  model?: string
  toolName?: string
  skillName?: string
  jobId?: string
  planId?: string
  stepId?: string
  durationMs?: number
  inputTokens?: number
  outputTokens?: number
  metadata?: Record<string, unknown>
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
  last24h: number
  avgLlmDurationMs: number
  totalTokens: number
}

export interface ListLogsQuery {
  type?: OperationLogType
  level?: OperationLogLevel
  userId?: string
  keyword?: string
  from?: number
  to?: number
  page?: number
  pageSize?: number
}

export function fetchLogs(query: ListLogsQuery = {}) {
  return request.Get<Service.ResponseResult<LogsPage>>('/api/logs', { params: query })
}

export function fetchLogsStats() {
  return request.Get<Service.ResponseResult<LogsStats>>('/api/logs/stats')
}

export function clearLogs(filter: Pick<ListLogsQuery, 'type' | 'level' | 'userId' | 'from' | 'to'> = {}) {
  return request.Delete<Service.ResponseResult<{ deleted: number }>>('/api/logs', { params: filter })
}
