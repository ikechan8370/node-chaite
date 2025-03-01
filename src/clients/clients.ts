import {
  Feature,
  HistoryMessage,
  ModelResponse,
  ModelResponseChunk,
  Tool,
  ToolCallResultMessage,
  UserMessage,
} from '../types'
import {
  BaseClientOptions,
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
   * 渠道ID，用于构建历史
   */
  channelId: string

  /**
   * 流模式
   */
  stream?: boolean

  /**
   * 流模式的回调
   * @param chunk
   */
  onChunk(chunk: ModelResponseChunk): Promise<void>
}

export type ClientType = 'openai' | 'gemini' | 'claude'

export interface IClient {
  name: ClientType
  features: Feature[]
  tools: Tool[]
  baseUrl: string
  apiKey: string | string[]
  multipleKeyStrategy: MultipleKeyStrategy

  getHistory(messageId: string, conversationId?: string, channelId?: string | number): Promise<HistoryMessage[]>

  sendMessage(message: UserMessage | ToolCallResultMessage, options: SendMessageOption): Promise<ModelResponse>

  logger: ILogger
}

export class AbstractClass implements IClient {
  constructor(options: BaseClientOptions) {
    this.name = options.name
    this.features = options.features
    this.tools = options.tools
    this.baseUrl = options.baseUrl
    this.apiKey = options.apiKey
    this.multipleKeyStrategy = options.multipleKeyStrategy || MultipleKeyStrategyChoice.RANDOM
    this.getHistory = options.getHistory
    this.logger = options.logger || DefaultLogger
  }

  getHistory: (messageId?: string, conversationId?: string, channelId?: string | number) => Promise<HistoryMessage[]>
  
  sendMessage(_message: UserMessage | ToolCallResultMessage, _options: SendMessageOption): Promise<ModelResponse> {
    throw new Error('Method not implemented.')
  }

  apiKey: string | string[]
  baseUrl: string
  features: Feature[]
  multipleKeyStrategy: MultipleKeyStrategy
  name: ClientType
  tools: Tool[]
  logger: ILogger
}
