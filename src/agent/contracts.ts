/**
 * Core agent contracts — all fundamental interfaces live here.
 * Other agent modules import types from this file to avoid circular dependencies.
 */

import type { ModelResponse } from '../types/models'
import type { BasicStorage } from '../types/storage'
import type { ILogger } from '../types/common'

// ─── Tool Execution ───────────────────────────────────────────────────────────

export interface AgentToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  id: string
  name: string
  ok: boolean
  outputText: string
  error?: {
    kind: 'RETRYABLE' | 'POLICY_DENIED' | 'FATAL'
    message: string
    cause?: unknown
  }
  meta?: Record<string, unknown>
}

export interface ToolSchema {
  name: string
  description?: string
  schema?: unknown
}

export interface ExecutionContext {
  runId: string
  userId: string
  groupId?: string
  conversationId?: string
  skillName?: string
  jobId?: string
  planId?: string
  timeoutMs?: number
  tags?: Record<string, string>
}

export interface ToolExecutor {
  execute(call: AgentToolCall, ctx: ExecutionContext): Promise<ToolResult>
  listAvailableTools?(ctx: ExecutionContext): Promise<ToolSchema[]>
}

// ─── Sandbox ──────────────────────────────────────────────────────────────────

export interface SandboxOptions {
  timeoutMs?: number
  /** Allowed env vars; empty = no env passed */
  env?: Record<string, string>
  maxOutputBytes?: number
}

export interface SandboxResult {
  output: string
  exitCode: number
  timedOut: boolean
}

/**
 * Abstract sandbox execution contract.
 * Local impl: child_process with restricted env + timeout.
 * Remote impl: POST to a REST sandbox API.
 */
export interface SandboxExecutor {
  run(entry: string, argsJson: string, opts?: SandboxOptions): Promise<SandboxResult>
}

// ─── Background Jobs ─────────────────────────────────────────────────────────

/** Minimal interface used by workflow/plan steps to avoid circular dep */
export interface IBackgroundJobManager {
  createAndRun(spec: BackgroundJobSpec): Promise<string>
  getJob(jobId: string): Promise<import('./background/job.types').BackgroundJob | null>
}

export interface BackgroundJobSpec {
  description: string
  userId: string
  groupId?: string
  skillName?: string
  conversationId?: string
  /** Arbitrary data for the executor to consume */
  payload?: Record<string, unknown>
}

// ─── Agent Run Context ────────────────────────────────────────────────────────

/**
 * Runtime context passed to workflow runners and plan executors.
 * Injected by Chaite at execution time — avoids constructor-level circular deps.
 */
export interface AgentRunContext {
  /** Send a message through the main LLM pipeline */
  sendMessage(goal: string, options?: Record<string, unknown>): Promise<ModelResponse>
  toolExecutor?: ToolExecutor
  storage: BasicStorage<unknown>
  logger: ILogger
  jobManager?: IBackgroundJobManager
  /** Emit a structured audit/progress event */
  emitAudit?(event: AuditEvent): void
}

// ─── Audit & Observability ────────────────────────────────────────────────────

export type AuditEventType =
  | 'tool:start'
  | 'tool:end'
  | 'tool:error'
  | 'job:queued'
  | 'job:start'
  | 'job:complete'
  | 'job:failed'
  | 'job:progress'
  | 'plan:start'
  | 'plan:step:start'
  | 'plan:step:end'
  | 'plan:step:revised'
  | 'plan:complete'
  | 'plan:failed'

export interface AuditEvent {
  type: AuditEventType
  timestamp: number
  runId?: string
  jobId?: string
  planId?: string
  stepId?: string
  userId?: string
  groupId?: string
  data?: Record<string, unknown>
}

export interface AuditEmitter {
  emit(event: AuditEvent): void
}
