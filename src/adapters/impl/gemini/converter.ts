import {
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter'
import {
  AssistantMessage,
  ImageContent,
  IMessage,
  MessageContent,
  ProviderContextContent,
  ReasoningContent,
  TextContent,
  ToolCall,
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
          const part: Part = { text }
          if (c.thoughtSignature) {
            part.thoughtSignature = c.thoughtSignature
          }
          parts.push(part)
        }
        break
      }
      case 'image': {
        const mimeType = (c as ImageContent).mimeType
        const part: Part = {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: (c as ImageContent).image,
          },
        }
        if (c.thoughtSignature) {
          part.thoughtSignature = c.thoughtSignature
        }
        parts.push(part)
        break
      }
      case 'provider_context': {
        const context = c as ProviderContextContent
        if (context.provider === 'gemini') {
          parts.push(context.data as Part)
        }
        break
      }
      default: {
        break
      }
      }
    })
    msg.toolCalls?.forEach(tc => {
      const part: Part = {
        functionCall: {
          id: tc.id,
          name: tc.function.name,
          args: tc.function.arguments,
        } as FunctionCall,
      }
      if (tc.thoughtSignature) {
        part.thoughtSignature = tc.thoughtSignature
      }
      parts.push(part)
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
        const allowMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
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
            id: tcr.tool_call_id,
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
  const content: MessageContent[] = []
  const toolCalls: ToolCall[] = []

  msg.candidates?.forEach(candidate => {
    candidate.content?.parts?.forEach(part => {
      const reasoningText = part.text?.trim()

      // Handle Text & Reasoning
      if (part.text) {
        if (reasoningText && reasoningText.length > 0) {
          if (part.thought) {
            content.push({
              type: 'reasoning',
              text: reasoningText,
              thoughtSignature: part.thoughtSignature,
            } as ReasoningContent)
          } else {
            content.push({
              type: 'text',
              text: reasoningText,
              thoughtSignature: part.thoughtSignature,
            } as TextContent)
          }
        }
      }

      // Handle Image
      if (part.inlineData?.data) {
        content.push({
          type: 'image',
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
          thoughtSignature: part.thoughtSignature,
        } as ImageContent)
      }

      // Handle Tool Call
      if (part.functionCall) {
        const toolCallId = part.functionCall.id || Math.random().toString(36).substring(2, 15)
        toolCalls.push({
          id: toolCallId,
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: part.functionCall.args,
          },
          thoughtSignature: part.thoughtSignature,
        } as ToolCall)
      }

      // Gemini 3 returns server-side tool context as opaque parts. Echoing
      // these parts unchanged is required when a later custom function call
      // continues the same tool-combination turn.
      if (part.toolCall || part.toolResponse || part.executableCode || part.codeExecutionResult) {
        content.push({
          type: 'provider_context',
          provider: 'gemini',
          data: part as unknown as Record<string, unknown>,
        } as ProviderContextContent)
      }
    })
  })

  return {
    role: 'assistant',
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
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
