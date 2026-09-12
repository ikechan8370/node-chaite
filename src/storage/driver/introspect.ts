import { SqlDriver } from './types'

/**
 * 模式自省。两种方言问法不同，但调用方不该关心。
 *
 * 抽出来是因为有两处都要用：storage 初始化时补列，迁移工具决定搬哪些列。
 */

/** 这张表在不在。 */
export async function tableExists(driver: SqlDriver, table: string): Promise<boolean> {
  if (driver.dialect.isPostgres) {
    const row = await driver.get<{ count: number }>(
      'SELECT COUNT(*) AS "count" FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?',
      [table],
    )
    return Number(row?.count || 0) > 0
  }
  const row = await driver.get<{ name: string }>(
    'SELECT name FROM sqlite_master WHERE type = \'table\' AND name = ?',
    [table],
  )
  return Boolean(row)
}

/** 表上现有的列名。表不存在时返回空集合。 */
export async function listColumns(driver: SqlDriver, table: string): Promise<Set<string>> {
  if (driver.dialect.isPostgres) {
    const rows = await driver.all<{ column_name: string }>(
      'SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?',
      [table],
    )
    return new Set(rows.map(r => r.column_name))
  }
  // PRAGMA 不接受参数占位符，所以这里只能内插；quoteId 会挡掉不合法的标识符
  const rows = await driver.all<{ name: string }>(`PRAGMA table_info(${driver.dialect.quoteId(table)})`, [])
  return new Set(rows.map(r => r.name))
}
