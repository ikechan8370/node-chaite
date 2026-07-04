/// <reference path="../global.d.ts"/>

import type { HarmBlockMethod, HarmBlockThreshold, HarmCategory } from '@/utils/constants'

namespace Shareable {
  export interface PaginationResult<T> {
    items: T[]
    pagination: {
      currentPage: number
      pageSize: number
      totalItems: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    type: string
  }
  interface User {
    username: string
    user_id: string | number
    api_key?: string

    github?: string
    email?: string
    google?: string
    linux_do?: string
    apple?: string
    microsoft?: string
  }
  interface ShareableModel {
    modelType: 'settings' | 'executable'
    code?: string
    name: string
    id?: string
    embedded: boolean
    description: string
    uploader?: User
    updatedAt?: string
    createdAt?: string
    downloaded?: string
  }

  type FilterValue = string | number | boolean | FilterValue[]
  type Filter = Record<string, FilterValue | Record<string, FilterValue>>
  interface SearchOption {
    searchFields?: string[]
    page?: number
    pageSize?: number
    // todo
  }
  interface ListCloudChannelRequest {
    filter?: Filter
    options?: SearchOption
    query: string
  }

  type ClientType = 'openai' | 'gemini' | 'claude'
  type MultipleKeyStrategy = 'random' | 'round-robin' | 'conversation-hash'
  interface BaseClientOptions {
    baseUrl: string
    apiKey: string | string[]
    multipleKeyStrategy?: MultipleKeyStrategy

    proxy?: string

    postProcessorIds?: string[]

    preProcessorIds?: string[]
  }
  interface ChannelStatistics {
    callTimes?: number
    useToken?: number
    perModel: Record<string, Omit<ChannelStatistics, 'perModel'>>
  }
  interface Channels {
    adapterType: ClientType
    options: BaseClientOptions
    models: string[]
    weight: number
    priority: number
    status: 'enabled' | 'disabled'
    disabledReason?: string
    statistics?: ChannelStatistics
  }
  type ChannelModel = Shareable.ShareableModel & Channels

  interface ToolDTO {
    name: string
    code: string
    status: 'enabled' | 'disabled'
  }
  type ToolModel = ShareableModel & ToolDTO
  interface ListCloudToolDTORequest {
    filter?: Filter
    options?: SearchOption
    query: string
  }

  interface ToolsGroupDTO {
    toolIds: string[]
    isDefault?: boolean | undefined
  }
  type ToolsGroupModel = ShareableModel & ToolsGroupDTO
  interface ListCloudToolDTORequest {
    filter?: Filter
    options?: SearchOption
    query: string
  }

  interface ProcessorDTO {
    name: string
    code: string
    type: 'pre' | 'post'
  }
  type ProcessorModel = ShareableModel & ProcessorDTO
  interface ListCloudToolDTORequest {
    filter?: Filter
    options?: SearchOption
    query: string
  }

  export interface ToolChoice {
    type: 'none' | 'any' | 'auto' | 'specified'
    tools?: string[]
  }
  interface ToolCallLimitConfig {
    maxConsecutiveCalls?: number
    maxConsecutiveIdenticalCalls?: number
  }

  interface SendMessageOption {
    model?: string
    temperature?: number
    maxToken?: number
    /**
     * 将系统提示词覆盖
     */
    systemOverride?: string
    /**
     * 本轮对话禁用历史
     */
    disableHistoryRead?: boolean
    /**
     * 禁用本轮对话存储到历史
     */
    disableHistorySave?: boolean
    /**
     * 对话ID。如果不传则默认为第一次对话
     */
    conversationId?: string
    /**
     * 上一条消息的ID，如果不传则默认为第一次对话
     */
    parentMessageId?: string

    /**
     * 流模式
     */
    stream?: boolean
    isThinkingModel?: boolean

    enableReasoning?: boolean
    reasoningEffort?: 'high' | 'medium' | 'low'
    reasoningBudgetTokens?: number

    toolChoice?: ToolChoice

    postProcessorIds?: string[]

    preProcessorIds?: string[]

    toolGroupId?: string[]

    responseModalities?: string[]

    safetySettings?: SafetySetting[]

    toolCallLimit?: ToolCallLimitConfig
  }

  interface SafetySetting {
    /**
      Determines if the harm block method uses probability or probability
     and severity scores.
     */
    method?: HarmBlockMethod
    /** Required. Harm category. */
    category?: HarmCategory
    /** Required. The harm block threshold. */
    threshold?: HarmBlockThreshold
  }

  interface ChatPreset {
    prefix: string
    local: boolean
    namespace?: string
    sendMessageOption: SendMessageOption
    /**
     * 携带群聊上下文
     */
    groupContext?: 'disable' | 'enabled' | 'use_system'
    /**
     * 禁止系统prompt
     */
    disableSystemInstructions?: boolean
  }
  type PresetModel = ShareableModel & ChatPreset

  interface ListCloudPresetRequest {
    filter?: Filter
    options?: SearchOption
    query: string
  }

  interface TriggerDTO {
    status: 'enabled' | 'disabled'
    isOneTime?: boolean
  }

  type TriggerModel = ShareableModel & {
    code: string
    status: 'enabled' | 'disabled'
    isOneTime?: boolean
  }

  interface ListTriggerDTO {
    name?: string
    status?: 'enabled' | 'disabled'
    isOneTime?: boolean
  }

}
