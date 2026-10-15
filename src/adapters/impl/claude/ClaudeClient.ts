import Anthropic from '@anthropic-ai/sdk'
import { AbstractClient } from '../../clients'
import { BaseClientOptions } from '../../../types'
import { ChaiteContext, HistoryMessage, IMessage, ModelUsage } from '../../../types'
import { getIntoChaiteConverter } from '../../../utils/converter'
import { buildClaudeRequest } from './request'
import './converter'
import { SendMessageOption } from '../../../types'
import * as crypto from 'node:crypto'
import { VERSION } from '../../../index'

export class ClaudeClient extends AbstractClient {
  constructor(options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext) {
    super(options, context)
    this.name = 'claude'
  }

  async _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & { usage: ModelUsage }> {
    const debug = this.context.chaite.getGlobalConfig()?.getDebug()
    const request = buildClaudeRequest(histories, this.tools, options)

    const anthropic = new Anthropic({
      apiKey,
      baseURL: this.baseUrl,
      defaultHeaders: {
        'x-request-from': 'node-chaite/' + VERSION,
      },
    })

    if (debug) {
      this.logger.debug(`Claude request: ${JSON.stringify(request)}`)
    }
    const result = await anthropic.messages.create(request)
    if (debug) {
      this.logger.debug(`claude response: ${JSON.stringify(result)}`)
    }
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
      promptTokens: result.usage.input_tokens,
      completionTokens: result.usage.output_tokens,
      totalTokens: result.usage.input_tokens + result.usage.output_tokens,
      cachedTokens: (result.usage.cache_read_input_tokens || 0) + (result.usage.cache_creation_input_tokens || 0),
      reasoningTokens: result.usage.output_tokens_details?.thinking_tokens ?? 0,
    }
    return {
      ...rspToSave,
      usage,
    }
  }

}
