import { request } from '../http'

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface AgentPage<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface AgentPageQuery {
  page?: number
  pageSize?: number
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export type SkillExecutionMode = 'direct' | 'plan' | 'workflow'

export interface SkillFrontmatter {
  name: string
  description: string
  keywords?: string[]
  version?: string
  executionMode?: SkillExecutionMode
  workflowRef?: string
  preset?: string
  planningModel?: string
  allowedTools?: string[]
  processors?: string[]
  triggers?: string[]
  readonly?: boolean
  mcpServer?: string
  mcpTools?: string[]
}

export interface SkillMeta {
  id: string
  rootDir: string
  frontmatter: SkillFrontmatter
}

export interface SkillDetail extends SkillFrontmatter {
  id: string
  rootDir: string
  instructions: string
}

export interface SkillListQuery extends AgentPageQuery {
  name?: string
  executionMode?: SkillExecutionMode
}

export interface CreateSkillDTO {
  name: string
  description: string
  systemPrompt: string
  executionMode?: SkillExecutionMode
  allowedTools?: string[]
  preset?: string
  planningModel?: string
  keywords?: string[]
  mcpServer?: string
  mcpTools?: string[]
  overwrite?: boolean
}

export interface UpdateSkillDTO {
  description?: string
  systemPrompt?: string
  executionMode?: SkillExecutionMode
  allowedTools?: string[]
  preset?: string
  planningModel?: string
  keywords?: string[]
  mcpServer?: string
  mcpTools?: string[]
}

export interface RunSkillDTO {
  goal?: string
  userId?: string
  groupId?: string
  background?: boolean
}

export function fetchSkillList(query: SkillListQuery = {}) {
  return request.Get<Service.ResponseResult<AgentPage<SkillMeta>>>('/api/agent/skills', { params: query })
}

export function fetchSkillDetail(name: string) {
  return request.Get<Service.ResponseResult<SkillDetail>>(`/api/agent/skills/${encodeURIComponent(name)}`)
}

export function reloadSkills() {
  return request.Post<Service.ResponseResult<{ count: number }>>('/api/agent/skills/reload', {})
}

export function createSkill(data: CreateSkillDTO) {
  return request.Post<Service.ResponseResult<{ name: string; created: boolean }>>('/api/agent/skills', data)
}

export function updateSkill(name: string, data: UpdateSkillDTO) {
  return request.Patch<Service.ResponseResult<{ name: string; updated: boolean }>>(`/api/agent/skills/${encodeURIComponent(name)}`, data)
}

export function deleteSkill(name: string) {
  return request.Delete<Service.ResponseResult<{ name: string; deleted: boolean }>>(`/api/agent/skills/${encodeURIComponent(name)}`)
}

export function runSkill(name: string, data: RunSkillDTO = {}) {
  return request.Post<Service.ResponseResult<any>>(`/api/agent/skills/${encodeURIComponent(name)}/run`, data)
}

// ─── Background Jobs ──────────────────────────────────────────────────────────

export interface BackgroundJob {
  id: string
  description: string
  userId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload?: unknown
  result?: unknown
  error?: string
  createdAt: number
  updatedAt?: number
}

export interface JobListQuery extends AgentPageQuery {
  userId?: string
  status?: BackgroundJob['status']
}

export function fetchJobList(query: JobListQuery = {}) {
  return request.Get<Service.ResponseResult<AgentPage<BackgroundJob>>>('/api/agent/jobs', { params: query })
}

export function fetchJobDetail(id: string) {
  return request.Get<Service.ResponseResult<BackgroundJob>>(`/api/agent/jobs/${id}`)
}

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

export interface ScheduledTask {
  id: string
  userId?: string
  description?: string
  cronExpression?: string
  nextRunAt?: number
  lastRunAt?: number
  status: 'active' | 'paused' | 'completed' | 'failed'
  createdAt?: number
}

export interface ScheduledTaskListQuery extends AgentPageQuery {
  userId?: string
}

export function fetchScheduledTaskList(query: ScheduledTaskListQuery = {}) {
  return request.Get<Service.ResponseResult<AgentPage<ScheduledTask>>>('/api/agent/scheduled-tasks', { params: query })
}

export function fetchScheduledTaskDetail(id: string) {
  return request.Get<Service.ResponseResult<ScheduledTask>>(`/api/agent/scheduled-tasks/${id}`)
}

export function cancelScheduledTask(id: string) {
  return request.Delete<Service.ResponseResult<{ cancelled: boolean }>>(`/api/agent/scheduled-tasks/${id}`)
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanStep {
  id: string
  description: string
  status: 'pending' | 'running' | 'done' | 'failed'
  output?: string
}

export interface AgentPlan {
  id: string
  goal: string
  status: 'pending' | 'running' | 'done' | 'failed'
  steps: PlanStep[]
  createdAt?: number
}

export function fetchPlan(id: string) {
  return request.Get<Service.ResponseResult<AgentPlan>>(`/api/agent/plans/${id}`)
}

// ─── MCP Servers ──────────────────────────────────────────────────────────────

export interface McpServerConfig {
  id: string
  name: string
  description?: string
  transport?: 'streamable-http' | 'sse' | 'stdio'
  url?: string
  baseUrl?: string
  headers?: Record<string, string>
  authHeader?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  toolGroupIds?: string[]
  tools?: Array<{ name: string; description?: string; schema?: unknown }>
  toolsDiscoveredAt?: number
  timeoutMs?: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export type CreateMcpServerDTO = Omit<McpServerConfig, 'id' | 'createdAt' | 'updatedAt'>

export interface McpTestResult {
  ok: boolean
  toolCount: number
  cachedToolCount?: number
  tools: Array<{ name: string; description?: string }>
}

export function fetchMcpServerList(query: AgentPageQuery = {}) {
  return request.Get<Service.ResponseResult<AgentPage<McpServerConfig>>>('/api/agent/mcp-servers', { params: query })
}

export function fetchMcpServerDetail(id: string) {
  return request.Get<Service.ResponseResult<McpServerConfig>>(`/api/agent/mcp-servers/${id}`)
}

export function createMcpServer(data: CreateMcpServerDTO) {
  return request.Post<Service.ResponseResult<McpServerConfig>>('/api/agent/mcp-servers', data)
}

export function updateMcpServer(id: string, data: Partial<CreateMcpServerDTO>) {
  return request.Patch<Service.ResponseResult<McpServerConfig>>(`/api/agent/mcp-servers/${id}`, data)
}

export function deleteMcpServer(id: string) {
  return request.Delete<Service.ResponseResult<{ deleted: boolean }>>(`/api/agent/mcp-servers/${id}`)
}

export function testMcpServer(id: string) {
  return request.Post<Service.ResponseResult<McpTestResult>>(`/api/agent/mcp-servers/${id}/test`, {})
}
