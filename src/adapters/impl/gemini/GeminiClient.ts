import { BaseClientOptions, ChaiteContext } from '../../../types/common'
import { AbstractClient } from '../../clients'
import {
  EmbeddingOption,
  EmbeddingResult,
  HistoryMessage, IMessage,
  ModelUsage,
} from '../../../types/index'
import {
  Content,
  FunctionCallingConfig, FunctionCallingMode,
  GenerateContentRequest,
  GoogleGenerativeAI,
  ToolConfig,
} from '@google/generative-ai'
import { getFromChaiteConverter, getFromChaiteToolConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter.js'
import { asyncLocalStorage, getKey } from '../../../utils/index'
import { SendMessageOption } from '../../../types/index'
import * as crypto from "node:crypto"

export type GeminiClientOptions = BaseClientOptions
export class GeminiClient extends AbstractClient {
  constructor(options: GeminiClientOptions | Partial<GeminiClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'gemini'
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const messages: Content[] = []
    const model = options.model || 'gemini-2.0-flash-001'
    const converter = getFromChaiteConverter('gemini')
    const toolConverter = getFromChaiteToolConverter('gemini')
    for (const history of histories) {
      const geminiContent = converter(history)
      messages.push(geminiContent)
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    const geminiModel = genAI.getGenerativeModel({ model }, {
      apiVersion: 'v1beta',
      baseUrl: this.baseUrl,
      customHeaders: {
        'x-request-from': 'node-chaite/1.0.0',
      },
    })
    const tools = this.tools.map(toolConverter)
    const modeMap = {
      'none': FunctionCallingMode.NONE,
      'any': FunctionCallingMode.ANY,
      'auto': FunctionCallingMode.AUTO,
      'specified': FunctionCallingMode.ANY,
    }
    const result = await geminiModel.generateContent({
      contents: messages,
      tools,
      systemInstruction: options.systemOverride,
      toolConfig: {
        functionCallingConfig: {
          mode: modeMap[options.toolChoice?.type || 'auto'],
          // 只有specified才有这个
          allowedFunctionNames: options.toolChoice?.type === 'specified' ? options.toolChoice?.tools : undefined,
        } as FunctionCallingConfig,
      } as ToolConfig,
    } as GenerateContentRequest)
    this.logger.debug(`gemini response: ${JSON.stringify(result)}`)
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
    const usage = {
      promptTokens: result.response.usageMetadata?.promptTokenCount,
      completionTokens: result.response.usageMetadata?.candidatesTokenCount,
      totalTokens: result.response.usageMetadata?.totalTokenCount,
      cachedTokens: result.response.usageMetadata?.cachedContentTokenCount,
      reasoningTokens: 0,
    }
    return {
      ...rspToSave,
      usage,
    }
  }

  async getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult> {
    return asyncLocalStorage.run(this.context, async () => {
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const model = options.model || 'text-embedding-004'
      const genAI = new GoogleGenerativeAI(apiKey)
      const geminiModel = genAI.getGenerativeModel({ model }, {
        apiVersion: 'v1beta',
        baseUrl: this.baseUrl,
        customHeaders: {
          'x-request-from': 'node-chaite/1.0.0',
        },
      })
      function textToRequest(_text: string) {
        return { content: { role: 'user', parts: [{ text: _text }] } }
      }
      if (Array.isArray(text)) {
        const batchEmbedContentsResponse = await geminiModel.batchEmbedContents({
          requests: text.map(textToRequest),
        })
        return {
          embeddings: batchEmbedContentsResponse.embeddings.map(em => em.values),
        } as EmbeddingResult
      } else {
        const embedContentResponse = await geminiModel.embedContent(text)
        return {
          embeddings: [embedContentResponse.embedding.values],
        } as EmbeddingResult
      }
    })
  }
}