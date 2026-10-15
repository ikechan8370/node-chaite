import {
  EmbeddingResult,
  FunctionCall,
  HistoryMessage, IMessage,
  MessageContent,
  ModelResponseChunk, ModelUsage,
  TextContent,
  ToolCall,
} from '../../../types'
import { AbstractClient } from '../../clients'
import { BaseClientOptions, ChaiteContext } from '../../../types'
import OpenAI from 'openai'
import { asyncLocalStorage, getKey } from '../../../utils'
import { getIntoChaiteConverter } from '../../../utils/converter'
import { buildOpenAIRequest } from './request'
import { OpenAIStreamAccumulator } from './stream'
import './converter'
import { EmbeddingOption, SendMessageOption } from '../../../types'
import * as crypto from 'node:crypto'
import { VERSION } from '../../../index'

export type OpenAIClientOptions = BaseClientOptions

export class OpenAIClient extends AbstractClient {

  constructor(options: OpenAIClientOptions  | Partial<OpenAIClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'openai'
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const debug = this.context.chaite?.getGlobalConfig()?.getDebug()
    const client = new OpenAI({
      apiKey,
      baseURL: this.baseUrl || undefined,
      defaultHeaders: {
        'x-request-from': 'node-chaite/' + VERSION,
      },
    })
    const request = buildOpenAIRequest(histories, this.tools, options, this.baseUrl)
    if (debug) this.logger.debug(`openai request: ${JSON.stringify(request)}`)
    let chatCompletion: OpenAI.ChatCompletion
    if (options.stream) {
      const stream = client.chat.completions.stream({ ...request, stream: true })
      const accumulator = new OpenAIStreamAccumulator()
      for await (const chunk of stream) {
        const delta = accumulator.push(chunk)
        if (delta && options.onChunk) await options.onChunk(delta)
      }
      chatCompletion = await stream.finalChatCompletion()
      accumulator.applyReasoning(chatCompletion)
    } else {
      chatCompletion = await client.chat.completions.create({ ...request, stream: false })
    }
    if (debug) {
      this.logger.info(`openai response: ${JSON.stringify(chatCompletion)}`)
    }
    const id = crypto.randomUUID()
    const toChaiteConverter = getIntoChaiteConverter('openai')
    const contents = (chatCompletion).choices
      .map(ch => ch.message)
      .map(toChaiteConverter)
      .filter(ch => ch.content && ch.content.length > 0)
      .map(ch => ch.content)
      .reduce((a, b) => [...a, ...b], [] as MessageContent[])
    const result =  {
      id,
      parentId: options.parentMessageId,
      role: 'assistant',
      content: contents,
      toolCalls: chatCompletion.choices
        .map(ch => ch.message)
        .map(toChaiteConverter)
        .filter(ch => ch.toolCalls)
        .map(ch => ch.toolCalls)
        .reduce((a, b) => [...a as ToolCall[], ...b as ToolCall[]], [] as ToolCall[]),
    } as HistoryMessage
    const usage = {
      promptTokens: chatCompletion.usage?.prompt_tokens,
      completionTokens: chatCompletion.usage?.completion_tokens,
      totalTokens: chatCompletion.usage?.total_tokens,
      cachedTokens: chatCompletion.usage?.prompt_tokens_details?.cached_tokens,
      reasoningTokens: chatCompletion.usage?.completion_tokens_details?.reasoning_tokens,
    }
    return {
      ...result,
      usage,
    }
  }

  async getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult> {
    return asyncLocalStorage.run(this.context, async () => {
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const client = new OpenAI({
        apiKey,
        baseURL: this.baseUrl || undefined,
      })
      const embeddings = await client.embeddings.create({
        input: text,
        dimensions: options.dimensions,
        model: options.model,
      })
      return {
        embeddings: embeddings.data.map(e => e.embedding),
      } as EmbeddingResult
    })
  }
}
