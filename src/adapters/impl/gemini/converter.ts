import {
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import { AssistantMessage, IMessage, ToolCallResultMessage, UserMessage } from '../../../types/index'
import {
  Content,
  FunctionCall,
  FunctionCallPart,
  FunctionDeclaration,
  FunctionDeclarationSchema,
  FunctionDeclarationsTool,
  FunctionResponse,
  FunctionResponsePart,
  GenerateContentResult,
  InlineDataPart,
  Part,
  SchemaType,
  TextPart,
  Tool as GeminiTool,
} from '@google/generative-ai'

// 将消息IMessage转换为Gemini格式
registerFromChaiteConverter<Content>('gemini', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    const parts: Part[] = []
    msg.content.forEach(c => {
      parts.push({
        text: c.text,
      } as TextPart)
    })
    msg.toolCalls?.forEach(tc => {
      parts.push({
        functionCall: {
          name: tc.function.name,
          args: tc.function.arguments,
        } as FunctionCall,
      } as FunctionCallPart)
    })
    return {
      role: 'model',
      parts,
    } as Content
  }
  case 'user': {
    const msg = source as UserMessage
    return {
      role: 'user',
      parts: msg.content.map(t => {
        switch (t.type) {
        case 'text': {
          return { text: t.text } as TextPart
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
          return { inlineData: {
            mimeType: t.mimeType || 'image/jpeg',
            data: t.image,
          } } as InlineDataPart
        }
        }
      }),
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
        } as FunctionResponsePart
      }),
    } as Content
  }
  default: {
    throw new Error('Unknown type')
  }
  }
})

// 将Gemini格式转为IMessage
registerIntoChaiteConverter<GenerateContentResult>('gemini', msg => {
  const text = msg.response.text()
  const toolCalls = msg.response.functionCalls()
  return {
    role: 'assistant',
    content: text ? [{ type: 'text', text: text }] : [],
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
registerFromChaiteToolConverter<GeminiTool>('gemini', tool => {
  return {
    functionDeclarations: [{
      name: tool.function.name,
      description: tool.function.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: tool.function.parameters.properties,
        required: tool.function.parameters.required,
      } as FunctionDeclarationSchema,
    } as FunctionDeclaration],
  } as FunctionDeclarationsTool
})

export {}