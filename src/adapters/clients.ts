import {
  AssistantMessage,
  AudioContent,
  EmbeddingResult,
  Feature,
  History,
  HistoryMessage,
  ImageContent,
  IMessage,
  MessageContent,
  ModelResponse,
  ModelUsage,
  ReasoningContent,
  TextContent,
  Tool,
  ToolCall,
  ToolCallResult,
  ToolCallResultMessage,
  ToolCallLimitConfig,
  UserMessage,
} from '../types'
import {
  BaseClientOptions, ChaiteContext,
  DefaultLogger,
  ILogger,
  MultipleKeyStrategy,
  MultipleKeyStrategyChoice,
} from '../types'
import DefaultHistoryManager from '../utils/history'
import { asyncLocalStorage, extractClassName, getKey } from '../utils'
import { ClientType, EmbeddingOption, HistoryManager, IClient, SendMessageOption } from '../types'
import { PostProcessor, PreProcessor } from '../types'
import { ProcessorsManager } from '../share'
import * as crypto from 'node:crypto'



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
      this.context.setClient(this)
    }
  }

  async fullfillProcessors (preIds?: string[], postIds?: string[]): Promise<{ pre: PreProcessor[], post: PostProcessor[] }> {
    const processorsManager = await ProcessorsManager.getInstance()
    if (!this.preProcessors) {
      this.preProcessors = []
    }
    if (!this.postProcessors) {
      this.postProcessors = []
    }
    if (processorsManager) {
      if (preIds !== undefined) {
        const preProcessors = []
        for (const preProcessorId of preIds || []) {
          const existProcessor = this.preProcessors.find(p => p.id === preProcessorId)
          if (!existProcessor) {
            const preProcessor = await processorsManager.getInstanceT(preProcessorId)
            if (preProcessor && preProcessor.type === 'pre') {
              const processorName = extractClassName(preProcessor.code as string) || preProcessor.name
              const p = await processorsManager.getInstance(processorName)
              if (p) {
                preProcessors.push(p as PreProcessor)
              }
            } else {
              this.logger.warn(`preProcessor ${preProcessorId} not found`)
            }
          } else {
            preProcessors.push(existProcessor)
          }
        }
        this.preProcessors = preProcessors
      } else {
        this.preProcessors = this.options.getPreProcessors() || []
      }
      if (postIds !== undefined) {
        const postProcessors = []
        for (const postProcessorId of postIds || []) {
          const existProcessor = this.postProcessors.find(p => p.id === postProcessorId)
          if (!existProcessor) {
            const postProcessor = await processorsManager.getInstanceT(postProcessorId)
            if (postProcessor && postProcessor.type === 'post') {
              const postProcessorName = extractClassName(postProcessor.code as string) || postProcessor.name
              const p = await processorsManager.getInstance(postProcessorName)
              if (p) {
                postProcessors.push(p as PostProcessor)
              }
            } else {
              this.logger.warn(`preProcessor ${postProcessorId} not found`)
            }
          } else {
            postProcessors.push(existProcessor)
          }
        }
        this.postProcessors = postProcessors
      } else {
        this.postProcessors = this.options.getPostProcessors() || []
      }
    }

    return {
      pre: this.preProcessors,
      post: this.postProcessors,
    }
  }

  async fullfillTools (toolGroupIds?: string[]): Promise<Tool[]> {
    const resolvedTools: Tool[] = []
    const pushUnique = (tool?: Tool) => {
      if (tool && !resolvedTools.find(t => t.name === tool.name)) {
        resolvedTools.push(tool)
      }
    }
    ;(this.options.tools || []).forEach(pushUnique)
    const toolsGroupManager = this.context.chaite.getToolsGroupManager()
    const toolManager = this.context.chaite.getToolsManager()
    const groupIds = toolGroupIds ? [...toolGroupIds] : []
    if (groupIds.includes('default_local')) {
      const toolDTOS = await toolManager.listInstances()
      for (const toolDTO of toolDTOS) {
        const toolName = extractClassName(toolDTO.code as string) || toolDTO.name
        const toolC = await toolManager.getInstance(toolName)
        pushUnique(toolC)
      }
    }
    for (const toolGroupId of groupIds.filter(id => id !== 'default_local')) {
      const toolGroup = await toolsGroupManager.getInstance(toolGroupId)
      if (!toolGroup) {
        this.logger.warn(`tool group ${toolGroupId} not found`)
        continue
      }
      const toolIds = toolGroup.toolIds || []
      for (const toolId of toolIds) {
        const tool = await toolManager.getInstanceT(toolId)
        if (!tool) {
          this.logger.warn(`tool ${toolId} not found`)
          continue
        }
        const toolName = extractClassName(tool.code as string) || tool.name
        const toolC = await toolManager.getInstance(toolName)
        if (!toolC) {
          this.logger.warn(`tool ${toolId} can not be instantiated`)
          continue
        }
        pushUnique(toolC)
      }
    }
    this.tools = resolvedTools
    return this.tools
  }

  sendMessage(message: UserMessage | undefined, options: SendMessageOption | Partial<SendMessageOption>): Promise<ModelResponse> {
    const debug = this.context.chaite?.getGlobalConfig()?.getDebug()
    options = SendMessageOption.create(options)
    const logicFn = async () => {
      this.context.setOptions(options as SendMessageOption)
      await this.options.ready()
      this.preProcessors = this.options.getPreProcessors()
      this.postProcessors = this.options.getPostProcessors()
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const histories = options.disableHistoryRead ? [] : await this.historyManager.getHistory(options.parentMessageId, options.conversationId)
      this.context.setHistoryMessages(histories)
      if (!options.conversationId) {
        options.conversationId = crypto.randomUUID()
      }
      let thisRequestMsg
      await this.fullfillProcessors(options.preProcessorIds, options.postProcessorIds)
      if (debug) {
        this.logger.debug(`using ${this.preProcessors.length} preProcessors: [${this.preProcessors.map(p => p.name).join(', ')}]`)
        this.logger.debug(`using ${this.postProcessors.length} postProcessors: [${this.postProcessors.map(p => p.name).join(', ')}]`)
      }
      await this.fullfillTools(options.toolGroupId)
      if (debug) {
        this.logger.debug(`using ${this.tools.length} tools: [${this.tools.map(t => t.name).join(', ')}]`)
      }
      if (message) {
        // 前处理器
        for (const preProcessors of this.preProcessors || []) {
          try {
            if (debug) {
              this.logger.debug(`into preProcessor ${preProcessors.name}}`)
            }
            message = await preProcessors.process(message)
          } catch (err) {
            if (err instanceof Error) {
              this.logger.warn(`error happened with preProcessor ${preProcessors.name}: ${err.message}`)
            }
          }
        }
        // 用户消息不会分裂
        const userMsgId = crypto.randomUUID()
        thisRequestMsg = {
          id: userMsgId,
          parentId: options.parentMessageId,
          ...message,
        } as HistoryMessage
        if (!this.isEffectivelyEmptyMessage(thisRequestMsg)) {
          histories.push(thisRequestMsg)
        } else if (debug) {
          this.logger.debug('skip sending empty user message to model')
        }
      }
      const modelResponse = await this._sendMessage(histories, apiKey, options as SendMessageOption)

      // 后处理器
      if (modelResponse.role === 'assistant') {
        let tempResponse = {
          content: modelResponse.content,
          role: 'assistant',
        } as AssistantMessage
        for (const postProcessor of this.postProcessors || []) {
          try {
            if (debug) {
              this.logger.debug(`into postProcessor ${postProcessor.name}}`)
            }
            const posted = await postProcessor.process(tempResponse)
            if (posted) {
              tempResponse = posted
            }
          } catch (error) {
            if (error instanceof Error) {
              this.logger.warn(`error happened with postProcessor ${postProcessor.name}: ${error.message}`)
            }
          }
        }
        modelResponse.content = tempResponse.content
      }
      const toolCallLimitConfig = this.getEffectiveToolCallLimit(options as SendMessageOption)
      if (modelResponse.toolCalls?.length) {
        const limitReason = this.updateToolCallTracking(options as SendMessageOption, modelResponse.toolCalls, toolCallLimitConfig)
        if (limitReason) {
          this.logger.warn(limitReason)
          modelResponse.toolCalls = undefined
          if (this.isEffectivelyEmptyMessage(modelResponse)) {
            modelResponse.content = [{
              type: 'text',
              text: limitReason,
            } as TextContent]
          }
          this.resetToolCallTracking(options as SendMessageOption)
        }
      } else {
        this.resetToolCallTracking(options as SendMessageOption)
      }
      // save user request
      if (thisRequestMsg && this.shouldPersistHistory(thisRequestMsg)) {
        await this.historyManager.saveHistory(thisRequestMsg, options.conversationId)
        options.parentMessageId = thisRequestMsg.id
        modelResponse.parentId = thisRequestMsg.id
      } else if (thisRequestMsg && debug) {
        this.logger.debug('skip saving empty user message to history')
      }
      // save model response
      // this.logger.info(JSON.stringify(rspToSave))
      if (this.shouldPersistHistory(modelResponse)) {
        await this.historyManager.saveHistory(modelResponse, options.conversationId)
      } else if (debug) {
        this.logger.debug('skip saving empty assistant message to history')
      }
      options.parentMessageId = modelResponse.id
      if (modelResponse.toolCalls && modelResponse.toolCalls?.length > 0) {
        if (options.onMessageWithToolCall) {
          for (const messageContent of modelResponse.content) {
            try {
              await options.onMessageWithToolCall(messageContent)
            } catch (err) {
              if (err instanceof Error) {
                this.logger.warn(err)
              }
            }
          }
        }
        const toolCallResults: ToolCallResult[] = []
        for (const r of modelResponse.toolCalls) {
          const fcName = r.function.name
          const fcArgs = r.function.arguments
          const tool = this.tools.find(t => t.function.name === fcName)
          if (tool) {
            this.logger.info(`run tool ${fcName} with args ${JSON.stringify(fcArgs)}`)
            let toolResult: string
            try {
              toolResult = await tool.run(fcArgs, this.context)
              if (typeof toolResult !== 'string') {
                toolResult = JSON.stringify(toolResult)
              }
            } catch (err: unknown) {
              toolResult = (err as Error).message
            }
            this.logger.info(`tool ${fcName} result ${toolResult}`)
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

      if (options.disableHistorySave) {
        // 由于工具调用逻辑依赖存储，选择在完成后删除会话而不是中途不存储。
        await this.historyManager.deleteConversation(options.conversationId)
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

  protected shouldPersistHistory(message?: HistoryMessage): boolean {
    if (!message) {
      return false
    }
    if (message.role === 'tool') {
      return this.hasMeaningfulContent(message)
    }
    if (message.role === 'assistant' || message.role === 'user') {
      return this.hasMeaningfulContent(message) || (message.toolCalls?.length ?? 0) > 0
    }
    return true
  }

  protected isEffectivelyEmptyMessage(message?: IMessage): boolean {
    if (!message) {
      return true
    }
    const hasContent = this.hasMeaningfulContent(message)
    const hasToolCall = (message.toolCalls?.length ?? 0) > 0
    return !hasContent && !hasToolCall
  }

  private hasMeaningfulContent(message?: IMessage): boolean {
    if (!message || !Array.isArray(message.content) || message.content.length === 0) {
      return false
    }
    return message.content.some(part => this.isMessagePartMeaningful(part))
  }

  private isMessagePartMeaningful(part?: MessageContent): boolean {
    if (!part) {
      return false
    }
    switch (part.type) {
    case 'text': {
      const text = (part as TextContent).text
      return typeof text === 'string' && text.trim().length > 0
    }
    case 'reasoning': {
      const text = (part as ReasoningContent).text
      return typeof text === 'string' && text.trim().length > 0
    }
    case 'image':
      return Boolean((part as ImageContent).image)
    case 'audio':
      return Boolean((part as AudioContent).data)
    case 'tool':
      return Boolean((part as ToolCallResult).content)
    default:
      return true
    }
  }

  protected setToolCallLimitConfig(config?: ToolCallLimitConfig): void {
    this.toolCallLimitConfig = config
  }

  private getEffectiveToolCallLimit(options: SendMessageOption): ToolCallLimitConfig | undefined {
    if (!options.toolCallLimit && this.toolCallLimitConfig) {
      options.toolCallLimit = { ...this.toolCallLimitConfig }
    }
    return options.toolCallLimit
  }

  private updateToolCallTracking(options: SendMessageOption, toolCalls: ToolCall[], limitConfig?: ToolCallLimitConfig): string | undefined {
    if (!limitConfig) {
      return undefined
    }
    const consecutiveTotal = (options._consecutiveToolCallCount ?? 0) + 1
    options._consecutiveToolCallCount = consecutiveTotal
    const signature = this.buildToolCallSignature(toolCalls)
    if (options._lastToolCallSignature === signature) {
      options._consecutiveIdenticalToolCallCount = (options._consecutiveIdenticalToolCallCount ?? 0) + 1
    } else {
      options._lastToolCallSignature = signature
      options._consecutiveIdenticalToolCallCount = 1
    }
    if (limitConfig.maxConsecutiveCalls && limitConfig.maxConsecutiveCalls > 0 && consecutiveTotal > limitConfig.maxConsecutiveCalls) {
      return 'Maximum consecutive tool call limit reached, stop invoking tools.'
    }
    const identicalCount = options._consecutiveIdenticalToolCallCount ?? 0
    if (limitConfig.maxConsecutiveIdenticalCalls && limitConfig.maxConsecutiveIdenticalCalls > 0 && identicalCount > limitConfig.maxConsecutiveIdenticalCalls) {
      return 'Maximum identical tool call limit reached, stop invoking tools.'
    }
    return undefined
  }

  private resetToolCallTracking(options: SendMessageOption): void {
    options._consecutiveToolCallCount = 0
    options._consecutiveIdenticalToolCallCount = 0
    options._lastToolCallSignature = undefined
  }

  private buildToolCallSignature(toolCalls: ToolCall[]): string {
    return JSON.stringify(toolCalls.map(tc => ({
      name: tc.function?.name,
      arguments: tc.function?.arguments,
    })))
  }

  _sendMessage(_histories: IMessage[], _apiKey: string, _options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    throw new Error('Abstract class not implemented')
  }

  async sendMessageWithHistory(history: IMessage[], options?: SendMessageOption | Partial<SendMessageOption>): Promise<IMessage & { usage: ModelUsage }> {
    const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy || MultipleKeyStrategyChoice.RANDOM)
    return this._sendMessage(history, apiKey, SendMessageOption.create(options))
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
  protected toolCallLimitConfig?: ToolCallLimitConfig

  getEmbedding(_text: string | string[], _options: EmbeddingOption): Promise<EmbeddingResult> {
    throw new Error('Method not implemented.')
  }
}
