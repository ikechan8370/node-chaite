import {
  UserMessage,
  ToolCallResultMessage,
  ModelResponse,
  ModelUsage,
  HistoryMessage,
  ModelResponseChunk,
  TextContent,
  ToolCall,
  FunctionCall,
  History,
  MessageContent,
  ToolCallResult, EmbeddingResult,
} from '../../../types'
import { AbstractClass, EmbeddingOption, SendMessageOption } from '../../clients'
import { BaseClientOptions, ChaiteContext } from '../../../types/common'
import OpenAI from 'openai'
import { asyncLocalStorage, getKey } from '../../../utils'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions/completions'
import {
  getFromChaiteConverter, getFromChaiteToolConverter,
  getIntoChaiteConverter,
} from '../../../utils/converter'
import './converter'
import { ParsedChatCompletion } from 'openai/src/resources/beta/chat/completions'

export type OpenAIClientOptions = BaseClientOptions

export class OpenAIClient extends AbstractClass {

  constructor(options: OpenAIClientOptions) {
    super(options)
    this.name = 'openai'
    this.context = new ChaiteContext(this.logger)
  }

  async sendMessage(message: UserMessage | undefined, options: SendMessageOption): Promise<ModelResponse> {
    return asyncLocalStorage.run(this.context, async () => {
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const client = new OpenAI({
        apiKey,
        baseURL: this.baseUrl,
      })
      const histories = await this.historyManager.getHistory(options.parentMessageId, options.conversationId)
      if (!options.conversationId) {
        options.conversationId = crypto.randomUUID()
      }
      const messages: ChatCompletionMessageParam[] = []
      const model = options.model
      if (options.systemOverride) {
        if (model.includes('o1') || model.includes('o3')) {
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
      if (message) {
        // 用户消息不会分裂
        messages.push(converter(message) as ChatCompletionMessageParam)
      }
      let chatCompletion
      const toolConvert = getFromChaiteToolConverter('openai')
      if (options.stream) {
        const stream = client.beta.chat.completions.stream({
          messages,
          model,
          stream: true,
          tools: this.tools.map(toolConvert),
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
          tools: this.tools.map(toolConvert),
        })
      }
      // this.logger.info(JSON.stringify(chatCompletion, null, 2))
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
      const toChaiteConverter = getIntoChaiteConverter('openai')
      const contents = (chatCompletion as ParsedChatCompletion<null>).choices
        .map(ch => ch.message)
        .map(toChaiteConverter)
        .filter(ch => ch.content && ch.content.length > 0)
        .map(ch => ch.content)
        .reduce((a, b) => [...a, ...b], [] as MessageContent[])
      const rspToSave = {
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
      // this.logger.info(JSON.stringify(rspToSave))
      await this.historyManager.saveHistory(rspToSave, options.conversationId)
      options.parentMessageId = id
      if (rspToSave.toolCalls && rspToSave.toolCalls?.length > 0) {
        const toolCallResults: ToolCallResult[] = []
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
              tool_call_id: r.id,
              content: toolResult,
              type: 'tool',
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
        return await this.sendMessage(undefined, options)
      }
      return {
        id,
        model,
        contents,
        usage: {
          promptTokens: chatCompletion.usage?.prompt_tokens,
          completionTokens: chatCompletion.usage?.completion_tokens,
          totalTokens: chatCompletion.usage?.total_tokens,
          cachedTokens: chatCompletion.usage?.prompt_tokens_details?.cached_tokens,
          reasoningTokens: chatCompletion.usage?.completion_tokens_details?.reasoning_tokens,
        } as ModelUsage,
      } as ModelResponse

    })
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