import { BaseClientOptions, ChaiteContext, ClientType, IClient } from '../types/index'
import { OpenAIClient } from './impl/openai/OpenAIClient'
import { ClaudeClient } from './impl/claude/ClaudeClient'
import { GeminiClient } from './impl/gemini/GeminiClient'

export * from './clients'
export * from './impl/openai/OpenAIClient'
export * from './impl/gemini/GeminiClient'
export * from './impl/claude/ClaudeClient'

export function createClient(name: ClientType, options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext): IClient {
  switch (name) {
  case 'openai': {
    return new OpenAIClient(options)
  }
  case 'claude': {
    return new ClaudeClient(options)
  }
  case 'gemini': {
    return new GeminiClient(options)
  }
  }
}