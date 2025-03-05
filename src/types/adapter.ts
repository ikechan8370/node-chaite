import {
  EmbeddingResult,
  Feature, HistoryMessage,
  ModelResponse,
  ModelResponseChunk,
  UserMessage,
} from './models'
import { DeSerializable, Serializable, Tool } from './tools'
import { ILogger, MultipleKeyStrategy } from './common'
import { PostProcessor, PreProcessor } from './processors'

export class SendMessageOption implements Serializable, DeSerializable<SendMessageOption> {
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
  /**
   * 流模式的回调
   * @param chunk
   */
  onChunk?(chunk: ModelResponseChunk): Promise<void>

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
  sendMessage(message: UserMessage | undefined, options?: SendMessageOption): Promise<ModelResponse>
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