// 将IMessage转换为OpenAI格式
import {
  OpenAICompatibleMessageParam,
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import {
  AssistantMessage, AudioContent, DeveloperMessage, ImageContent,
  IMessage, MessageContent, ReasoningContent,
  ReasoningPart, SystemMessage,
  TextContent,
  ToolCall, ToolCallResult,
  ToolCallResultMessage,
  UserMessage,
} from '../../../types/index'
import OpenAI from 'openai'
import FunctionDefinition = OpenAI.FunctionDefinition;
import { FunctionParameters } from 'openai/src/resources/shared.js'

// 将消息IMessage转换为OpenAI格式
registerFromChaiteConverter<OpenAI.ChatCompletionMessageParam | OpenAI.ChatCompletionMessageParam[]>('openai', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    return {
      role: 'assistant',
      content: msg.content.map(t => t as unknown as OpenAI.ChatCompletionContentPartText),
      tool_calls: (msg.toolCalls && msg.toolCalls?.length > 0) ? msg.toolCalls?.map(t => {
        return {
          id: t.id,
          type: t.type,
          function: {
            arguments: JSON.stringify(t.function.arguments),
            name: t.function.name,
          } as OpenAI.ChatCompletionMessageToolCall.Function,
        }
      }) : undefined,
    } as OpenAI.ChatCompletionAssistantMessageParam
  }
  case 'user': {
    const msg = source as UserMessage
    return {
      role: 'user',
      content: msg.content.map(t => {
        switch (t.type) {
        case 'text': {
          return { type: 'text', text: t.text } as OpenAI.ChatCompletionContentPartText
        }
        case 'audio': {
          return {
            type: 'input_audio',
            input_audio: { data: t.data, format: t.format },
          } as OpenAI.ChatCompletionContentPartInputAudio
        }
        case 'image': {
          return { type: 'image_url', image_url: { url: t.image.startsWith('http') ? t.image : `data:image/jpeg;base64,${t.image}` } } as OpenAI.ChatCompletionContentPartImage
        }
        }
      }),
    } as OpenAI.ChatCompletionUserMessageParam
  }
  case 'tool': {
    const msg = source as ToolCallResultMessage
    return msg.content.map(tcr => {
      return {
        role: 'tool',
        tool_call_id: tcr.tool_call_id,
        content: tcr.content,
      } as OpenAI.ChatCompletionToolMessageParam
    })
  }
  default: {
    throw new Error('Unknown type')
  }
  }
})

function getReasoningContent(reasoningPart: ReasoningPart) {
  return reasoningPart.reasoning_content || reasoningPart.reasoning || reasoningPart.thinking_content || reasoningPart.thinking || reasoningPart.think
}

// 将OpenAI格式转为IMessage
registerIntoChaiteConverter<OpenAICompatibleMessageParam>('openai', msg => {
  switch (msg.role) {
  case 'assistant': {
    const content = msg.content ? Array.isArray(msg.content) ? msg.content : [{
      type: 'text',
      text: msg.content,
    } as OpenAI.ChatCompletionContentPartText] : null
    
    const contents: MessageContent[] | undefined = content?.map(t => {
      return { type: 'text', text: t.type === 'text' ? t.text : t.refusal } as TextContent
    })
    const reasoningContent = getReasoningContent(msg)
    if (reasoningContent) {
      contents?.push({
        type: 'reasoning',
        text: reasoningContent,
      } as ReasoningContent)
    }
    return {
      role: 'assistant',
      content: contents,
      toolCalls: msg.tool_calls?.map(t => {
        return {
          id: t.id,
          type: 'function',
          function: {
            name: t.function.name,
            arguments: JSON.parse(t.function.arguments),
          },
        } as ToolCall
      }),
    } as AssistantMessage
  }
  case 'user': {
    if (typeof msg.content === 'string') {
      return {
        role: 'user',
        content: [{ type: 'text', text: msg.content }],
      } as UserMessage
    }
    return {
      role: 'user',
      content: msg.content?.map(t => {
        switch (t.type) {
        case 'image_url': {
          return {
            type: 'image',
            image: t.image_url.url,
          } as ImageContent
        }
        case 'text': {
          return {
            type: 'text',
            text: t.text,
          } as TextContent
        }
        case 'input_audio': {
          return {
            type: 'audio',
            data: t.input_audio.data,
          } as AudioContent
        }
        }
      }),
    } as UserMessage
  }
  case 'system': {
    return {
      role: 'system',
      content: typeof msg.content === 'string' ? [{ type: 'text', text: msg.content } as TextContent] : msg.content?.map(t => {
        return {
          type: 'text',
          text: t.text,
        }
      }),
    } as SystemMessage
  }
  case 'tool': {
    return {
      role: 'tool',
      content: typeof msg.content === 'string' ? [{
        type: 'tool',
        tool_call_id: msg.tool_call_id,
        content: msg.content,
      } as ToolCallResult] : msg.content.map(t => {
        return {
          tool_call_id: msg.tool_call_id,
          content: t.text,
        } as ToolCallResult
      }),
    } as ToolCallResultMessage
  }
  case 'developer': {
    return {
      role: 'developer',
      content: typeof msg.content === 'string' ? [{ type: 'text', text: msg.content } as TextContent] : msg.content?.map(t => {
        return {
          type: 'text',
          text: t.text,
        }
      }),
    } as DeveloperMessage
  }
  default: {
    // other roles don't need to call this converter
    throw new Error('not implemented yet')
  }
  }
})

// 将Tool转换为OpenAI格式
registerFromChaiteToolConverter<OpenAI.ChatCompletionTool>('openai', tool => {
  return {
    type: 'function',
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters as unknown as FunctionParameters,
    } as FunctionDefinition,
  } as OpenAI.ChatCompletionTool
})

export {}