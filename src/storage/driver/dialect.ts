import { ColumnSpec, ColumnTypeName, Dialect, DialectName, IndexColumn, IndexOptions } from './types'

/**
 * 方言差异。
 *
 * 这些 storage 的表在关系意义上都不是关系数据：一个 TEXT 主键、几个为了能下推
 * 过滤而提升出来的列、剩下的塞进 JSON 列，没有任何 JOIN。所以真正随数据库变化
 * 的只有三件事：占位符写法、upsert 语法、建表时的类型名。收敛掉这三样，其余
 * SQL 就能共用一份。
 */

const TYPES: Record<DialectName, Record<ColumnTypeName, string>> = {
  sqlite: {
    text: 'TEXT',
    int: 'INTEGER',
    bigint: 'INTEGER',
    // SQLite 没有布尔类型，历史数据里存的就是 0/1。Postgres 这边也继续用整数，
    // 免得同一份 toRecord/fromRecord 要为两种表示分叉。
    bool: 'INTEGER',
    json: 'TEXT',
    blob: 'BLOB',
  },
  postgres: {
    text: 'TEXT',
    int: 'INTEGER',
    bigint: 'BIGINT',
    bool: 'INTEGER',
    json: 'TEXT',
    blob: 'BYTEA',
  },
}

class SqlDialect implements Dialect {
  readonly name: DialectName
  private readonly types: Record<ColumnTypeName, string>

  constructor(name: DialectName) {
    const types = TYPES[name]
    if (!types) {
      throw new Error(`unknown dialect: ${name}`)
    }
    this.name = name
    this.types = types
  }

  get isSqlite(): boolean {
    return this.name === 'sqlite'
  }

  get isPostgres(): boolean {
    return this.name === 'postgres'
  }

  columnType(logicalType: ColumnTypeName): string {
    const type = this.types[logicalType]
    if (!type) {
      throw new Error(`unknown column type: ${logicalType}`)
    }
    return type
  }

  /** 两种方言都用双引号；保留这层是为了以后加 MySQL（反引号）。 */
  quoteId(name: string): string {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`unsafe identifier: ${name}`)
    }
    return `"${name}"`
  }

  autoIncrementPk(): string {
    return this.isPostgres ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'
  }

  /**
   * 两种方言的 ON CONFLICT 写法一致，差别只在 SQLite 还额外允许
   * INSERT OR REPLACE。统一成 ON CONFLICT，共用一份。
   *
   * @param immutable 冲突时不覆盖的列，例如代理主键
   */
  upsert(table: string, columns: string[], conflictColumn = 'id', immutable: string[] = []): string {
    const cols = columns.map(c => this.quoteId(c)).join(', ')
    const placeholders = columns.map(() => '?').join(', ')
    const updates = columns
      .filter(c => c !== conflictColumn && !immutable.includes(c))
      .map(c => `${this.quoteId(c)} = EXCLUDED.${this.quoteId(c)}`)
      .join(', ')
    const quotedTable = this.quoteId(table)
    const conflict = this.quoteId(conflictColumn)
    // 只有主键一列时没有可更新的字段，退化成 DO NOTHING
    if (!updates) {
      return `INSERT INTO ${quotedTable} (${cols}) VALUES (${placeholders}) ON CONFLICT(${conflict}) DO NOTHING`
    }
    return `INSERT INTO ${quotedTable} (${cols}) VALUES (${placeholders}) ON CONFLICT(${conflict}) DO UPDATE SET ${updates}`
  }

  createTable(table: string, columns: Record<string, ColumnSpec | ColumnTypeName>): string {
    const defs = Object.entries(columns).map(([name, spec]) => {
      const opts: ColumnSpec = typeof spec === 'string' ? { type: spec } : spec
      let def = `${this.quoteId(name)} ${
        opts.autoIncrement ? this.autoIncrementPk() : this.columnType(opts.type ?? 'text')
      }`
      if (opts.pk && !opts.autoIncrement) def += ' PRIMARY KEY'
      if (opts.notNull) def += ' NOT NULL'
      if (opts.default !== undefined) def += ` DEFAULT ${formatDefault(opts.default)}`
      return def
    })
    return `CREATE TABLE IF NOT EXISTS ${this.quoteId(table)} (${defs.join(', ')})`
  }

  createIndex(table: string, columns: IndexColumn[], options: IndexOptions = {}): string {
    const { name, unique = false, order } = options
    const names = columns.map(c => (typeof c === 'string' ? c : c.column))
    const indexName = name || `idx_${table}_${names.join('_')}`
    const cols = columns
      .map(c => {
        const column = typeof c === 'string' ? c : c.column
        const columnOrder = typeof c === 'string' ? order : c.order ?? order
        return `${this.quoteId(column)}${columnOrder ? ` ${columnOrder}` : ''}`
      })
      .join(', ')
    return `CREATE${unique ? ' UNIQUE' : ''} INDEX IF NOT EXISTS ${this.quoteId(indexName)} ON ${this.quoteId(
      table,
    )} (${cols})`
  }
}

function formatDefault(value: string | number | null): string {
  if (typeof value === 'number') return String(value)
  if (value === null) return 'NULL'
  return `'${String(value).replace(/'/g, '\'\'')}'`
}

export function createDialect(name: DialectName): Dialect {
  return new SqlDialect(name)
}
