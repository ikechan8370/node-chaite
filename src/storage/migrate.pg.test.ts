import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { PostgresDriver } from './driver/postgres'
import { SqliteDriver } from './driver/sqlite'
import { SqlHistoryManager } from './sql/history_manager'
import { SqlOperationLogStorage } from './sql/operation_log_storage'
import { SqlUserStateStorage } from './sql/user_state_storage'
import { migrateSqlStorage, getChaiteTables, MigratableTable } from './migrate'
import { LogicalDatabase, SqlDriver } from './driver/types'
import { HistoryMessage } from '../types/models'
import { OperationLog } from '../types/operation-log'
import { UserState } from '../types/storage'

/**
 * SQLite -> Postgres 的整体搬迁。
 *
 * 换方言不会自动带走数据，所以「完全迁到 Postgres」必须有这一步，否则等于从空库
 * 重新开始。这里在真 Postgres（PGlite）上跑完整流程：建表、搬数据、验数、再跑一遍
 * 确认幂等。
 *
 * 源端的数据用原始 SQL 灌进去，不经过 DTO：一来避开 chaite 现有的模块环（DTO 那
 * 条链在 jest 的 CJS 下加载不了），二来这样测的就是「行进、行出」，正是迁移工具
 * 该负责的范围。
 */

function poolFromPGlite(db: PGlite) {
  const query = async (sql: string, params?: unknown[]) => {
    const result = await db.query(sql, params as never[])
    return {
      rows: (result.rows || []) as Record<string, unknown>[],
      rowCount: result.affectedRows ?? (result.rows?.length ?? 0),
    }
  }
  return { query, connect: async () => ({ query, release: () => {} }), end: async () => db.close(), on: () => {} }
}

async function makePg(): Promise<PostgresDriver> {
  const db = new PGlite()
  await db.waitReady
  return new PostgresDriver({ dialect: 'postgres', database: 'pglite' }, poolFromPGlite(db) as never)
}

function tempDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

/** 用迁移工具自己的表定义把源表建出来，保证两边形状一致。 */
async function createTable(driver: SqlDriver, definition: MigratableTable) {
  await driver.exec(driver.dialect.createTable(definition.table, definition.columns))
}

