import { BaseClientOptions, ChaiteContext } from '../../../types/common'
import { AbstractClass, SendMessageOption } from '../../clients'
import {
  History,
  HistoryMessage,
  ModelResponse,
  ToolCallResult,
  ToolCallResultMessage,
  UserMessage,
} from '../../../types'
import { asyncLocalStorage, getKey } from '../../../utils'
import { Content, GenerateContentRequest, GoogleGenerativeAI } from '@google/generative-ai'
import { getFromChaiteConverter, getFromChaiteToolConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter'

export type GeminiClientOptions = BaseClientOptions
export class GeminiClient extends AbstractClass {
  constructor(options: GeminiClientOptions) {
    super(options)
    this.name = 'gemini'
  }
  
  async sendMessage(message: UserMessage | undefined, options: SendMessageOption): Promise<ModelResponse> {
    const store = new ChaiteContext(this.logger)
    return asyncLocalStorage.run(store, async () => {
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const histories = await this.historyManager.getHistory(options.parentMessageId, options.conversationId)
      if (!options.conversationId) {
        options.conversationId = crypto.randomUUID()
      }
      const messages: Content[] = []
      const model = options.model
      const converter = getFromChaiteConverter('gemini')
      const toolConverter = getFromChaiteToolConverter('gemini')
      for (const history of histories) {
        const geminiContent = converter(history)
        messages.push(geminiContent)
      }
      if (message) {
        messages.push(converter(message))
      }
      const genAI = new GoogleGenerativeAI(apiKey)
      const geminiModel = genAI.getGenerativeModel({ model }, {
        apiVersion: 'v1beta',
        baseUrl: this.baseUrl,
        customHeaders: {
          'x-request-from': 'node-chaite/1.0.0',
        },
      })
      const result = await geminiModel.generateContent({
        contents: messages,
        tools: this.tools.map(toolConverter),
        systemInstruction: options.systemOverride,
      } as GenerateContentRequest)

      // save user request
      if (message) {
        const userMsgId = crypto.randomUUID()
        const toSave = {
          id: userMsgId,
          parentId: options.parentMessageId,
          ...message,
        } as HistoryMessage
        await this.historyManager.saveHistory(toSave, options.conversationId)
        options.parentMessageId = userMsgId
      }

      // save model response
      const id = crypto.randomUUID()
      const intoChaiteConverter = getIntoChaiteConverter('gemini')
      const iMessage = intoChaiteConverter(result)
      const rspToSave = {
        id,
        parentId: options.parentMessageId,
        role: 'assistant',
        content: iMessage.content,
        toolCalls: iMessage.toolCalls,
      } as HistoryMessage
      await this.historyManager.saveHistory(rspToSave, options.conversationId)
      options.parentMessageId = id
      if (rspToSave.toolCalls && rspToSave.toolCalls?.length > 0) {
        const toolCallResults = []
        for (const r of rspToSave.toolCalls) {
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
              type: 'tool',
              name: fcName,
              content: toolResult,
            } as ToolCallResult)
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
        return await this.sendMessage(undefined, options)
      }
      return {
        id,
        model,
        contents: iMessage.content,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount,
          totalTokens: result.response.usageMetadata?.totalTokenCount,
          cachedTokens: result.response.usageMetadata?.cachedContentTokenCount,
          reasoningTokens: 0,
        },
      } as ModelResponse
    })
  }
}