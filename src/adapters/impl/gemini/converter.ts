import { registerFromChaiteConverter, registerFromChaiteToolConverter, registerIntoChaiteConverter } from '../../../utils/converter'
import type { AssistantMessage, ImageContent, IMessage, MessageContent, ProviderContextContent, ReasoningContent, TextContent, ToolCall, ToolCallResultMessage, UserMessage } from '../../../types'
import type { Content, FunctionDeclaration, GenerateContentResponse, Part } from '@google/genai'
import { randomUUID } from 'node:crypto'
import { parseInlineImage } from '../../../utils/imageData'
import { parseToolArguments } from '../../../utils/toolArguments'

function imagePart(image: ImageContent): Part {
  if (/^(?:https?:\/\/|gs:\/\/)/i.test(image.image)) return { fileData: { fileUri: image.image, mimeType: image.mimeType || 'image/jpeg' } }
  return { inlineData: parseInlineImage(image.image, image.mimeType) }
}

registerFromChaiteConverter<Content>('gemini', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    const parts: Part[] = []
    const snapshot = msg.content.find(part => part.type === 'provider_context' && (part as ProviderContextContent).provider === 'gemini' && Array.isArray((part as ProviderContextContent).data.parts)) as ProviderContextContent | undefined
    const emitted = new Set<string>()
    const appendCall = (call: ToolCall, original: Part = {}) => {
      const functionCall = { ...original.functionCall, name: call.function.name, args: parseToolArguments(call.function.arguments, call.function.name), ...(call.providerCallId !== null ? { id: call.providerCallId || call.id } : {}) }
      if (call.providerCallId === null) delete functionCall.id
      parts.push({ ...original, functionCall, ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {}) })
      emitted.add(call.id)
    }
    if (snapshot) {
      const texts = msg.content.filter((part): part is TextContent => part.type === 'text')
      const images = msg.content.filter((part): part is ImageContent => part.type === 'image')
      const ids = snapshot.data.functionCallIds as Record<string, string> || {}
      let textIndex = 0
      let imageIndex = 0
      const originalParts = snapshot.data.parts as Part[]
      originalParts.forEach((part, index) => {
        if (part.functionCall) {
          const call = msg.toolCalls?.find(call => call.id === (ids[index] || part.functionCall?.id))
          if (call) appendCall(call, part)
        } else if (part.text !== undefined && !part.thought) {
          const text = texts[textIndex++]
          if (text) parts.push({ ...part, text: text.text })
        } else if (part.inlineData?.data) {
          const image = images[imageIndex++]
          if (image) parts.push({ ...part, ...imagePart(image) })
        } else parts.push(part)
      })
      for (; textIndex < texts.length; textIndex++) parts.push({ text: texts[textIndex].text })
      for (; imageIndex < images.length; imageIndex++) parts.push(imagePart(images[imageIndex]))
    } else {
      // Compatibility with history saved before whole-turn snapshots existed.
      for (const part of msg.content) {
        if (part.type === 'text' || (part.type === 'reasoning' && part.thoughtSignature)) {
          parts.push({ text: (part as TextContent).text, ...(part.type === 'reasoning' ? { thought: true } : {}), ...(part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {}) })
        } else if (part.type === 'image') parts.push({ ...imagePart(part as ImageContent), ...(part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {}) })
        else if (part.type === 'provider_context' && (part as ProviderContextContent).provider === 'gemini') parts.push((part as ProviderContextContent).data as Part)
      }
    }
    for (const call of msg.toolCalls || []) if (!emitted.has(call.id)) appendCall(call)
    return { role: 'model', parts }
  }
  case 'user': {
    const parts: Part[] = []
    for (const part of (source as UserMessage).content) {
      if (part.type === 'text' && part.text.trim()) parts.push({ text: part.text })
      else if (part.type === 'image' && part.image) parts.push(imagePart(part))
      else if (part.type === 'audio' && part.data) parts.push({ inlineData: { data: part.data, mimeType: part.format === 'wav' ? 'audio/wav' : 'audio/mpeg' } })
    }
    return { role: 'user', parts }
  }
  case 'tool': return {
    role: 'user',
    parts: (source as ToolCallResultMessage).content.map(result => {
      if (!result.name) throw new Error('Gemini 工具结果缺少 name')
      return { functionResponse: {
        ...(result.providerCallId !== null && (result.providerCallId || result.tool_call_id) ? { id: result.providerCallId || result.tool_call_id } : {}),
        name: result.name,
        response: { name: result.name, content: result.content },
      } }
    }),
  }
  default: throw new Error(`Gemini 消息转换不支持 role=${source.role}`)
  }
})

registerIntoChaiteConverter<GenerateContentResponse>('gemini', msg => {
  const content: MessageContent[] = []
  const toolCalls: ToolCall[] = []
  const parts = msg.candidates?.[0]?.content?.parts || []
  const ids: Record<string, string> = {}
  parts.forEach((part, index) => {
    if (part.text !== undefined) content.push({ type: part.thought ? 'reasoning' : 'text', text: part.text, thoughtSignature: part.thoughtSignature } as TextContent | ReasoningContent)
    if (part.inlineData?.data) content.push({ type: 'image', image: part.inlineData.data, mimeType: part.inlineData.mimeType, thoughtSignature: part.thoughtSignature } as ImageContent)
    if (part.functionCall) {
      const id = part.functionCall.id || randomUUID()
      ids[index] = id
      toolCalls.push({ id, type: 'function', providerCallId: part.functionCall.id || null,
        function: { name: part.functionCall.name || '', arguments: parseToolArguments(part.functionCall.args, part.functionCall.name) as ToolCall['function']['arguments'] },
        thoughtSignature: part.thoughtSignature })
    }
  })
  // Retain all parts, including empty signed text and interleaved server/function calls.
  if (parts.length) content.push({ type: 'provider_context', provider: 'gemini', data: { parts, functionCallIds: ids } } as ProviderContextContent)
  return { role: 'assistant', content, toolCalls: toolCalls.length ? toolCalls : undefined } as AssistantMessage
})

registerFromChaiteToolConverter<FunctionDeclaration>('gemini', tool => ({
  name: tool.function.name, description: tool.function.description,
  parametersJsonSchema: tool.function.parameters,
}))
