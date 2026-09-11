import type { ILogger } from '../types/common'

/**
 * 存储层的日志入口。
 *
 * 这里刻意只用 `import type` 引 ILogger——类型在编译后会被抹掉，于是存储层不会
 * 在模块顶层静态依赖 types 桶文件。那个桶文件会顺带拉进 trigger（依赖只发 ESM
 * 的 node-schedule）和 rag/PdfParser（用了 import.meta），一个只想读写 SQLite
 * 的模块没有理由把这些都拖上。
 *
 * 真正的 getLogger 由包入口在加载时注入（见 src/index.ts）。没注入时退回 console，
 * 这样直接 import 深层路径的单元测试也能跑。
 */
type LoggerResolver = () => ILogger

let resolver: LoggerResolver | undefined

export function setStorageLoggerResolver(fn: LoggerResolver): void {
  resolver = fn
}

const consoleLogger: ILogger = {
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  trace: (...args: unknown[]) => console.debug(...args),
  mark: (...args: unknown[]) => console.info(...args),
} as unknown as ILogger

export function log(): ILogger {
  return resolver?.() ?? consoleLogger
}
