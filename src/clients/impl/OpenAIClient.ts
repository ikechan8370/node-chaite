import {
  IMessage,
  UserMessage,
  ToolCallResultMessage,
  ModelResponse,
  AssistantMessage,
  ModelUsage,
} from '../../types'
import { AbstractClass, SendMessageOption } from '../clients'
import { BaseClientOptions, ChaiteContext } from '../../types/common'
import OpenAI from 'openai'
import { asyncLocalStorage, getKey } from '../../utils'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartInputAudio,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall, ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/src/resources/chat/completions/completions'
import {
  getFromChaiteConverter,
  getIntoChaiteConverter,
  registerFromChaiteConverter,
  registerIntoChaiteConverter,
} from '../../utils/converter'

export type OpenAIClientOptions = BaseClientOptions

export class OpenAIClient extends AbstractClass {

  constructor(options: OpenAIClientOptions) {
    super(options)
  }

  async sendMessage(message: UserMessage | ToolCallResultMessage, options: SendMessageOption): Promise<ModelResponse> {
    const store = new ChaiteContext(this.logger)
    return asyncLocalStorage.run(store, async () => {
      const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy)
      const client = new OpenAI({
        apiKey,
        baseURL: this.baseUrl,
      })
      const histories = await this.getHistory(options.parentMessageId, options.conversationId, options.channelId)

      const messages: ChatCompletionMessageParam[] = []
      const model = options.model
      if (options.systemOverride) {
        if (model.includes('o1') || model.includes('o3')) {
          messages.push({ role: 'developer', content: options.systemOverride })
        } else {
          messages.push({ role: 'system', content: options.systemOverride })
        }
      }
      for (const history of histories) {
        const converter = getFromChaiteConverter('openai')
        const openaiMsg = converter(history)
        messages.push(openaiMsg)
      }
      // todo stream
      const chatCompletion = await client.chat.completions.create({
        messages,
        model,
      })
      // todo save history
      const id = crypto.randomUUID()
      const toChaiteConverter = getIntoChaiteConverter('openai')
      return {
        id,
        model,
        contents: chatCompletion.choices.map(ch => ch.message).map(toChaiteConverter).map(ch => ch.content).reduce((a, b) => [...a, ...b]),
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
}

registerFromChaiteConverter<ChatCompletionMessageParam>('openai', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    return {
      role: 'assistant',
      content: msg.content.map(t => t as unknown as ChatCompletionContentPartText),
      tool_calls: msg.toolCalls?.map(t => {
        return {
          id: t.id,
          type: t.type,
          function: {
            arguments: JSON.stringify(t.function.arguments),
            name: t.function.name,
          } as ChatCompletionMessageToolCall.Function,
        }
      }),
    } as ChatCompletionAssistantMessageParam
  }
  case 'user': {
    const msg = source as UserMessage
    return {
      role: 'user',
      content: msg.content.map(t => {
        switch (t.type) {
        case 'string': {
          return { type: 'text', text: t.text } as ChatCompletionContentPartText
        }
        case 'audio': {
          return {
            type: 'input_audio',
            input_audio: { data: t.data, format: t.format },
          } as ChatCompletionContentPartInputAudio
        }
        case 'image': {
          return { type: 'image_url', image_url: { url: t.image } } as ChatCompletionContentPartImage
        }
        }
      }),
    } as ChatCompletionUserMessageParam
  }
  case 'tool': {
    const msg = source as ToolCallResultMessage
    return {
      role: 'tool',
      tool_call_id: msg.tool_call_id,
      content: msg.content.map(t => {
        return { type: 'text', text: t.text } as ChatCompletionContentPartText
      }),
    } as ChatCompletionToolMessageParam
  }
  default: {
    throw new Error('Unknown type')
  }
  }
})

registerIntoChaiteConverter<ChatCompletionMessageParam>('openai', msg => {
  return {
    // todo
  } as IMessage
})