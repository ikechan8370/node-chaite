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

export interface RAGResult {
  content: string;
  score: number;
}

export interface Vectorizer {
  /**
   * 将文本转换为向量
   * @param text 输入文本
   * @returns 文本的向量表示
   */
  textToVector(text: string): Promise<number[]>;

  /**
   * 批量将文本转换为向量
   * @param texts 输入文本数组
   * @returns 文本向量数组
   */
  batchTextToVector(texts: string[]): Promise<number[][]>;
}