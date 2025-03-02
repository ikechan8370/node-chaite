import {
  EmbeddingResult,
  Feature,
  HistoryMessage,
  ModelResponse,
  ModelResponseChunk,
  Tool,
  ToolCallResultMessage,
  UserMessage,
} from '../types'
import {
  BaseClientOptions, ChaiteContext,
  DefaultLogger,
  ILogger,
  MultipleKeyStrategy,
  MultipleKeyStrategyChoice,
} from '../types/common'

export interface SendMessageOption {
  model: string
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

  /**
   * 流模式的回调
   * @param chunk
   */
  onChunk?(chunk: ModelResponseChunk): Promise<void>
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

  sendMessage(message: UserMessage | undefined, options: SendMessageOption): Promise<ModelResponse>
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

export class AbstractClass implements IClient {
  constructor(options: BaseClientOptions) {
    this.features = options.features
    this.tools = options.tools
    this.baseUrl = options.baseUrl
    this.apiKey = options.apiKey
    this.multipleKeyStrategy = options.multipleKeyStrategy || MultipleKeyStrategyChoice.RANDOM
    this.logger = options.logger || DefaultLogger
    this.historyManager = options.historyManager
  }


  sendMessage(_message: UserMessage | undefined, _options: SendMessageOption): Promise<ModelResponse> {
    throw new Error('Method not implemented.')
  }

  apiKey: string | string[]
  baseUrl: string
  features: Feature[]
  multipleKeyStrategy: MultipleKeyStrategy
  name: ClientType
  tools: Tool[]
  logger: ILogger
  historyManager: HistoryManager
  context: ChaiteContext

  getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult> {
    throw new Error('Method not implemented.')
  }
}
