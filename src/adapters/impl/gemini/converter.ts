import {
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import {
  AssistantMessage,
  ImageContent,
  IMessage,
  TextContent,
  ToolCallResultMessage,
  UserMessage
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
          if ((c as TextContent).text) {
            parts.push({ text: (c as TextContent).text } as Part)
          }
          break
        }
        case 'image': {
          let mimeType = (c as ImageContent).mimeType
          parts.push({
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: (c as ImageContent).image,
            }
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
          return { text: t.text } as Part
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
          } } as Part
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
  const text = msg.text
  const content = []
  if (text) {
    content.push({ type: 'text', text } as TextContent)
  }
  const candidates = msg.candidates
  candidates?.forEach(candidate => {
    candidate.content?.parts?.forEach(part => {
      if (part.inlineData) {
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
registerFromChaiteToolConverter<GeminiTool>('gemini', tool => {
  return {
    functionDeclarations: [{
      name: tool.function.name,
      description: tool.function.description,
      parameters: {
        type: Type.OBJECT,
        properties: tool.function.parameters.properties as unknown as Record<string, Schema>,
        required: tool.function.parameters.required,
      } as Schema,
    } as FunctionDeclaration],
  } as Tool
})

export {}
