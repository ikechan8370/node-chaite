import { ChaiteStorage } from '../types/storage'
import { ColumnSpec, ColumnTypeName, IndexColumn, IndexOptions, SqlDriver } from './driver/types'

/**
 * 和宿主插件里原有的 generateId 保持同样的形状，避免迁移后新旧 id 风格不一致。
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
}

export interface TableSpec<T> {
  /** 表名 */
  table: string
  /** 列定义 */
  columns: Record<string, ColumnSpec | ColumnTypeName>
  /** 主键列，默认 'id'。user_states 用 userId 做业务主键 */
  keyColumn?: string
  /** 冲突时不覆盖的列，例如代理主键 */
  immutableColumns?: string[]
  indexes?: (IndexOptions & { columns: IndexColumn[] })[]
  /** 可以下推到 SQL 的列；其余条件在内存里过滤 */
  filterable?: string[]
  /** 过滤时需要 Number() 归一的列 */
  numeric?: string[]
  /** 过滤时需要归一成 0/1 的列 */
  boolean?: string[]
  /** listItems 的排序，如 'updatedAt DESC' */
  orderBy?: string
  toRecord(entity: T, id: string): Record<string, unknown>
  fromRecord(record: Record<string, unknown>): T | null
}

/**
 * 「键值表 + 提升列」的公共实现。
 *
 * 宿主插件里的九个 storage 在关系意义上都不是关系数据：一个 TEXT 主键、几个为了
 * 能下推过滤而提升出来的列、剩下的塞进 JSON 列，一个 JOIN 都没有。所以这里不引
 * ORM——ORM 的价值在关系映射和查询组合，这套代码一样都用不上。
 *
 * 子类只需要给出一份 TableSpec，七个 ChaiteStorage 方法由这里统一实现，SQL 一份，
 * 方言差异由 driver 兜住。
 */
export class SqlKvStorage<T> extends ChaiteStorage<T> {
  readonly driver: SqlDriver
  readonly spec: TableSpec<T>
  readonly table: string
  readonly keyColumn: string

  protected initialized = false
  private initPromise: Promise<void> | null = null

  constructor(driver: SqlDriver, spec: TableSpec<T>) {
    super()
    this.driver = driver
    this.spec = spec
    this.table = spec.table
    this.keyColumn = spec.keyColumn || 'id'
  }

  get dialect() {
    return this.driver.dialect
  }

