import type OpenAI from 'openai'
import type { ModelResponseChunk, ReasoningContent, ReasoningPart, TextContent, ToolCall } from '../../../types'
import { parseToolArguments } from '../../../utils/toolArguments'

/** Tool calls stream independently by index; IDs usually appear only in the first delta. */
export class OpenAIStreamAccumulator {
  private calls = new Map<number, { id: string, name: string, arguments: string, emitted?: string }>()
  private reasoning = ''

  applyReasoning(completion: OpenAI.ChatCompletion): void {
    const choice = completion.choices.find(choice => choice.index === 0)
    if (choice && this.reasoning) (choice.message as typeof choice.message & ReasoningPart).reasoning_content = this.reasoning
  }

  push(chunk: OpenAI.ChatCompletionChunk): ModelResponseChunk | undefined {
    const choice = chunk.choices.find(choice => choice.index === 0)
    if (!choice) return
    const delta = choice.delta as typeof choice.delta & ReasoningPart
    const content: ModelResponseChunk['delta'] = []
    if (delta.content) content.push({ type: 'text', text: delta.content } as TextContent)
    const reasoning = delta.reasoning_content || delta.reasoning || delta.thinking_content || delta.thinking || delta.think
    if (reasoning) {
      this.reasoning += reasoning
      content.push({ type: 'reasoning', text: reasoning } as ReasoningContent)
    }
    const toolCalls: ToolCall[] = []
    for (const part of delta.tool_calls || []) {
      const call = this.calls.get(part.index) || { id: '', name: '', arguments: '' }
      if (part.id) call.id = part.id
      if (part.function?.name) call.name += part.function.name
      if (part.function?.arguments) call.arguments += part.function.arguments
      this.calls.set(part.index, call)
      if (!call.id || !call.name || call.emitted !== undefined) continue
      try {
        const args = parseToolArguments(call.arguments, call.name) as ToolCall['function']['arguments']
        // An empty initial fragment is not a complete function call.
        if (!call.arguments.trim()) continue
        toolCalls.push({ id: call.id, type: 'function', function: { name: call.name, arguments: args } })
        call.emitted = call.arguments
      } catch { /* Wait for the remaining JSON fragments. */ }
    }
    if (!content.length && !toolCalls.length) return
    return { id: chunk.id, model: chunk.model, delta: content, ...(toolCalls.length ? { toolCall: toolCalls } : {}) }
  }
}
