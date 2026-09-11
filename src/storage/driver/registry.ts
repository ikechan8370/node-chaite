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

  async init(options: ConnectionOptions): Promise<void> {
    if (this.initialized) return

    if (options.dialect === 'sqlite') {
      for (const name of Object.keys(SQLITE_FILES) as LogicalDatabase[]) {
        const driver = new SqliteDriver(path.join(options.dataDir, SQLITE_FILES[name]), {
          busyTimeout: options.busyTimeout,
          slowQueryMs: options.slowQueryMs,
        })
        await driver.ready()
        this.drivers.set(name, driver)
      }
    } else if (options.dialect === 'postgres') {
      const shared = await createPostgresDriver(options)
      for (const name of Object.keys(SQLITE_FILES) as LogicalDatabase[]) {
        this.drivers.set(name, shared)
      }
    } else {
      const dialect = (options as { dialect?: string }).dialect
      throw new Error(`不支持的数据库方言：${dialect}，可选值：sqlite、postgres`)
    }

    this.initialized = true
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

  async close(): Promise<void> {
    for (const driver of this.listUnique()) {
      await driver.close()
    }
    this.drivers.clear()
    this.initialized = false
  }

  /** 仅供测试：注入一个现成的 driver。 */
  register(name: LogicalDatabase, driver: SqlDriver): void {
    this.drivers.set(name, driver)
    this.initialized = true
  }
}

/** 进程级默认注册表。宿主插件一般用这个就够了。 */
export const drivers = new DriverRegistry()
