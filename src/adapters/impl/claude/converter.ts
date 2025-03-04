import {
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import {
  AssistantMessage,
  IMessage,
  ToolCall,
  ToolCallResultMessage,
  UserMessage,
  FunctionCall, ReasoningContent, TextContent,
} from '../../../types'
import {
  Base64ImageSource,
  ContentBlockParam,
  ImageBlockParam,
  MessageParam,
  TextBlockParam, Tool, ToolResultBlockParam, ToolUnion, URLImageSource,
} from '@anthropic-ai/sdk/src/resources/messages/messages'

// 将消息IMessage转换为Claude格式
registerFromChaiteConverter<MessageParam>('claude', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    const blocks: ContentBlockParam[] = []
    msg.content.forEach(c => {
      blocks.push({
        text: c.text,
        type: 'text',
      })
    })
    msg.toolCalls?.forEach(tc => {
      blocks.push({
        type: 'tool_use',
        name: tc.function.name,
        input: tc.function.arguments,
        id: tc.id,
      })
    })
    return {
      role: 'assistant',
      content: blocks,
    } as MessageParam
  }
  case 'user': {
    const msg = source as UserMessage
    return {
      role: 'user',
      content: msg.content.map(t => {
        switch (t.type) {
        case 'text': {
          return { text: t.text, type: 'text' } as TextBlockParam
        }
        case 'audio': {
          return null
        }
        case 'image': {
          return {
            type: 'image', source: t.image.startsWith('http') ? {
              type: 'url', url: t.image,
            } as URLImageSource : { type: 'base64', media_type: t.mimeType, data: t.image } as Base64ImageSource,
          } as ImageBlockParam
        }
        }
      }),
    } as MessageParam
  }
  case 'tool': {
    const msg = source as ToolCallResultMessage
    return {
      role: 'user',
      content: msg.content.map(tcr => {
        return {
          type: 'tool_result',
          tool_use_id: tcr.tool_call_id,
          content: tcr.content,
        } as ToolResultBlockParam
      }),
    } as MessageParam
  }
  default: {
    throw new Error('Unknown type')
  }
  }
})

// 将Claude格式转为IMessage
registerIntoChaiteConverter<MessageParam>('claude', msg => {
  const content = msg.content
  let text: string | null = null
  let thinking: string | null = null
  let toolCalls: ToolCall[] = []
  if (Array.isArray(content)) {
    text = content.filter(c => c.type === 'text').reduce((acc, curr) => acc + curr.text, '')
    toolCalls = content.filter(c => c.type === 'tool_use').map(tc => {
      return {
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: tc.input as object,
        } as FunctionCall,
      } as ToolCall
    })
    thinking = content.filter(c => c.type === 'thinking').reduce((acc, curr) => acc + curr.thinking, '')
  }
  const contents = []
  if (text) {
    contents.push({ type: 'text', text } as TextContent)
  }
  if (thinking) {
    contents.push({ type: 'reasoning', text: thinking } as ReasoningContent)
  }
  return {
    role: 'assistant',
    content: contents,
    toolCalls,
  } as AssistantMessage
})

// 将Tool转换为Claude格式
registerFromChaiteToolConverter<ToolUnion>('claude', tool => {
  return {
    name: tool.function.name,
    description: tool.function.description,
    input_schema: {
      ...tool.function.parameters,
    } as Tool.InputSchema,
  } as Tool
})

export {}