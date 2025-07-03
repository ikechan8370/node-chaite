import { OpenAIClient } from './impl/openai/OpenAIClient'
import { ClaudeClient } from './impl/claude/ClaudeClient'
import { GeminiClient } from './impl/gemini/GeminiClient'
import { BaseClientOptions, ChaiteContext, ClientType, IClient } from '../types'

export function createClient(name: ClientType, options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext): IClient {
  switch (name) {
  case 'openai': {
    return new OpenAIClient(options, context)
  }
  case 'claude': {
    return new ClaudeClient(options, context)
  }
  case 'gemini': {
    return new GeminiClient(options, context)
  }
  }
}
