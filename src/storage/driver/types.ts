/**
 * SQL driver 契约。
 *
 * chaite 定义了 ChaiteStorage 接口却没给任何具体的 SQL 实现，结果是每个宿主
 * 插件各写一套：chatgpt-plugin 和 karin-plugin-chatgpt 里各有一份逐行雷同的
 * 九个 storage，而且已经开始分叉——只有前者有 WAL、写入队列和 VACUUM。
 *
 * 这个模块把那一份实现收到 chaite 里，宿主只需要选方言。
 */

export type DialectName = 'sqlite' | 'postgres'

/** run 的结果。lastID 只有 SQLite 和显式 RETURNING 的场景才有值。 */
export interface RunResult {
  changes: number
  lastID?: number | string
}

/** 事务内可用的操作，和顶层同形。 */
export interface TransactionScope {
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  run(sql: string, params?: unknown[]): Promise<RunResult>
}

/** 写入排队时的提示，只有 SQLite driver 会用到。 */
export interface WriteOptions {
  priority?: 'high' | 'normal' | 'low'
  label?: string
}

export interface Dialect {
  readonly name: DialectName
  readonly isSqlite: boolean
  readonly isPostgres: boolean
  columnType(logicalType: ColumnTypeName): string
  quoteId(name: string): string
  autoIncrementPk(): string
  upsert(table: string, columns: string[], conflictColumn?: string, immutable?: string[]): string
  createTable(table: string, columns: Record<string, ColumnSpec | ColumnTypeName>): string
  createIndex(table: string, columns: IndexColumn[], options?: IndexOptions): string
}

/** 索引列。需要给单列指定顺序时用对象形式，例如 (userId, timestamp DESC)。 */
export type IndexColumn = string | { column: string, order?: 'ASC' | 'DESC' }

export type ColumnTypeName = 'text' | 'int' | 'bigint' | 'bool' | 'json' | 'blob'

export interface ColumnSpec {
  type?: ColumnTypeName
  pk?: boolean
  notNull?: boolean
  autoIncrement?: boolean
  default?: string | number | null
}

export interface IndexOptions {
  name?: string
  unique?: boolean
  /** 整个索引的默认顺序；单列可以用 IndexColumn 覆盖。 */
  order?: 'ASC' | 'DESC'
}

/**
 * 宿主拿到的就是这个。底下是一个 SQLite 文件还是一个 Postgres 连接池，
 * 调用方不需要知道。
 */
export interface SqlDriver {
  readonly dialect: Dialect
  readonly name: string
  ready(): Promise<void>
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  run(sql: string, params?: unknown[], options?: WriteOptions): Promise<RunResult>
  exec(sql: string, options?: WriteOptions): Promise<void>
  transaction<T>(work: (scope: TransactionScope) => Promise<T>, options?: WriteOptions): Promise<T>
  close(): Promise<void>
}

/** 逻辑库名。SQLite 下对应三个文件，Postgres 下共用一个连接池。 */
export type LogicalDatabase = 'main' | 'history' | 'operation_logs'

export interface SqliteConnectionOptions {
  dialect: 'sqlite'
  /** SQLite 文件所在目录 */
  dataDir: string
  busyTimeout?: number
  slowQueryMs?: number
}

export interface PostgresConnectionOptions {
  dialect: 'postgres'
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  ssl?: boolean | Record<string, unknown>
  slowQueryMs?: number
  pool?: {
    max?: number
    idle?: number
    acquire?: number
  }
}

export type ConnectionOptions = SqliteConnectionOptions | PostgresConnectionOptions