  /**
   * 建表与索引。重复调用是安全的。
   *
   * **子类不要覆盖这个方法**，要加初始化步骤请覆盖 afterInitialize()。
   * 覆盖 initialize() 并在里面 `await super.initialize()` 会有竞态：基类返回时
   * initialized 已经是 true，此时另一个并发的 ensureInitialized() 会立刻放行，
   * 而子类那部分（建唯一索引之类）还没跑完。
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      await this.driver.exec(this.dialect.createTable(this.table, this.spec.columns))
      for (const index of this.spec.indexes || []) {
        await this.driver.exec(this.dialect.createIndex(this.table, index.columns, index))
      }
      // 子类的补充步骤必须在置位之前完成，否则并发调用会看到一个只做了一半的表
      await this.afterInitialize()
      this.initialized = true
    })().catch((error: unknown) => {
      // 不要把失败的 promise 留在字段里，否则一次偶发失败会让这张表到重启为止
      // 都初始化不了。initialized 也仍然是 false，下次会重试整条链路。
      this.initPromise = null
      throw error
    })

    return this.initPromise
  }

  /**
   * 建表之后、标记就绪之前的钩子。子类在这里做额外的模式调整。
   * 抛错会让整次 initialize 失败并允许重试。
   */
  protected async afterInitialize(): Promise<void> {}

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize()
  }

  protected q(name: string): string {
    return this.dialect.quoteId(name)
  }

  protected orderClause(): string {
    if (!this.spec.orderBy) return ''
    const [column, direction = 'ASC'] = this.spec.orderBy.split(/\s+/)
    const dir = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    return ` ORDER BY ${this.q(column)} ${dir}`
  }

  async getItem(key: string): Promise<T | null> {
    await this.ensureInitialized()
    const row = await this.driver.get(`SELECT * FROM ${this.q(this.table)} WHERE ${this.q(this.keyColumn)} = ?`, [key])
    return row ? this.spec.fromRecord(row) : null
  }

  async setItem(id: string, value: T): Promise<string> {
    await this.ensureInitialized()
    const key = id || generateId()
    const record = this.spec.toRecord(value, key)
    record[this.keyColumn] = key

    const columns = Object.keys(record)
    const sql = this.dialect.upsert(this.table, columns, this.keyColumn, this.spec.immutableColumns || [])
    await this.driver.run(sql, columns.map(c => record[c]))
    return key
  }

  async removeItem(key: string): Promise<void> {
    await this.ensureInitialized()
    await this.driver.run(`DELETE FROM ${this.q(this.table)} WHERE ${this.q(this.keyColumn)} = ?`, [key])
  }

  async listItems(): Promise<T[]> {
    await this.ensureInitialized()
    const rows = await this.driver.all(`SELECT * FROM ${this.q(this.table)}${this.orderClause()}`, [])
    return rows.map(row => this.spec.fromRecord(row)).filter((item): item is T => Boolean(item))
  }

  /** 能下推的条件走 SQL，其余在内存里过滤。 */
  async listItemsByEqFilter(filter: Record<string, unknown>): Promise<T[]> {
    await this.ensureInitialized()
    if (!filter || Object.keys(filter).length === 0) return this.listItems()

    const clauses: string[] = []
    const params: unknown[] = []
    const residual: Record<string, unknown> = {}

    for (const [field, value] of Object.entries(filter)) {
      if (this.isFilterable(field)) {
        clauses.push(`${this.q(field)} = ?`)
        params.push(this.normalize(field, value))
      } else {
        residual[field] = value
      }
    }

    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
    const rows = await this.driver.all(`SELECT * FROM ${this.q(this.table)}${where}${this.orderClause()}`, params)
    const items = rows.map(row => this.spec.fromRecord(row)).filter((item): item is T => Boolean(item))

    const entries = Object.entries(residual)
    if (entries.length === 0) return items
    return items.filter(item =>
      entries.every(([key, value]) => (item as Record<string, unknown>)[key] === value),
    )
  }

  async listItemsByInQuery(query: { field: string, values: unknown[] }[]): Promise<T[]> {
    await this.ensureInitialized()
    if (!Array.isArray(query) || query.length === 0) return this.listItems()
    // 任何一组候选值为空，交集必然为空
    if (query.some(({ values }) => Array.isArray(values) && values.length === 0)) return []

    const clauses: string[] = []
    const params: unknown[] = []
    const residual: { field: string, values: unknown[] }[] = []

    for (const { field, values } of query) {
      if (!Array.isArray(values)) continue
      if (this.isFilterable(field)) {
        clauses.push(`${this.q(field)} IN (${values.map(() => '?').join(', ')})`)
        params.push(...values.map(value => this.normalize(field, value)))
      } else {
        residual.push({ field, values })
      }
    }

    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
    const rows = await this.driver.all(`SELECT * FROM ${this.q(this.table)}${where}${this.orderClause()}`, params)
    let items = rows.map(row => this.spec.fromRecord(row)).filter((item): item is T => Boolean(item))
    for (const { field, values } of residual) {
      items = items.filter(item => values.includes((item as Record<string, unknown>)[field]))
    }
    return items
  }

  async clear(): Promise<void> {
    await this.ensureInitialized()
    await this.driver.run(`DELETE FROM ${this.q(this.table)}`, [])
  }

  /**
   * 故意什么都不做。
   *
   * 一个 driver 是被多个 storage 共用的（Postgres 下更是共用同一个连接池），
   * 任何一个 storage 关掉它，其余的就全断了。连接的生命周期归 DriverRegistry
   * 管，进程退出时统一关闭。
   */
  async close(): Promise<void> {}

  protected isFilterable(field: string): boolean {
    return (this.spec.filterable || []).includes(field)
  }

  /** 过滤值归一：数值列用 Number，布尔列用 0/1，与建表时的存储表示对齐。 */
  protected normalize(field: string, value: unknown): unknown {
    if ((this.spec.numeric || []).includes(field)) return Number(value)
    if ((this.spec.boolean || []).includes(field)) return value ? 1 : 0
    return value
  }
}

/** JSON 列的读写。存坏了就当空值，不要让一条脏数据把整个列表查询打挂。 */
export function parseJson<T = unknown>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return value as T
  try {
    return JSON.parse(String(value)) as T
  } catch {
    return fallback
  }
}

export function stringifyJson(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return JSON.stringify(value)
}
