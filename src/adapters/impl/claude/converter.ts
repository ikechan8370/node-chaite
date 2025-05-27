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
} from '../../../types/index'
import Anthropic from '@anthropic-ai/sdk'
// 将消息IMessage转换为Claude格式
registerFromChaiteConverter<Anthropic.MessageParam>('claude', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    const blocks: Anthropic.ContentBlockParam[] = []
    msg.content.forEach(c => {
      if (c.type === 'text' && (c as TextContent).text) {
        blocks.push({
          text: (c as TextContent).text,
          type: 'text',
        })
      }
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
    } as Anthropic.MessageParam
  }
  case 'user': {
    const msg = source as UserMessage
    return {
      role: 'user',
      content: msg.content.map(t => {
        switch (t.type) {
        case 'text': {
          return { text: t.text, type: 'text' } as Anthropic.TextBlockParam
        }
        case 'audio': {
          return null
        }
        case 'image': {
          return {
            type: 'image', source: t.image.startsWith('http') ? {
              type: 'url', url: t.image,
            } as Anthropic.URLImageSource : { type: 'base64', media_type: t.mimeType || 'image/jpeg', data: t.image } as Anthropic.Base64ImageSource,
          } as Anthropic.ImageBlockParam
        }
        }
      }),
    } as Anthropic.MessageParam
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
        } as Anthropic.ToolResultBlockParam
      }),
    } as Anthropic.MessageParam
  }
  default: {
    throw new Error('Unknown type')
  }
  }
})

// 将Claude格式转为IMessage
registerIntoChaiteConverter<Anthropic.MessageParam>('claude', msg => {
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
registerFromChaiteToolConverter<Anthropic.ToolUnion>('claude', tool => {
  return {
    name: tool.function.name,
    description: tool.function.description,
    input_schema: {
      ...tool.function.parameters,
    } as Anthropic.Tool.InputSchema,
  } as Anthropic.Tool
})

export {}
