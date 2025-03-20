import {
  EmbeddingResult,
  Feature, HistoryMessage, IMessage, MessageContent,
  ModelResponse,
  ModelResponseChunk, ModelUsage,
  UserMessage,
} from './models'
import { Tool } from './tools'
import { ILogger, MultipleKeyStrategy } from './common'
import { PostProcessor, PreProcessor } from './processors'
import { DeSerializable, Serializable } from './cloud'

export class SendMessageOption implements Serializable, DeSerializable<SendMessageOption> {
  constructor(option: Partial<SendMessageOption>) {
    this.model = option.model
    this.temperature = option.temperature
    this.maxToken = option.maxToken
    this.systemOverride = option.systemOverride
    this.disableHistoryRead = option.disableHistoryRead
    this.disableHistorySave = option.disableHistorySave
    this.conversationId = option.conversationId
    this.parentMessageId = option.parentMessageId
    this.stream = option.stream
    this.enableReasoning = option.enableReasoning
    this.reasoningEffort = option.reasoningEffort
    this.reasoningBudgetTokens = option.reasoningBudgetTokens
    this.toolChoice = option.toolChoice
    this.preProcessorIds = option.preProcessorIds
    this.postProcessorIds = option.postProcessorIds
    this.toolGroupId = option.toolGroupId
    this.onChunk = option.onChunk
    this.onMessageWithToolCall = option.onMessageWithToolCall
  }

  static create(options?: SendMessageOption | Partial<SendMessageOption>): SendMessageOption {
    return options instanceof SendMessageOption
      ? options
      : new SendMessageOption(options || {})
  }
  
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

  enableReasoning?: boolean
  reasoningEffort?: 'high' | 'medium' | 'low'
  reasoningBudgetTokens?: number

  toolChoice?: ToolChoice

  postProcessorIds?: string[]

  preProcessorIds?: string[]

  toolGroupId?: string[]

  /**
   * 流模式的回调
   * @param chunk
   */
  onChunk?(chunk: ModelResponseChunk): Promise<void>

  /**
   * 工具调用轮次，如果有其他非tool_call类消息会被丢弃最后不会返回，但是可以通过onMessageWithToolCall来处理
   * @param message
   */
  onMessageWithToolCall?(message: MessageContent): Promise<void>

  fromString(str: string): SendMessageOption {
    return JSON.parse(str) as SendMessageOption
  }

  toString(): string {
    const json = {
      model: this.model,
      temperature: this.temperature,
      maxToken: this.maxToken,
      systemOverride: this.systemOverride,
      disableHistoryRead: this.disableHistoryRead,
      disableHistorySave: this.disableHistorySave,
      conversationId: this.conversationId,
      parentMessageId: this.parentMessageId,
      stream: this.stream,
      enableReasoning: this.enableReasoning,
      reasoningEffort: this.reasoningEffort,
      reasoningBudgetTokens: this.reasoningBudgetTokens,
      toolChoice: this.toolChoice,
      preProcessorIds: this.preProcessorIds,
      postProcessorIds: this.postProcessorIds,
      toolGroupId: this.toolGroupId,
    }
    return JSON.stringify(json)
  }
}

export interface ToolChoice {
  type: 'none' | 'any' | 'auto' | 'specified',
  tools?: string[]
}


export interface EmbeddingOption {
  model: string
  dimensions?: number
}

export type ClientType = 'openai' | 'gemini' | 'claude'

export interface IClient {
  name: ClientType
  features: Feature[]
  tools: Tool[]
  baseUrl: string
  apiKey: string | string[]
  multipleKeyStrategy: MultipleKeyStrategy

  historyManager: HistoryManager
  postProcessors?: PostProcessor[]
  preProcessors?: PreProcessor[]
  sendMessage(message: UserMessage | undefined, options?: SendMessageOption | Partial<SendMessageOption>): Promise<ModelResponse>
  sendMessageWithHistory(history: IMessage[], options?: SendMessageOption | Partial<SendMessageOption>): Promise<IMessage & { usage: ModelUsage }>
  getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult>
  logger: ILogger
}

export interface HistoryManager {
  name: string,
  saveHistory(message: HistoryMessage, conversationId: string): Promise<void>
  getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>
  deleteConversation(conversationId: string): Promise<void>
  getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>
}

export abstract class AbstractHistoryManager implements HistoryManager {
  name: string
  abstract saveHistory(message: HistoryMessage, conversationId: string): Promise<void>
  abstract getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>
  abstract deleteConversation(conversationId: string): Promise<void>
  abstract getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>
}