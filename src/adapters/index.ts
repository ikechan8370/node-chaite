import { BaseClientOptions, ChaiteContext, ClientType, IClient } from '../types/index.js'
import { OpenAIClient } from './impl/openai/OpenAIClient.js'
import { ClaudeClient } from './impl/claude/ClaudeClient.js'
import { GeminiClient } from './impl/gemini/GeminiClient.js'

export * from './clients.js'
export * from './impl/openai/OpenAIClient.js'
export * from './impl/gemini/GeminiClient.js'
export * from './impl/claude/ClaudeClient.js'

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