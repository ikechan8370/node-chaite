import Anthropic from '@anthropic-ai/sdk'
import { MessageParam, ToolChoice, ToolChoiceTool } from '@anthropic-ai/sdk/src/resources/messages/messages'
import { AbstractClass } from '../../clients'
import { GeminiClientOptions } from '../gemini/GeminiClient'
import { HistoryMessage, ModelUsage } from '../../../types'
import { getFromChaiteConverter, getFromChaiteToolConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter'
import { SendMessageOption } from '../../../types'

export class ClaudeClient extends AbstractClass {
  constructor(options: GeminiClientOptions) {
    super(options)
    this.name = 'claude'
  }
  
  async _sendMessage(histories: HistoryMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const messages: MessageParam[] = []
    const model = options.model || 'claude-3-7-sonnet-20250219'
    const converter = getFromChaiteConverter('claude')
    const toolConverter = getFromChaiteToolConverter('claude')
    for (const history of histories) {
      const claudeContent = converter(history)
      messages.push(claudeContent)
    }

    const anthropic = new Anthropic({
      apiKey,
    })

    const tools = this.tools.map(toolConverter)
    if (options.toolChoice?.type === 'specified' && (options.toolChoice.tools?.length === 0 || !options.toolChoice.tools)) {
      throw new Error('`toolChoice.tools` must be set if `toolChoice.type` is set to `specified`')
    }
    const toolModeMap: Record<string, ToolChoice> = {
      'auto': {
        type: 'auto',
      },
      'any': {
        type: 'any',
      },
      'none': {
        type: 'none',
      },
      'specified': {
        type: 'tool',
        name: '',
      },
    }
    if (options.toolChoice?.tools && options.toolChoice.tools.length > 0) {
      (toolModeMap.specified as ToolChoiceTool).name = options.toolChoice.tools[0]
    }
    const result = await anthropic.messages.create({
      model,
      max_tokens: options.maxToken || 1024,
      temperature: options.temperature,
      system: options.systemOverride,
      messages,
      tools,
      thinking: options.enableReasoning ? {
        type: 'enabled',
        budget_tokens: options.reasoningBudgetTokens || 1024,
      } : {
        type: 'disabled',
      },
      tool_choice: options.toolChoice?.type ? toolModeMap[options.toolChoice.type] : undefined,
    })

    const id = crypto.randomUUID()
    const intoChaiteConverter = getIntoChaiteConverter('claude')
    const iMessage = intoChaiteConverter(result)
    const rspToSave = {
      id,
      parentId: options.parentMessageId,
      role: 'assistant',
      content: iMessage.content,
      toolCalls: iMessage.toolCalls,
    } as HistoryMessage
    const usage = {
      promptTokens: result.usage.output_tokens,
      completionTokens: result.usage.output_tokens,
      totalTokens: result.usage.output_tokens + result.usage.output_tokens,
      cachedTokens: (result.usage.cache_read_input_tokens || 0) + (result.usage.cache_creation_input_tokens || 0),
      reasoningTokens: 0,
    }
    return {
      ...rspToSave,
      usage,
    }
  }
  
}