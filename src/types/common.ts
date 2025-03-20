import { Feature } from './models'
import { Tool } from './tools'
import { HistoryManager } from './adapter'
import { PostProcessor, PreProcessor } from './processors'
import { DeSerializable, Serializable, Wait } from './cloud'
import { EventMessage } from './external'

export const MultipleKeyStrategyChoice = {
  RANDOM: 'random' as MultipleKeyStrategy,
  ROUND_ROBIN: 'round-robin' as MultipleKeyStrategy,
  CONVERSATION_HASH: 'conversation-hash' as MultipleKeyStrategy,
}

export type MultipleKeyStrategy = 'random' | 'round-robin' | 'conversation-hash'

export class BaseClientOptions implements Serializable, DeSerializable<BaseClientOptions>, Wait {
  features: Feature[]
  tools: Tool[]

  baseUrl: string
  apiKey: string | string[]
  multipleKeyStrategy?: MultipleKeyStrategy

  proxy?: string

  historyManager: HistoryManager
  logger?: ILogger

  postProcessorIds?: string[]
  private postProcessors?: PostProcessor[]

  preProcessorIds?: string[]
  private preProcessors?: PreProcessor[]

  constructor(options?: Partial<BaseClientOptions>) {
    if (options) {
      this.features = options.features || []
      this.tools = options.tools || []
      this.baseUrl = options.baseUrl || ''
      this.apiKey = options.apiKey || ''
      this.multipleKeyStrategy = options.multipleKeyStrategy
      this.proxy = options.proxy
      this.preProcessorIds = options.preProcessorIds
      this.postProcessorIds = options.postProcessorIds
      if (options.historyManager) {
        this.historyManager = options.historyManager
      }
      this.logger = options.logger
      this.init()
    }
  }

  static create(options: BaseClientOptions | Partial<BaseClientOptions>): BaseClientOptions {
    return options instanceof BaseClientOptions ? options : new BaseClientOptions(options)
  }

  private initPromise: Promise<void>

  async ready() {
    return this.initPromise
  }

  public setHistoryManager(historyManager: HistoryManager) {
    this.historyManager = historyManager
  }

  public setLogger(logger: ILogger) {
    this.logger = logger
  }

  public getPostProcessors(): PostProcessor[] {
    return this.postProcessors || []
  }

  public getPreProcessors(): PreProcessor[] {
    return this.preProcessors || []
  }

  async init() {
    this.initPromise = (async (): Promise<void> => {
    })()
  }
  
  toString(): string {
    const json = {
      features: this.features,
      tools: this.tools,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      multipleKeyStrategy: this.multipleKeyStrategy,
      proxy: this.proxy,
      // historyManager: this.historyManager,
      // logger: this.logger,
      postProcessors: this.postProcessors?.map(p => p.id),
      preProcessors: this.preProcessors?.map(p => p.id),
    }
    return JSON.stringify(json)
  }
  
  fromString(str: string): BaseClientOptions {
    const json = JSON.parse(str)
    return new BaseClientOptions(json)
  }
}

export interface ILogger {
  debug(msg: object | string, ...args: never[]): void
  info(msg: object | string, ...args: never[]): void
  warn(msg: object | string, ...args: never[]): void
  error(msg: object | string, ...args: never[]): void
}

export const DefaultLogger = new class DefaultLogger implements ILogger {

  readonly name: string
  readonly enableColors: boolean

  static readonly COLORS = {
    reset: '\x1b[0m',
    debug: '\x1b[36m', // 青色
    info: '\x1b[32m',  // 绿色
    warn: '\x1b[33m',  // 黄色
    error: '\x1b[31m', // 红色
  }

  constructor(name: string = 'Chaite', enableColors: boolean = true) {
    this.name = name
    this.enableColors = enableColors
  }

  formatDate(): string {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0')

    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  formatMessage(level: string, msg: object | string, args: never[]): string {
    // 格式化前缀
    const prefix = `[${this.name}][${this.formatDate()}][${level}]`

    // 格式化消息内容
    const formattedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)

    // 添加颜色（如果启用）
    if (this.enableColors) {
      const color = DefaultLogger.COLORS[level.toLowerCase() as keyof typeof DefaultLogger.COLORS] || ''
      return `${color}${prefix}${DefaultLogger.COLORS.reset} ${formattedMsg}`
    }

    return `${prefix} ${formattedMsg}`
  }
  
  debug(msg: object | string, ...args: never[]): void {
    console.log(this.formatMessage('DEBUG', msg, args), ...args)
  }

  error(msg: object | string, ...args: never[]): void {
    console.log(this.formatMessage('ERROR', msg, args), ...args)
  }

  info(msg: object | string, ...args: never[]): void {
    console.log(this.formatMessage('INFO', msg, args), ...args)
  }

  warn(msg: object | string, ...args: never[]): void {
    console.log(this.formatMessage('WARN', msg, args), ...args)
  }
}()

export class ChaiteContext {
  constructor(logger: ILogger) {
    this.logger = logger
  }
  logger?: ILogger
  private event?: EventMessage
  setEvent(event: EventMessage) {
    this.event = event
  }
  getEvent(): EventMessage | undefined {
    return this.event
  }
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


export type CloudAPIType = 'tool' | 'processor' | 'chat-preset' | 'channel' | 'tool-group'

export type CustomConfigValueType = string | number | boolean | object | undefined | null | CustomConfigValueType[]
export type CustomConfig = Record<string, CustomConfigValueType | Record<string, CustomConfigValueType>>