import {
  EmbeddingResult,
  Feature, History,
  HistoryMessage, MessageContent,
  ModelResponse,
  ModelResponseChunk, ModelUsage, PostProcessor, PreProcessor,
  Tool, ToolCall, ToolCallResult,
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
import { asyncLocalStorage, getKey } from '../utils'

export interface SendMessageOption {
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

export class AbstractClass implements IClient {
  constructor(options: BaseClientOptions) {
    this.features = options.features
    this.tools = options.tools
    this.baseUrl = options.baseUrl
    this.apiKey = options.apiKey
    this.multipleKeyStrategy = options.multipleKeyStrategy || MultipleKeyStrategyChoice.RANDOM
    this.logger = options.logger || DefaultLogger
    this.historyManager = options.historyManager
    this.preProcessors = options.preProcessors
    this.postProcessors = options.postProcessors
    this.context = new ChaiteContext(this.logger)
  }

  sendMessage(message: UserMessage | undefined, options: SendMessageOption = {}): Promise<ModelResponse> {
    return asyncLocalStorage.run(this.context, async () => {
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const histories = await this.historyManager.getHistory(options.parentMessageId, options.conversationId)
      if (!options.conversationId) {
        options.conversationId = crypto.randomUUID()
      }
      let thisRequestMsg
      if (message) {
        // 前处理器
        for (const preProcessors of this.preProcessors || []) {
          message = await preProcessors.process(message)
        }
        // 用户消息不会分裂
        const userMsgId = crypto.randomUUID()
        thisRequestMsg = {
          id: userMsgId,
          parentId: options.parentMessageId,
          ...message,
        } as HistoryMessage
        histories.push(thisRequestMsg)
      }
      const modelResponse = await this._sendMessage(histories, apiKey, options)
      // save user request
      if (thisRequestMsg) {
        await this.historyManager.saveHistory(thisRequestMsg, options.conversationId)
        options.parentMessageId = thisRequestMsg.id
      }
      // save model response
      // this.logger.info(JSON.stringify(rspToSave))
      await this.historyManager.saveHistory(modelResponse, options.conversationId)
      options.parentMessageId = modelResponse.id
      if (modelResponse.toolCalls && modelResponse.toolCalls?.length > 0) {
        const toolCallResults: ToolCallResult[] = []
        for (const r of modelResponse.toolCalls) {
          const fcName = r.function.name
          const fcArgs = r.function.arguments
          const tool = this.tools.find(t => t.function.name === fcName)
          if (tool) {
            let toolResult: string
            try {
              toolResult = await tool.run(fcArgs)
            } catch (err: unknown) {
              toolResult = (err as Error).message
            }
            toolCallResults.push({
              tool_call_id: r.id,
              content: toolResult,
              type: 'tool',
              name: r.function.name,
            })
          }
        }
        const tcMsgId = crypto.randomUUID()
        const toolCallResultMessage: ToolCallResultMessage & History = {
          role: 'tool',
          content: toolCallResults,
          id: tcMsgId,
          parentId: options.parentMessageId,
        }
        options.parentMessageId = tcMsgId
        await this.historyManager.saveHistory(toolCallResultMessage, options.conversationId)
        // 把toolChoice恢复auto避免无限调用
        options.toolChoice = {
          type: 'auto',
        }
        return await this.sendMessage(undefined, options)
      }
      
      return {
        id: modelResponse.id,
        model: options.model,
        contents: modelResponse.content,
        usage: modelResponse.usage,
      } as ModelResponse
    })
  }
  
  _sendMessage(_histories: HistoryMessage[], _apiKey: string, _options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    throw new Error('Abstract class not implemented')
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
  postProcessors?: PostProcessor[]
  preProcessors?: PreProcessor[]

  getEmbedding(_text: string | string[], _options: EmbeddingOption): Promise<EmbeddingResult> {
    throw new Error('Method not implemented.')
  }
}
