import { BaseClientOptions, ChaiteContext, ToolCallLimitConfig } from '../../../types'
import { AbstractClient } from '../../clients'
import {
  EmbeddingOption,
  EmbeddingResult,
  HistoryMessage, IMessage,
  ModelUsage,
} from '../../../types'
import {
  Content,
  FunctionCallingConfig,
  FunctionCallingConfigMode,
  GenerateContentParameters,
  GoogleGenAI, Tool, ToolConfig,
} from '@google/genai'
import { getFromChaiteConverter, getFromChaiteToolConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter'
import { asyncLocalStorage, getKey } from '../../../utils'
import { SendMessageOption } from '../../../types'
import * as crypto from 'node:crypto'
import { VERSION } from '../../../index'

const DEFAULT_TOOL_CALL_LIMIT: ToolCallLimitConfig = {
  maxConsecutiveCalls: 8,
  maxConsecutiveIdenticalCalls: 2,
}

export type GeminiClientOptions = BaseClientOptions & {
  toolCallLimit?: ToolCallLimitConfig
  /** Optional. The API version to use. 
   * If unset, the default API version will be used. 
   */
  apiVersion?: string
}
export class GeminiClient extends AbstractClient {
  private readonly apiVersion?: string

  constructor(options: GeminiClientOptions | Partial<GeminiClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'gemini'
    this.apiVersion = (options as Partial<GeminiClientOptions>)?.apiVersion
    const providedLimit = (options as Partial<GeminiClientOptions>)?.toolCallLimit
    const effectiveLimit = {
      ...DEFAULT_TOOL_CALL_LIMIT,
      ...(providedLimit || {}),
    }
    this.setToolCallLimitConfig(effectiveLimit)
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const debug = this.context.chaite.getGlobalConfig()?.getDebug()
    const messages: Content[] = []
    const model = options.model || 'gemini-2.0-flash-001'
    const converter = getFromChaiteConverter('gemini')
    const toolConverter = getFromChaiteToolConverter('gemini')
    for (const history of histories) {
      if (this.isEffectivelyEmptyMessage(history)) {
        continue
      }
      const geminiContent = converter(history)
      if (Array.isArray(geminiContent.parts) && geminiContent.parts.length === 0) {
        continue
      }
      messages.push(geminiContent)
    }
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: this.apiVersion,
      httpOptions: {
        baseUrl: this.baseUrl,
        headers: {
          'x-request-from': 'node-chaite/' + VERSION,
        },
      },
    })

    const functionDeclarations = this.tools.map(toolConverter)
    const tools: Tool[] | undefined = functionDeclarations.length > 0 ? [{
      functionDeclarations,
    }] : undefined

    const modeMap = {
      'none': FunctionCallingConfigMode.NONE,
      'any': FunctionCallingConfigMode.ANY,
      'auto': FunctionCallingConfigMode.AUTO,
      'specified': FunctionCallingConfigMode.ANY,
    }
    const toolConfig = functionDeclarations.length > 0 ? {
      functionCallingConfig: {
        mode: modeMap[options.toolChoice?.type || 'auto'],
        // 只有specified才有这个
        allowedFunctionNames: options.toolChoice?.type === 'specified' ? options.toolChoice?.tools : undefined,
      } as FunctionCallingConfig,
    } as ToolConfig : undefined
    // method parameter is not supported in Gemini API.
    options.safetySettings?.forEach(ss => {
      if (ss.method) {
        ss.method = undefined
      }
    })
    const req = {
      model,
      contents: messages,
      config: {
        temperature: options.temperature,
        maxOutputTokens: options.maxToken,
        thinkingConfig: options.enableReasoning ? {
          includeThoughts: true,
          thinkingBudget: options.enableReasoning ? options.reasoningBudgetTokens : 0,
        } : undefined,
        tools,
        ...(toolConfig ? { toolConfig } : {}),
        responseModalities: options.responseModalities,
        safetySettings: options.safetySettings,
        systemInstruction: options.systemOverride ?? undefined,
      },
    } as GenerateContentParameters

    if (debug) {
      this.logger.debug(`gemini request: ${JSON.stringify(req)}`)
    }
    const result = await ai.models.generateContent(req)
    if (debug) {
      this.logger.info(`gemini response: ${JSON.stringify(result)}`)
    }
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
      promptTokens: result.usageMetadata?.promptTokenCount,
      completionTokens: result.usageMetadata?.candidatesTokenCount,
      totalTokens: result.usageMetadata?.totalTokenCount,
      cachedTokens: result.usageMetadata?.cachedContentTokenCount,
      reasoningTokens: result.usageMetadata?.thoughtsTokenCount,
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
      const ai = new GoogleGenAI({
        apiKey,
        apiVersion: this.apiVersion,
        httpOptions: {
          baseUrl: this.baseUrl,
          headers: {
            'x-request-from': 'node-chaite/' + VERSION,
          },
        },
      })
      function textToRequest(_text: string): Content {
        return { role: 'user', parts: [{ text: _text }] }
      }
      if (!Array.isArray(text)) {
        text = [text]
      }
      const batchEmbedContentsResponse = await ai.models.embedContent({
        model,
        contents: text.map(textToRequest),
      })

      return {
        embeddings: batchEmbedContentsResponse.embeddings?.map(em => em.values),
      } as EmbeddingResult
    })
  }
}
