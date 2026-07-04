import { request } from '../http'

// Memory Config Types
export interface SimpleExtensionConfig {
  enable: boolean
  libraryPath: string
  dictPath: string
  useJieba: boolean
}

export interface MemoryConfig {
  database: string
  vectorDimensions: number
  group: {
    enable: boolean
    enabledGroups: string[]
    extractionModel: string
    extractionPresetId: string
    minMessageCount: number
    maxMessageWindow: number
    retrievalMode: 'vector' | 'keyword' | 'hybrid'
    hybridPrefer: 'vector-first' | 'keyword-first'
    historyPollInterval: number
    historyBatchSize: number
    promptHeader?: string
    promptItemTemplate?: string
    promptFooter?: string
    extractionSystemPrompt?: string
    extractionUserPrompt?: string
    vectorMaxDistance?: number
    textMaxBm25Score?: number
    maxFactsPerInjection: number
    minImportanceForInjection: number
  }
  user: {
    enable: boolean
    whitelist: string[]
    blacklist: string[]
    extractionModel: string
    extractionPresetId: string
    maxItemsPerInjection: number
    maxRelevantItemsPerQuery: number
    minImportanceForInjection: number
    promptHeader?: string
    promptItemTemplate?: string
    promptFooter?: string
    extractionSystemPrompt?: string
    extractionUserPrompt?: string
  }
  extensions: {
    simple: SimpleExtensionConfig
  }
}

// Group Facts Types
export interface GroupFact {
  id?: number
  group_id: string
  fact: string
  topic?: string
  importance: number
  source_message_ids?: string // JSON string
  source_messages?: string
  involved_users?: string // JSON string
  created_at?: string
  distance?: number // For vector search results
  bm25_score?: number // For text search results
}

export interface GroupFactsListParams {
  groupId: string
  limit?: number
  offset?: number
}

export interface SaveGroupFactsParams {
  groupId: string
  facts: Array<{
    fact: string
    topic?: string
    importance?: number
    source_message_ids?: any[] // Will be converted to JSON string
    sourceMessages?: string
    source_messages?: string
    involved_users?: string[]
    involvedUsers?: string[]
  }>
}

export interface QueryGroupFactsParams {
  groupId: string
  query: string
  limit?: number
  minImportance?: number
}

// User Memories Types
export interface UserMemory {
  id?: number
  user_id: string
  group_id?: string | null
  value: string
  importance: number
  source_message_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface UserMemoriesListParams {
  userId?: string
  groupId?: string | null
  limit?: number
  offset?: number
}

export interface QueryUserMemoriesParams {
  userId: string
  groupId?: string | null
  query: string
  totalLimit?: number
  searchLimit?: number
  minImportance?: number
}

export type UpsertUserMemoryPayload =
  | string
  | {
    value: string
    importance?: number
    source_message_id?: string
  }

export interface UpsertUserMemoriesParams {
  userId: string
  groupId?: string | null
  memories: UpsertUserMemoryPayload[]
}

// Memory Config APIs
export function fetchMemoryConfig() {
  return request.Get<Service.ResponseResult<MemoryConfig>>('/api/memory/config')
}

export function updateMemoryConfig(config: MemoryConfig) {
  return request.Post<Service.ResponseResult<MemoryConfig>>('/api/memory/config', config)
}

// Group Facts APIs
export function fetchGroupFacts(params: GroupFactsListParams) {
  const { groupId, limit = 50, offset = 0 } = params
  return request.Get<Service.ResponseResult<GroupFact[]>>(
    `/api/memory/group/${groupId}/facts`,
    {
      params: { limit, offset },
    },
  )
}

export function saveGroupFacts(params: SaveGroupFactsParams) {
  const { groupId, facts } = params
  return request.Post<Service.ResponseResult<any>>(
    `/api/memory/group/${groupId}/facts`,
    { facts },
  )
}

export function queryGroupFacts(params: QueryGroupFactsParams) {
  const { groupId, query, limit, minImportance } = params
  return request.Post<Service.ResponseResult<GroupFact[]>>(
    `/api/memory/group/${groupId}/query`,
    { query, limit, minImportance },
  )
}

export function deleteGroupFact(groupId: string, factId: string) {
  return request.Delete<Service.ResponseResult<{ removed: boolean }>>(
    `/api/memory/group/${groupId}/facts/${factId}`,
  )
}

// User Memories APIs
export function fetchUserMemories(params: UserMemoriesListParams) {
  const { userId, groupId = null, limit = 50, offset = 0 } = params
  const query: Record<string, any> = { limit, offset }
  if (userId && userId.trim()) {
    query.userId = userId.trim()
  }
  if (groupId && `${groupId}`.trim()) {
    query.groupId = `${groupId}`.trim()
  }
  return request.Get<Service.ResponseResult<UserMemory[]>>(
    '/api/memory/user/memories',
    {
      params: query,
    },
  )
}

export function upsertUserMemories(params: UpsertUserMemoriesParams) {
  const { userId, groupId = null, memories } = params
  return request.Post<Service.ResponseResult<{ updated: number }>>(
    `/api/memory/user/${userId}/memories`,
    { groupId, memories },
  )
}

export function deleteUserMemory(userId: string, memoryId: string) {
  return request.Delete<Service.ResponseResult<{ removed: boolean }>>(
    `/api/memory/user/${userId}/memories/${memoryId}`,
  )
}

export function deleteMemoryById(memoryId: string) {
  return request.Delete<Service.ResponseResult<{ removed: boolean }>>(
    `/api/memory/memories/${memoryId}`,
  )
}

export function queryUserMemories(params: QueryUserMemoriesParams) {
  const { userId, groupId = null, query, totalLimit, searchLimit, minImportance } = params
  return request.Post<Service.ResponseResult<UserMemory[]>>(
    `/api/memory/user/${userId}/query`,
    { groupId, query, totalLimit, searchLimit, minImportance },
  )
}

export interface SimpleExtensionStatus {
  requested: boolean
  enabled: boolean
  loaded: boolean
  error: string | null
  tokenizer: string
  matchQuery: string | null
  libraryPath: string
  dictPath: string
  resolvedLibraryPath: string
  libraryExists: boolean
  resolvedDictPath: string
  dictExists: boolean
  platform: string
  arch: string
}

export interface DownloadSimpleExtensionParams {
  assetKey?: string
  assetName?: string
  installDir?: string
}

export function fetchSimpleExtensionStatus() {
  return request.Get<Service.ResponseResult<SimpleExtensionStatus>>('/api/memory/extensions/simple/status')
}

export function downloadSimpleExtension(params: DownloadSimpleExtensionParams) {
  return request.Post<Service.ResponseResult<{
    assetKey: string
    assetName: string
    installDir: string
    libraryPath: string
    dictPath: string
  }>>('/api/memory/extensions/simple/download', params)
}
