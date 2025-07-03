import { BaseClientOptions, ChaiteContext } from '../../../types'
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
  GoogleGenAI, ToolConfig
} from "@google/genai";
import { getFromChaiteConverter, getFromChaiteToolConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter.js'
import { asyncLocalStorage, getKey } from '../../../utils'
import { SendMessageOption } from '../../../types'
import * as crypto from 'node:crypto'
import {Chaite, VERSION} from "../../../index";

export type GeminiClientOptions = BaseClientOptions
export class GeminiClient extends AbstractClient {
  constructor(options: GeminiClientOptions | Partial<GeminiClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'gemini'
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const debug = Chaite.getInstance().getGlobalConfig()?.getDebug()
    const messages: Content[] = []
    const model = options.model || 'gemini-2.0-flash-001'
    const converter = getFromChaiteConverter('gemini')
    const toolConverter = getFromChaiteToolConverter('gemini')
    for (const history of histories) {
      const geminiContent = converter(history)
      messages.push(geminiContent)
    }
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        baseUrl: this.baseUrl,
        headers: {
          'x-request-from': 'node-chaite/' + VERSION,
        },
      }
    });
    
    const functionDeclarations = this.tools.map(tool => {
      const geminiTool = toolConverter(tool)
      return geminiTool.functionDeclarations?.[0] 
    }).filter(Boolean)
    const tools = functionDeclarations.length > 0 ? [{
      functionDeclarations
    }] : []
    
    const modeMap = {
      'none': FunctionCallingConfigMode.NONE,
      'any': FunctionCallingConfigMode.ANY,
      'auto': FunctionCallingConfigMode.AUTO,
      'specified': FunctionCallingConfigMode.ANY,
    }
    const toolConfig = {
      functionCallingConfig: {
        mode: modeMap[options.toolChoice?.type || 'auto'],
        // 只有specified才有这个
        allowedFunctionNames: options.toolChoice?.type === 'specified' ? options.toolChoice?.tools : undefined,
      } as FunctionCallingConfig,
    } as ToolConfig
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
          thinkingBudget: options.enableReasoning ? options.reasoningBudgetTokens : 0
        } : undefined,
        tools,
        toolConfig,
        responseModalities: options.responseModalities,
        safetySettings: options.safetySettings,
        systemInstruction: options.systemOverride ?? undefined
      }
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
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          baseUrl: this.baseUrl,
          headers: {
            'x-request-from': 'node-chaite/' + VERSION,
          },
        }
      });
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
