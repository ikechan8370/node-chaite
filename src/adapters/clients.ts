import {
  AssistantMessage,
  EmbeddingResult,
  Feature, History,
  HistoryMessage, ModelResponse,
  ModelUsage,
  Tool, ToolCallResult,
  ToolCallResultMessage,
  UserMessage,
} from '../types/index.js'
import {
  BaseClientOptions, ChaiteContext,
  DefaultLogger,
  ILogger,
  MultipleKeyStrategy,
  MultipleKeyStrategyChoice,
} from '../types/index.js'
import DefaultHistoryManager from '../utils/history.js'
import { asyncLocalStorage, getKey } from '../utils/index.js'
import { ClientType, EmbeddingOption, HistoryManager, IClient, SendMessageOption } from '../types/index.js'
import { PostProcessor, PreProcessor } from '../types/index.js'
import { ProcessorsManager } from '../share/index.js'


export class AbstractClient implements IClient {

  options: BaseClientOptions
  constructor(options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext) {
    options = BaseClientOptions.create(options)
    this.features = options.features || []
    this.tools = options.tools || []
    this.baseUrl = options.baseUrl || ''
    this.apiKey = options.apiKey || ''
    this.multipleKeyStrategy = options.multipleKeyStrategy || MultipleKeyStrategyChoice.RANDOM
    this.logger = options.logger || DefaultLogger
    this.historyManager = options.historyManager || DefaultHistoryManager
    this.context = new ChaiteContext(this.logger)
    this.options = options as BaseClientOptions
    if (context) {
      this.context = context
    }
  }
  
  async fullfillProcessors () {
    const processorsManager = await ProcessorsManager.getInstance()
    if (!this.preProcessors) {
      this.preProcessors = []
    }
    if (!this.postProcessors) {
      this.postProcessors = []
    }
    if (processorsManager) {
      if (this.options.preProcessorIds) {
        const preProcessors = []
        for (const preProcessorId of this.options.preProcessorIds) {
          const existProcessor = this.preProcessors.find(p => p.id === preProcessorId)
          if (!existProcessor) {
            const preProcessor = await processorsManager.getInstance(preProcessorId)
            if (preProcessor && preProcessor.type === 'pre') {
              preProcessors.push(preProcessor as PreProcessor)
            } else {
              this.logger.warn(`preProcessor ${preProcessorId} not found`)
            }
          } else {
            preProcessors.push(existProcessor)
          }
        }
        this.preProcessors = preProcessors
      }
      if (this.options.postProcessorIds) {
        const postProcessors = []
        for (const postProcessorId of this.options.postProcessorIds) {
          const existProcessor = this.postProcessors.find(p => p.id === postProcessorId)
          if (!existProcessor) {
            const postProcessor = await processorsManager.getInstance(postProcessorId)
            if (postProcessor && postProcessor.type === 'post') {
              postProcessors.push(postProcessor as PostProcessor)
            } else {
              this.logger.warn(`postProcessor ${postProcessorId} not found`)
            }
          } else {
            postProcessors.push(existProcessor)
          }
        }
        this.postProcessors = postProcessors
      }
    }
  }

  sendMessage(message: UserMessage | undefined, options: SendMessageOption | Partial<SendMessageOption>): Promise<ModelResponse> {
    options = SendMessageOption.create(options)
    const logicFn = async () => {
      await this.options.ready()
      this.preProcessors = this.options.getPreProcessors()
      this.postProcessors = this.options.getPostProcessors()
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const histories = await this.historyManager.getHistory(options.parentMessageId, options.conversationId)
      if (!options.conversationId) {
        options.conversationId = crypto.randomUUID()
      }
      let thisRequestMsg
      await this.fullfillProcessors()
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
      const modelResponse = await this._sendMessage(histories, apiKey, options as SendMessageOption)

      // 后处理器
      if (modelResponse.role === 'assistant') {
        let tempResponse = {
          content: modelResponse.content,
          role: 'assistant',
        } as AssistantMessage
        for (const postProcessor of this.postProcessors || []) {
          tempResponse = await postProcessor.process(tempResponse)
        }
        modelResponse.content = tempResponse.content
      }
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
    }
    if (!asyncLocalStorage.getStore()) {
      return asyncLocalStorage.run(this.context, async () => {
        return logicFn()
      })
    } else {
      return logicFn()
    }
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
