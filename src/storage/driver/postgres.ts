import { createDialect } from './dialect'
import { toDollarPlaceholders } from './placeholders'
import { Dialect, PostgresConnectionOptions, RunResult, SqlDriver, TransactionScope } from './types'
import { log } from '../logger'

/** pg 的最小接口。pg 是可选 peer 依赖，动态 import。 */
interface PgQueryResult {
  rows: Record<string, unknown>[]
  rowCount: number | null
}

interface PgClient {
  query(sql: string, params?: unknown[]): Promise<PgQueryResult>
  release(): void
}

interface PgPool {
  query(sql: string, params?: unknown[]): Promise<PgQueryResult>
  connect(): Promise<PgClient>
  end(): Promise<void>
  on(event: 'error', listener: (error: Error) => void): void
}

/**
 * Postgres driver。
 *
 * 和 SQLite 那边最大的不同：这里不需要写者队列。SQLite 全库只有一个写锁，所以
 * 必须自己把写入串起来；Postgres 有 MVCC 和真正的连接池，串行化反而会白白限制
 * 吞吐，并发控制整个交给 pg.Pool。
 *
 * SQL 仍按 `?` 书写，在执行入口统一翻译成 $1..$n，storage 层不用关心方言。
 */
export class PostgresDriver implements SqlDriver {
  readonly dialect: Dialect = createDialect('postgres')

  private readonly options: PostgresConnectionOptions
  private readonly pool: PgPool
  private readonly slowQueryMs: number
  private closed = false

  constructor(options: PostgresConnectionOptions, pool: PgPool) {
    this.options = options
    this.pool = pool
    this.slowQueryMs = options.slowQueryMs ?? 500
  }

  get name(): string {
    return `postgres:${this.options.database}`
  }

  async ready(): Promise<void> {
    const client = await this.pool.connect()
    client.release()
  }

  private async query(sql: string, params: unknown[]): Promise<PgQueryResult> {
    const startedAt = Date.now()
    try {
      return await this.pool.query(toDollarPlaceholders(sql), params)
    } finally {
      const duration = Date.now() - startedAt
      if (duration >= this.slowQueryMs) {
        log().warn(`[pg] slow query ${duration}ms: ${sql.trim().slice(0, 120)}`)
      }
    }
  }

  async get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const result = await this.query(sql, params)
    return result.rows[0] as T | undefined
  }

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.query(sql, params)
    return result.rows as T[]
  }

  /**
   * lastID 只在显式写了 RETURNING id 时才有值。SQLite 的 this.lastID 在
   * Postgres 没有对应物，调用方不该依赖它。
   */
  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const result = await this.query(sql, params)
    return {
      changes: result.rowCount ?? 0,
      lastID: result.rows?.[0]?.id as number | string | undefined,
    }
  }

  /** exec 用来跑建表之类的多语句脚本，本身不带参数，所以不翻译占位符。 */
  async exec(sql: string): Promise<void> {
    await this.pool.query(sql)
  }

  async transaction<T>(work: (scope: TransactionScope) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    const run = async (sql: string, params: unknown[] = []): Promise<RunResult> => {
      const result = await client.query(toDollarPlaceholders(sql), params)
      return { changes: result.rowCount ?? 0, lastID: result.rows?.[0]?.id as number | string | undefined }
    }
    const get = async <R>(sql: string, params: unknown[] = []): Promise<R | undefined> =>
      (await client.query(toDollarPlaceholders(sql), params)).rows[0] as R | undefined
    const all = async <R>(sql: string, params: unknown[] = []): Promise<R[]> =>
      (await client.query(toDollarPlaceholders(sql), params)).rows as R[]

    try {
      await client.query('BEGIN')
      const result = await work({ get, all, run } as TransactionScope)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        log().warn(
          `[pg] rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        )
      }
      throw error
    } finally {
      client.release()
    }
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    await this.pool.end()
  }
}

/** pg 是可选依赖，只有真的选了 postgres 才需要装。 */
export async function createPostgresDriver(options: PostgresConnectionOptions): Promise<PostgresDriver> {
  let pg
  try {
    pg = (await import('pg')).default
  } catch (error) {
    throw new Error(
      '使用 postgres 存储需要先安装 pg：pnpm add pg\n' +
      `原始错误：${error instanceof Error ? error.message : String(error)}`,
    )
  }
  const pool = new pg.Pool({
    host: options.host || '127.0.0.1',
    port: options.port || 5432,
    database: options.database,
    user: options.username,
    password: options.password,
    max: options.pool?.max ?? 10,
    idleTimeoutMillis: options.pool?.idle ?? 10000,
    connectionTimeoutMillis: options.pool?.acquire ?? 30000,
    ssl: options.ssl ?? false,
  }) as unknown as PgPool
  pool.on('error', error => log().error(`[pg] idle client error: ${error.message}`))
  const driver = new PostgresDriver(options, pool)
  await driver.ready()
  return driver
}
