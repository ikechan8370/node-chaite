import { SqlDriver } from './driver/types'
import { log } from './logger'
import { CHAITE_TABLES, TableShape } from './sql/tables'
import { listColumns, tableExists } from './driver/introspect'
import { ColumnSpec, ColumnTypeName, LogicalDatabase } from './driver/types'

/**
 * 跨引擎搬数据。
 *
 * 换方言不会自动带走数据——sqlite 和 postgres 是两个各自独立的库。这个工具把
 * 一边的表整体复制到另一边，用于「从 SQLite 迁到 Postgres」这种一次性动作。
 *
 * 复制走 upsert，所以中断之后重跑是安全的，不会产生重复行。
 *
 * **迁移期间必须停止写入。** 这里是逐表、按游标分页复制的，没有全局快照：
 * 如果源库还在接受写入，一条已经被游标越过的记录再被更新，这次更新不会进入
 * 目标库。宿主应当先停机再迁移；需要在线迁移的话得另外做增量追赶或双写，
 * 这个工具不负责。
 */

/** 要搬的表：逻辑库、表名、列定义、主键列。 */
export interface MigratableTable {
  database: LogicalDatabase
  table: string
  columns: Record<string, ColumnSpec | ColumnTypeName>
  keyColumn: string
  /** keyColumn 不是主键时，upsert 依赖的唯一索引 */
  uniqueIndex?: TableShape['uniqueIndex']
  /** 分页读取的排序列，必须唯一。默认用 keyColumn。 */
  cursorColumn?: string
}

/**
 * 默认要搬的表。定义在 sql/tables.ts 里，storage 和这里共用同一份。
 */
export function getChaiteTables(): MigratableTable[] {
  return CHAITE_TABLES.map((shape: TableShape) => ({
    database: shape.database,
    table: shape.table,
    columns: shape.columns,
    keyColumn: shape.keyColumn,
    uniqueIndex: shape.uniqueIndex,
  }))
}

export interface MigrateOptions {
  /** 源端，按逻辑库取 driver */
  from: (database: LogicalDatabase) => SqlDriver
  /** 目标端 */
  to: (database: LogicalDatabase) => SqlDriver
  /** 默认搬 getChaiteTables() */
  tables?: MigratableTable[]
  /** 每批行数。历史表可能有几十万行，别一次读进内存。 */
  batchSize?: number
  /** 每张表搬完回调一次，便于打进度 */
  onProgress?: (progress: TableProgress) => void
}

export interface TableProgress {
  table: string
  copied: number
  skipped: boolean
  reason?: string
}

export interface MigrateResult {
  tables: TableProgress[]
  total: number
}

/**
 * 把一批表从源端复制到目标端。
 *
 * 目标表不存在会先按列定义建出来，所以可以直接对着一个空库跑。
 */
export async function migrateSqlStorage(options: MigrateOptions): Promise<MigrateResult> {
  const tables = options.tables || getChaiteTables()
  const batchSize = options.batchSize ?? 1000
  const results: TableProgress[] = []

  for (const definition of tables) {
    const source = options.from(definition.database)
    const target = options.to(definition.database)
    const progress = await migrateTable(source, target, definition, batchSize)
    results.push(progress)
    options.onProgress?.(progress)
  }

  return { tables: results, total: results.reduce((sum, r) => sum + r.copied, 0) }
}

async function migrateTable(
  source: SqlDriver,
  target: SqlDriver,
  definition: MigratableTable,
  batchSize: number,
): Promise<TableProgress> {
  const { table, columns, keyColumn } = definition

  if (!(await tableExists(source, table))) {
    return { table, copied: 0, skipped: true, reason: '源端没有这张表' }
  }

  // 目标端建表（已存在就是空操作）
  await target.exec(target.dialect.createTable(table, columns))
  // 以及 upsert 依赖的唯一索引，否则 ON CONFLICT 无从匹配
  if (definition.uniqueIndex) {
    await target.exec(target.dialect.createIndex(table, definition.uniqueIndex.columns, definition.uniqueIndex))
  }

  const columnNames = Object.keys(columns)
  const sourceQ = (name: string) => source.dialect.quoteId(name)
  const cursorColumn = definition.cursorColumn || keyColumn

  // 源库可能是更早的版本，少几列；只搬两边都有的列
  const available = await listColumns(source, table)
  const copyColumns = columnNames.filter(name => available.has(name))
  if (copyColumns.length === 0) {
    return { table, copied: 0, skipped: true, reason: '源端与目标端没有共同列' }
  }

  const selectList = copyColumns.map(sourceQ).join(', ')
  const upsert = target.dialect.upsert(table, copyColumns, keyColumn)

  let copied = 0
  let cursor: unknown = null

  for (;;) {
    // 按游标分页，避免 OFFSET 在大表上越翻越慢
    const where = cursor === null ? '' : ` WHERE ${sourceQ(cursorColumn)} > ?`
    const params = cursor === null ? [] : [cursor]
    const rows = await source.all<Record<string, unknown>>(
      `SELECT ${selectList} FROM ${sourceQ(table)}${where} ORDER BY ${sourceQ(cursorColumn)} ASC LIMIT ?`,
      [...params, batchSize],
    )
    if (rows.length === 0) break

    await target.transaction(async transaction => {
      for (const row of rows) {
        await transaction.run(upsert, copyColumns.map(name => row[name] ?? null))
      }
    }, { priority: 'low', label: `migrate ${table}` })

    copied += rows.length
    cursor = rows[rows.length - 1][cursorColumn]
    if (rows.length < batchSize) break
  }

  log().info(`[Migrate] ${table}: 复制了 ${copied} 行`)
  return { table, copied, skipped: false }
}
