import path from 'node:path'
import { SqliteDriver } from './sqlite'
import { createPostgresDriver } from './postgres'
import { ConnectionOptions, LogicalDatabase, SqlDriver } from './types'

/**
 * driver 注册表。
 *
 * 逻辑上有三个库：main（渠道、预设、工具等）、history（对话历史）、
 * operation_logs（操作日志）。SQLite 下它们是三个文件——历史库会长到几百 MB，
 * 拆开是为了让 VACUUM 只重写真正需要的那个；Postgres 下共用一个连接池，靠表名
 * 区分就够了，再开三个池只是浪费连接数。
 *
 * 调用方只认这三个逻辑名，不关心背后是文件还是连接池。
 */

const SQLITE_FILES: Record<LogicalDatabase, string> = {
  main: 'data.db',
  history: 'history.db',
  operation_logs: 'operation_logs.db',
}

export class DriverRegistry {
  private readonly drivers = new Map<LogicalDatabase, SqlDriver>()
  private initialized = false
  private initPromise: Promise<void> | null = null
  private closePromise: Promise<void> | null = null

  /**
   * 初始化。并发调用会共用同一个 Promise——否则两个调用方都能通过
   * `initialized === false`，各开一套连接，后完成的那个把前一套从 Map 里顶掉，
   * 顶掉的连接就此泄漏。
   *
   * 中途失败会把这一轮已经建好的 driver 全部关掉再抛出，不留下半初始化状态；
   * initialized 仍为 false，调用方可以修好配置后重试。
   */
  async init(options: ConnectionOptions): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.doInit(options)
      .then(() => {
        this.initialized = true
      })
      .finally(() => {
        this.initPromise = null
      })

    return this.initPromise
  }

  private async doInit(options: ConnectionOptions): Promise<void> {
    // 先建到临时表里，全部成功才提交到 this.drivers
    const opened: SqlDriver[] = []
    const staged = new Map<LogicalDatabase, SqlDriver>()

    try {
      if (options.dialect === 'sqlite') {
        for (const name of Object.keys(SQLITE_FILES) as LogicalDatabase[]) {
          const driver = new SqliteDriver(path.join(options.dataDir, SQLITE_FILES[name]), {
            busyTimeout: options.busyTimeout,
            slowQueryMs: options.slowQueryMs,
          })
          opened.push(driver)
          await driver.ready()
          staged.set(name, driver)
        }
      } else if (options.dialect === 'postgres') {
        const shared = await createPostgresDriver(options)
        opened.push(shared)
        for (const name of Object.keys(SQLITE_FILES) as LogicalDatabase[]) {
          staged.set(name, shared)
        }
      } else {
        const dialect = (options as { dialect?: string }).dialect
        throw new Error(`不支持的数据库方言：${dialect}，可选值：sqlite、postgres`)
      }
    } catch (error) {
      // 已经打开的别留着——尤其 SQLite 是逐个文件打开的，第二个失败时第一个
      // 还握着文件句柄
      for (const driver of new Set(opened)) {
        await driver.close().catch(() => {})
      }
      throw error
    }

    for (const [name, driver] of staged) {
      this.drivers.set(name, driver)
    }
  }

  get(name: LogicalDatabase): SqlDriver {
    const driver = this.drivers.get(name)
    if (!driver) {
      throw new Error(`driver '${name}' 尚未初始化，请先调用 init()`)
    }
    return driver
  }

  isInitialized(): boolean {
    return this.initialized
  }

  /** 列出去重后的 driver。Postgres 下三个逻辑库共用一个实例。 */
  listUnique(): SqlDriver[] {
    return [...new Set(this.drivers.values())]
  }

  /** 关闭全部连接。重复调用共用同一个 Promise。 */
  async close(): Promise<void> {
    if (this.closePromise) return this.closePromise

    this.closePromise = (async () => {
      for (const driver of this.listUnique()) {
        await driver.close()
      }
      this.drivers.clear()
      this.initialized = false
    })().finally(() => {
      this.closePromise = null
    })

    return this.closePromise
  }

  /** 仅供测试：注入一个现成的 driver。 */
  register(name: LogicalDatabase, driver: SqlDriver): void {
    this.drivers.set(name, driver)
    this.initialized = true
  }
}

/** 进程级默认注册表。宿主插件一般用这个就够了。 */
export const drivers = new DriverRegistry()
