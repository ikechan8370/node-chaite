import { Feature, HistoryMessage } from './models'
import { Tool } from './tools'
import { ClientType, HistoryManager } from '../adapters'

export const MultipleKeyStrategyChoice = {
  RANDOM: 'random' as MultipleKeyStrategy,
  ROUND_ROBIN: 'round-robin' as MultipleKeyStrategy,
  CONVERSATION_HASH: 'conversation-hash' as MultipleKeyStrategy,
}

export type MultipleKeyStrategy = 'random' | 'round-robin' | 'conversation-hash'

export interface BaseClientOptions {
  features: Feature[]
  tools: Tool[]

  baseUrl: string
  apiKey: string | string[]
  multipleKeyStrategy?: MultipleKeyStrategy

  proxy?: string

  historyManager: HistoryManager
  logger?: ILogger
}

export interface ILogger {
  debug(msg: string, ...args: never[]): void
  info(msg: string, ...args: never[]): void
  warn(msg: string, ...args: never[]): void
  error(msg: string, ...args: never[]): void
}

export const DefaultLogger = new class DefaultLogger implements ILogger {
  debug(msg: string, ...args: never[]): void {
    console.log(msg, ...args)
  }

  error(msg: string, ...args: never[]): void {
    console.log(msg, ...args)
  }

  info(msg: string, ...args: never[]): void {
    console.log(msg, ...args)
  }

  warn(msg: string, ...args: never[]): void {
    console.log(msg, ...args)
  }
}()

export class ChaiteContext {
  constructor(logger: ILogger) {
    this.logger = logger
  }
  logger?: ILogger
}

export interface Into<U> {
  into(): U;
}

export interface From<T> {
  from(value: T): this;
}