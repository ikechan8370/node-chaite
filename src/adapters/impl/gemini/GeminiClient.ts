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
  GenerateContentParameters,
  GoogleGenAI,
} from '@google/genai'
import { getIntoChaiteConverter } from '../../../utils/converter'
import './converter'
import { asyncLocalStorage, getKey } from '../../../utils'
import { SendMessageOption } from '../../../types'
import * as crypto from 'node:crypto'
import { VERSION } from '../../../index'
import { buildGeminiRequest, geminiApiVersion } from './request'

const DEFAULT_TOOL_CALL_LIMIT: ToolCallLimitConfig = {
  maxConsecutiveCalls: 8,
  maxConsecutiveIdenticalCalls: 2,
}

export type GeminiClientOptions = BaseClientOptions & {
  toolCallLimit?: ToolCallLimitConfig
}

export class GeminiClient extends AbstractClient {
  constructor(options: GeminiClientOptions | Partial<GeminiClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'gemini'
    const providedLimit = (options as Partial<GeminiClientOptions>)?.toolCallLimit
    const effectiveLimit = {
      ...DEFAULT_TOOL_CALL_LIMIT,
      ...(providedLimit || {}),
    }
    this.setToolCallLimitConfig(effectiveLimit)
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const debug = this.context.chaite.getGlobalConfig()?.getDebug()
    const { request: req, suppressedBuiltinTools, hasEffectiveBuiltinTools } = await buildGeminiRequest(histories, this.tools, options)
    const model = req.model
    if (suppressedBuiltinTools) {
      this.logger.warn(`[GeminiClient] Gemini built-in tools were not combined with function tools for model "${model}"; tool combination requires Gemini 3/4. Existing function tools remain enabled.`)
    }
    const apiVersion = geminiApiVersion(this.baseUrl, hasEffectiveBuiltinTools)
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        baseUrl: this.baseUrl || undefined,
        headers: {
          'x-request-from': 'node-chaite/' + VERSION,
        },
        // GoogleGenAI defaults to v1beta. GCLI2API exposes its native Gemini
        // endpoint under /v1. Explicit version suffixes must never be duplicated.
        ...(apiVersion !== undefined ? { apiVersion } : {}),
      },
    })

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
        httpOptions: {
          baseUrl: this.baseUrl || undefined,
          ...(geminiApiVersion(this.baseUrl) !== undefined ? { apiVersion: geminiApiVersion(this.baseUrl) } : {}),
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
