// 将IMessage转换为OpenAI格式
import {
  OpenAICompatibleMessageParam,
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import {
  AssistantMessage,
  IMessage, MessageContent, ReasoningContent,
  ReasoningPart,
  TextContent,
  ToolCall,
  ToolCallResultMessage,
  UserMessage,
} from '../../../types'
import OpenAI from 'openai'
import FunctionDefinition = OpenAI.FunctionDefinition;
import { FunctionParameters } from 'openai/src/resources/shared'

// 将消息IMessage转换为OpenAI格式
registerFromChaiteConverter<OpenAI.ChatCompletionMessageParam | OpenAI.ChatCompletionMessageParam[]>('openai', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    return {
      role: 'assistant',
      content: msg.content.map(t => t as unknown as OpenAI.ChatCompletionContentPartText),
      tool_calls: msg.toolCalls?.map(t => {
        return {
          id: t.id,
          type: t.type,
          function: {
            arguments: JSON.stringify(t.function.arguments),
            name: t.function.name,
          } as OpenAI.ChatCompletionMessageToolCall.Function,
        }
      }),
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
          return { type: 'image_url', image_url: { url: t.image } } as OpenAI.ChatCompletionContentPartImage
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
        content: msg.content.map(t => {
          return { type: 'text', text: t.content } as OpenAI.ChatCompletionContentPartText
        }),
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