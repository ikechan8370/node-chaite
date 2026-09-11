import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { PostgresDriver } from './driver/postgres'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from './sql_storage'
import { SqlUserStateStorage } from './sql/user_state_storage'
import { SqlOperationLogStorage } from './sql/operation_log_storage'
import { SqlHistoryManager } from './sql/history_manager'
import { HistoryMessage } from '../types/models'
import { OperationLog } from '../types/operation-log'
import { UserState } from '../types/storage'

/**
 * 真·Postgres 上的验证。
 *
 * PGlite 是编译成 WASM 的 Postgres 本体，不是模拟器——语法、类型、ON CONFLICT、
 * 窗口函数的行为都和真实服务端一致。所以这套测试能证明「生成的 SQL 在 Postgres
 * 上确实跑得通」，而不只是「字符串拼对了」。
 *
 * 剩下没被覆盖的是连接池、网络故障和并发，那些必须对着真实服务端跑。
 */

/** 把 PGlite 包成 PostgresDriver 期望的 pg.Pool 形状。 */
function poolFromPGlite(db: PGlite) {
  const query = async (sql: string, params?: unknown[]) => {
    const result = await db.query(sql, params as never[])
    return { rows: (result.rows || []) as Record<string, unknown>[], rowCount: result.affectedRows ?? (result.rows?.length ?? 0) }
  }
  return {
    query,
    // PGlite 是单连接的，事务直接打在同一个实例上
    connect: async () => ({ query, release: () => {} }),
    end: async () => db.close(),
    on: () => {},
  }
}

async function makePgDriver(): Promise<PostgresDriver> {
  const db = new PGlite()
  await db.waitReady
  return new PostgresDriver({ dialect: 'postgres', database: 'pglite' }, poolFromPGlite(db) as never)
}

interface Widget {
  id?: string
  name?: string
  kind?: string
  weight?: number
  enabled?: boolean
  payload?: unknown
}

const widgetSpec: TableSpec<Widget> = {
  table: 'widgets',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    kind: { type: 'text' },
    weight: { type: 'int', default: 1 },
    enabled: { type: 'bool', default: 0 },
    payload: { type: 'json' },
  },
  indexes: [{ columns: ['kind'] }],
  filterable: ['id', 'name', 'kind', 'weight', 'enabled'],
  numeric: ['weight'],
  boolean: ['enabled'],
  toRecord: (entity, id) => ({
    id,
    name: entity.name,
    kind: entity.kind,
    weight: entity.weight ?? 1,
    enabled: entity.enabled ? 1 : 0,
    payload: stringifyJson(entity.payload),
  }),
  fromRecord: record => ({
    id: record.id as string,
    name: record.name as string,
    kind: record.kind as string,
    weight: Number(record.weight),
    enabled: Boolean(record.enabled),
    payload: parseJson(record.payload, {}),
  }),
}

