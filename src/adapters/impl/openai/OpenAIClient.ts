import {
  EmbeddingResult,
  FunctionCall,
  HistoryMessage, IMessage,
  MessageContent,
  ModelResponseChunk, ModelUsage,
  TextContent,
  ToolCall,
} from '../../../types/index'
import { AbstractClient } from '../../clients'
import { BaseClientOptions, ChaiteContext } from '../../../types/common'
import OpenAI from 'openai'
import { asyncLocalStorage, getKey } from '../../../utils/index'
import { getFromChaiteConverter, getFromChaiteToolConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter.js'
import { EmbeddingOption, SendMessageOption } from '../../../types/index'

export type OpenAIClientOptions = BaseClientOptions

export class OpenAIClient extends AbstractClient {

  constructor(options: OpenAIClientOptions  | Partial<OpenAIClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'openai'
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const client = new OpenAI({
      apiKey,
      baseURL: this.baseUrl,
    })
    const messages: OpenAI.ChatCompletionMessageParam[] = []
    const model = options.model || 'gpt-4o-mini'
    const isThinkingModel = model.includes('o1') || model.includes('o3')
    if (options.systemOverride) {
      if (isThinkingModel) {
        messages.push({ role: 'developer', content: options.systemOverride })
      } else {
        messages.push({ role: 'system', content: options.systemOverride })
      }
    }
    const converter = getFromChaiteConverter('openai')
    for (const history of histories) {
      let openaiMsg = converter(history)
      if (!Array.isArray(openaiMsg)) {
        openaiMsg = [openaiMsg]
      }
      messages.push(...openaiMsg)
    }
    let chatCompletion
    const toolConvert = getFromChaiteToolConverter('openai')
    let toolChoice: OpenAI.ChatCompletionToolChoiceOption = 'auto'
    if (options.toolChoice?.type) {
      switch (options.toolChoice.type) {
      case 'auto': {
        break
      }
      case 'any': {
        toolChoice = 'required'
        break
      }
      case 'specified': {
        if (!options.toolChoice.tools || options.toolChoice.tools.length === 0) {
          throw new Error('`toolChoice.tools` must be set if `toolChoice.type` is set to `specified`')
        }
        toolChoice = {
          type: 'function',
          function: {
            name: options.toolChoice.tools[0],
          },
        }
      }
      }
    }
    const tools = this.tools.map(toolConvert)
    if (options.stream) {
      const stream = client.beta.chat.completions.stream({
        messages,
        model,
        stream: true,
        tools,
        reasoning_effort: isThinkingModel ? options.reasoningEffort : undefined,
        tool_choice: tools.length > 0 ? toolChoice : undefined,
      })
      if (options.onChunk) {
        let incompleteToolCallChunk = {
          name: '',
          arguments: '',
        }
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta
          let toolCall = delta?.tool_calls ? delta.tool_calls.map(t => {
            if (t.function?.name) {
              incompleteToolCallChunk.name = t.function.name
            }
            if (t.function?.arguments) {
              incompleteToolCallChunk.arguments += t.function.arguments
            }
            let fc: FunctionCall | null = null
            try {
              const args = JSON.parse(incompleteToolCallChunk.arguments)
              // tool终于全了
              fc = {
                name: incompleteToolCallChunk.name,
                arguments: args,
              }
              incompleteToolCallChunk = {
                name: '',
                arguments: '',
              }
            } catch (err) {
              // do nothing
            }
            return fc ? {
              id: t.id,
              type: 'function',
              function: fc,
            } as ToolCall : null
          }).filter(tc => !!tc) : null
          if (toolCall && toolCall.length === 0) {
            toolCall = null
          }
          const deltaChunk = {
            id: chunk.id,
            model: chunk.model,
            delta: delta?.content ? [{ type: 'text', text: delta.content } as TextContent] : [],
            toolCall,
          } as ModelResponseChunk
          // 避免空chunk太频繁，检查一下
          if (deltaChunk.delta.find(d => (d as TextContent).text) || deltaChunk.toolCall?.find(tc => tc.function.arguments)) {
            await options.onChunk(deltaChunk)
          }
        }
      }
      chatCompletion = await stream.finalChatCompletion()
    } else {
      chatCompletion = await client.chat.completions.create({
        messages,
        model,
        tools,
        tool_choice: tools.length > 0 ? toolChoice : undefined,
        reasoning_effort: isThinkingModel ? options.reasoningEffort : undefined,
      })
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
        baseURL: this.baseUrl,
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