describe('SQLite -> Postgres migration', () => {
  test('moves every chaite table and is safe to re-run', async () => {
    const dataDir = tempDir('mig-src-')
    const imagesDir = tempDir('mig-img-')
    const tables = getChaiteTables()
    const find = (name: string) => tables.find(t => t.table === name)!

    const sqliteMain = new SqliteDriver(path.join(dataDir, 'data.db'))
    const sqliteHistory = new SqliteDriver(path.join(dataDir, 'history.db'))
    const sqliteLogs = new SqliteDriver(path.join(dataDir, 'operation_logs.db'))
    await Promise.all([sqliteMain.ready(), sqliteHistory.ready(), sqliteLogs.ready()])

    // channels：直接写行，模拟一个已经在用的库
    await createTable(sqliteMain, find('channels'))
    for (let i = 0; i < 5; i++) {
      await sqliteMain.run(
        'INSERT INTO "channels" ("id","name","adapterType","type","weight","models","embedded") VALUES (?,?,?,?,?,?,?)',
        [`c${i}`, `渠道${i}`, 'openai', 'openai', i + 1, JSON.stringify([{ name: 'gpt-5', features: ['chat'] }]), 0]
      )
    }

    await createTable(sqliteMain, find('tools_groups'))
    await sqliteMain.run(
      'INSERT INTO "tools_groups" ("id","name","toolIds","isDefault") VALUES (?,?,?,?)',
      ['g1', '组', JSON.stringify(['t1', 't2']), 1]
    )

    const userStates = new SqlUserStateStorage(sqliteMain)
    await userStates.initialize()
    await userStates.setItem('10001', {
      userId: '10001', nickname: '昵称', conversations: [], settings: {}, current: {},
    } as unknown as UserState)

    const history = new SqlHistoryManager(sqliteHistory, imagesDir)
    await history.initialize()
    const messages: HistoryMessage[] = []
    for (let i = 0; i < 250; i++) {
      messages.push({
        id: `m${String(i).padStart(4, '0')}`,
        parentId: i ? `m${String(i - 1).padStart(4, '0')}` : null,
        role: 'user',
        content: [{ type: 'text', text: `消息 ${i}` }],
      } as unknown as HistoryMessage)
    }
    await history.saveHistories(messages, 'conv1')

    const logs = new SqlOperationLogStorage(sqliteLogs, 0)
    await logs.initialize()
    for (let i = 0; i < 20; i++) {
      await logs.setItem(`l${i}`, { id: `l${i}`, timestamp: i, type: 'llm.call', level: 'info', summary: `l${i}` } as OperationLog)
    }

    // 目标端：一个空的 Postgres，三个逻辑库共用
    const pg = await makePg()
    const target = (_db: LogicalDatabase) => pg
    const source = (db: LogicalDatabase) =>
      db === 'history' ? sqliteHistory : db === 'operation_logs' ? sqliteLogs : sqliteMain

    // 小 batchSize，逼出分页游标的逻辑
    const result = await migrateSqlStorage({ from: source, to: target, batchSize: 64 })

    const byTable = Object.fromEntries(result.tables.map(t => [t.table, t]))
    expect(byTable.channels.copied).toBe(5)
    expect(byTable.tools_groups.copied).toBe(1)
    expect(byTable.user_states.copied).toBe(1)
    expect(byTable.history.copied).toBe(250)
    expect(byTable.operation_logs.copied).toBe(20)
    // 从没写过的表在源端不存在，应当跳过而不是报错
    expect(byTable.chat_presets.skipped).toBe(true)
    expect(byTable.tools.skipped).toBe(true)

    // 目标端的数据要和源端一致
    const pgChannels = await pg.all<{ id: string, name: string, weight: number }>(
      'SELECT * FROM "channels" ORDER BY "id"', []
    )
    expect(pgChannels).toHaveLength(5)
    expect(pgChannels[3].name).toBe('渠道3')
    expect(Number(pgChannels[3].weight)).toBe(4)

    const pgGroup = await pg.get<{ toolIds: string, isDefault: number }>(
      'SELECT * FROM "tools_groups" WHERE "id" = ?', ['g1']
    )
    expect(JSON.parse(pgGroup!.toolIds)).toEqual(['t1', 't2'])

    const pgUser = new SqlUserStateStorage(pg)
    await pgUser.initialize()
    expect((await pgUser.getItem('10001'))?.nickname).toBe('昵称')

    // 整条 250 层的链要能在 Postgres 上一次查完
    const pgHistory = new SqlHistoryManager(pg, imagesDir)
    await pgHistory.initialize()
    const chain = await pgHistory.getHistory('m0249')
    expect(chain).toHaveLength(250)
    expect(chain[0].id).toBe('m0000')
    expect(chain[249].id).toBe('m0249')

    const pgLogs = new SqlOperationLogStorage(pg, 0)
    await pgLogs.initialize()
    expect(await pgLogs.listItems()).toHaveLength(20)

    // 再跑一遍：走 upsert，不该产生重复行
    const second = await migrateSqlStorage({ from: source, to: target, batchSize: 64 })
    expect(second.total).toBe(result.total)
    expect(await pg.all('SELECT * FROM "channels"', [])).toHaveLength(5)
    expect(await pgHistory.getHistory(undefined, 'conv1')).toHaveLength(250)

    await Promise.all([sqliteMain.close(), sqliteHistory.close(), sqliteLogs.close(), pg.close()])
  }, 120000)

  test('the default table list covers every table the storages create', () => {
    expect(getChaiteTables().map(t => t.table).sort()).toEqual([
      'channels', 'chat_presets', 'history', 'mcp_servers', 'operation_logs',
      'processors', 'tools', 'tools_groups', 'triggers', 'user_states',
    ])
  })
})