describe('PostgresDriver against a real Postgres engine', () => {
  test('creates tables and indexes from the generated DDL', async () => {
    const driver = await makePgDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    const tables = await driver.all<{ tablename: string }>(
      'SELECT tablename FROM pg_tables WHERE schemaname = \'public\'', []
    )
    expect(tables.map(t => t.tablename)).toContain('widgets')

    const indexes = await driver.all<{ indexname: string }>(
      'SELECT indexname FROM pg_indexes WHERE tablename = \'widgets\'', []
    )
    expect(indexes.map(i => i.indexname)).toContain('idx_widgets_kind')
    await driver.close()
  })

  test('placeholders survive the ? -> $n translation end to end', async () => {
    const driver = await makePgDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    await storage.setItem('w1', { name: 'first', kind: 'a', weight: 5, enabled: true, payload: { deep: [1, 2] } })
    const loaded = await storage.getItem('w1')
    expect(loaded).toMatchObject({ name: 'first', weight: 5, enabled: true, payload: { deep: [1, 2] } })
    await driver.close()
  })

  test('upsert really upserts on Postgres', async () => {
    const driver = await makePgDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    await storage.setItem('w1', { name: 'first', kind: 'a' })
    await storage.setItem('w1', { name: 'renamed', kind: 'b' })

    const all = await storage.listItems()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ name: 'renamed', kind: 'b' })
    await driver.close()
  })

  test('filters, IN queries and ordering behave the same as on sqlite', async () => {
    const driver = await makePgDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    await storage.setItem('w1', { name: 'a', kind: 'x', weight: 1, enabled: true })
    await storage.setItem('w2', { name: 'b', kind: 'x', weight: 2, enabled: false })
    await storage.setItem('w3', { name: 'c', kind: 'y', weight: 1, enabled: true })

    expect((await storage.listItemsByEqFilter({ kind: 'x' })).map(w => w.id).sort()).toEqual(['w1', 'w2'])
    // 数值列传字符串也要能匹配（Postgres 的类型检查比 SQLite 严得多）
    expect((await storage.listItemsByEqFilter({ weight: '1' })).map(w => w.id).sort()).toEqual(['w1', 'w3'])
    expect((await storage.listItemsByEqFilter({ enabled: true })).map(w => w.id).sort()).toEqual(['w1', 'w3'])
    expect(
      (await storage.listItemsByInQuery([{ field: 'kind', values: ['x'] }, { field: 'name', values: ['a', 'b'] }]))
        .map(w => w.id).sort()
    ).toEqual(['w1', 'w2'])
    await driver.close()
  })

  test('transactions commit and roll back', async () => {
    const driver = await makePgDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    await driver.transaction(async tx => {
      await tx.run('INSERT INTO "widgets" ("id","name") VALUES (?,?)', ['ok', 'committed'])
    })
    expect(await storage.getItem('ok')).toMatchObject({ name: 'committed' })

    await expect(
      driver.transaction(async tx => {
        await tx.run('INSERT INTO "widgets" ("id","name") VALUES (?,?)', ['bad', 'rolled back'])
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
    expect(await storage.getItem('bad')).toBeNull()
    await driver.close()
  })

  test('user_states dedupe uses a window function Postgres accepts', async () => {
    const driver = await makePgDriver()
    // 先造出老结构和重复行，再让 initialize 去重并建唯一索引
    await driver.exec(`CREATE TABLE user_states (
      id TEXT PRIMARY KEY, "userId" TEXT NOT NULL, nickname TEXT, card TEXT,
      conversations TEXT NOT NULL, settings TEXT NOT NULL, current TEXT NOT NULL, "updatedAt" BIGINT
    )`)
    const insert = `INSERT INTO user_states (id, "userId", nickname, card, conversations, settings, current, "updatedAt")
                    VALUES (?, ?, ?, NULL, '[]', '{}', '{}', ?)`
    await driver.run(insert, ['uuid-old', '555', 'stale', 1000])
    await driver.run(insert, ['uuid-new', '555', 'fresh', 2000])

    const storage = new SqlUserStateStorage(driver)
    await storage.initialize()

    const rows = await driver.all<{ id: string, nickname: string }>('SELECT * FROM user_states', [])
    expect(rows).toHaveLength(1)
    expect(rows[0].nickname).toBe('fresh')

    // 唯一索引装上之后重复写入只更新那一行，代理主键不变
    await storage.setItem('555', { userId: '555', nickname: 'updated', conversations: [], settings: {}, current: {} } as unknown as UserState)
    const after = await driver.all<{ id: string, nickname: string }>('SELECT * FROM user_states', [])
    expect(after).toHaveLength(1)
    expect(after[0].nickname).toBe('updated')
    expect(after[0].id).toBe('uuid-new')
    await driver.close()
  })

  test('operation log retention prunes on Postgres', async () => {
    const driver = await makePgDriver()
    const storage = new SqlOperationLogStorage(driver, 10)
    await storage.initialize()

    for (let i = 0; i < 30; i++) {
      const id = `log-${String(i).padStart(3, '0')}`
      await storage.setItem(id, { id, timestamp: i, type: 'llm.call', level: 'info', summary: id } as OperationLog)
    }
    await storage.setMaxEntries(10)

    const rows = await driver.all<{ id: string }>('SELECT id FROM operation_logs ORDER BY timestamp ASC', [])
    expect(rows).toHaveLength(10)
    expect(rows[0].id).toBe('log-020')
    await driver.close()
  })

  test('history chain, reparenting and pruning work on Postgres', async () => {
    const driver = await makePgDriver()
    const imagesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-img-'))
    const manager = new SqlHistoryManager(driver, imagesDir)
    await manager.initialize()

    const message = (id: string, parentId: string | null, text: string) =>
      ({ id, parentId, role: 'user', content: [{ type: 'text', text }] }) as unknown as HistoryMessage

    await manager.saveHistory(message('m1', null, 'first'), 'c1')
    await manager.saveHistory(message('m2', 'm1', 'second'), 'c1')
    await manager.saveHistory(message('m3', 'm2', 'third'), 'c1')

    expect((await manager.getHistory('m3')).map(m => m.id)).toEqual(['m1', 'm2', 'm3'])

    await manager.removeHistory('m2', 'c1')
    expect((await manager.getHistory('m3')).map(m => m.id)).toEqual(['m1', 'm3'])

    await driver.run('UPDATE history SET "createdAt" = ? WHERE id = ?', ['2000-01-01T00:00:00.000Z', 'm1'])
    const cutoff = '2001-01-01T00:00:00.000Z'
    expect(await manager.countHistoryBefore({ before: cutoff })).toBe(1)
    expect((await manager.pruneHistory({ before: cutoff })).deleted).toBe(1)
    expect((await manager.getHistory(undefined, 'c1')).map(m => m.id)).toEqual(['m3'])
    await driver.close()
  })

  test('batch history writes go through one transaction', async () => {
    const driver = await makePgDriver()
    const manager = new SqlHistoryManager(driver, fs.mkdtempSync(path.join(os.tmpdir(), 'pg-img-')))
    await manager.initialize()

    await manager.saveHistories([
      { id: 'm1', parentId: null, role: 'user', content: [{ type: 'text', text: 'a' }] } as unknown as HistoryMessage,
      { id: 'm2', parentId: 'm1', role: 'user', content: [{ type: 'text', text: 'b' }] } as unknown as HistoryMessage,
    ], 'c1')

    expect(await manager.getHistory(undefined, 'c1')).toHaveLength(2)
    await driver.close()
  })
})
