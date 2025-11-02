import {
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import {
  AssistantMessage,
  ImageContent,
  IMessage, ReasoningContent,
  TextContent,
  ToolCallResultMessage,
  UserMessage,
} from '../../../types'
import {
  Content,
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
  GenerateContentResponse,
  Part, Schema, Tool,
  Tool as GeminiTool, Type,
} from '@google/genai'

// 将消息IMessage转换为Gemini格式
registerFromChaiteConverter<Content>('gemini', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    const parts: Part[] = []
    msg.content.forEach(c => {
      switch (c.type) {
      case 'text': {
        const text = (c as TextContent).text
        if (typeof text === 'string' && text.trim().length > 0) {
          parts.push({ text } as Part)
        }
        break
      }
      case 'image': {
        const mimeType = (c as ImageContent).mimeType
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: (c as ImageContent).image,
          },
        } as Part)
        break
      }
      default: {
        break
      }
      }
    })
    msg.toolCalls?.forEach(tc => {
      parts.push({
        functionCall: {
          name: tc.function.name,
          args: tc.function.arguments,
        } as FunctionCall,
      } as Part)
    })
    const filteredParts = parts.filter((part): part is Part => Boolean(part))
    return {
      role: 'model',
      parts: filteredParts,
    } as Content
  }
  case 'user': {
    const msg = source as UserMessage
    const parts = msg.content.map(t => {
      switch (t.type) {
      case 'text': {
        if (typeof t.text === 'string' && t.text.trim().length > 0) {
          return { text: t.text } as Part
        }
        return null
      }
      case 'audio': {
        return null
      }
      case 'image': {
        let mimeType = t.mimeType
        // @see https://ai.google.dev/gemini-api/docs/vision?lang=rest#technical-details-image
        const allowMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']
        if (mimeType && !allowMimeTypes.includes(mimeType)) {
          mimeType = 'image/jpeg'
        }
        if (!t.image) {
          return null
        }
        return { inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: t.image,
        } } as Part
      }
      default: {
        return null
      }
      }
    }).filter((part): part is Part => Boolean(part))
    return {
      role: 'user',
      parts,
    } as Content
  }
  case 'tool': {
    const msg = source as ToolCallResultMessage
    return {
      role: 'user',
      parts: msg.content.map(tcr => {
        return {
          functionResponse: {
            name: tcr.name as string,
            response: {
              name: tcr.name,
              content: tcr.content,
            },
          } as FunctionResponse,
        } as Part
      }),
    } as Content
  }
  default: {
    throw new Error('Unknown type')
  }
  }
})

// 将Gemini格式转为IMessage
registerIntoChaiteConverter<GenerateContentResponse>('gemini', msg => {
  const text = msg.text?.trim()
  const content = []
  if (text && text.length > 0) {
    content.push({ type: 'text', text } as TextContent)
  }
  msg.candidates?.forEach(candidate => {
    candidate.content?.parts?.forEach(part => {
      const reasoningText = part.text?.trim()
      if (part.thought && reasoningText) {
        content.push({ type: 'reasoning', text: reasoningText } as ReasoningContent)
      }
    })
  })
  const candidates = msg.candidates
  candidates?.forEach(candidate => {
    candidate.content?.parts?.forEach(part => {
      if (part.inlineData?.data) {
        content.push({
          type: 'image',
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        } as ImageContent)
      }
    })
  })
  const toolCalls = msg.functionCalls
  return {
    role: 'assistant',
    content,
    toolCalls: toolCalls?.map(toolCall => {
      const randomString = Math.random().toString(36).substring(2, 15)
      return {
        id: randomString,
        type: 'function',
        function: {
          name: toolCall.name,
          arguments: toolCall.args,
        },
      }
    }),
  } as AssistantMessage
})

// 将Tool转换为Gemini格式
registerFromChaiteToolConverter<FunctionDeclaration>('gemini', tool => {
  return {
    name: tool.function.name,
    description: tool.function.description,
    parameters: {
      type: Type.OBJECT,
      properties: tool.function.parameters.properties as unknown as Record<string, Schema>,
      required: tool.function.parameters.required,
    } as Schema,
  } as FunctionDeclaration
})

export {}
