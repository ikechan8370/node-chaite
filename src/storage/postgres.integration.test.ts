import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createPostgresDriver, PostgresDriver } from './driver/postgres'
import { SqliteDriver } from './driver/sqlite'
import { DriverRegistry } from './driver/registry'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from './sql_storage'
import { SqlUserStateStorage } from './sql/user_state_storage'
import { SqlOperationLogStorage } from './sql/operation_log_storage'
import { SqlHistoryManager } from './sql/history_manager'
import { migrateSqlStorage, getChaiteTables } from './migrate'
import { LogicalDatabase, PostgresConnectionOptions } from './driver/types'
import { HistoryMessage } from '../types/models'
import { OperationLog } from '../types/operation-log'
import { UserState } from '../types/storage'

/**
 * 对着真实 Postgres 服务端跑的集成测试。
 *
 * PGlite 那套验证的是 SQL 语义，但它绕过了 pg.Pool：TCP、认证、acquire/idle
 * 超时、连接上限、多 client 并发事务、pool.end() 与在途查询、首次连接失败时的
 * 资源清理——这些只有真服务端能测。
 *
 * 没配置连接信息时整组跳过，所以本地和 CI 都不会因为缺少数据库而失败：
 *
 *   CHAITE_PG_HOST=127.0.0.1 CHAITE_PG_PORT=5432 CHAITE_PG_DB=chaite_test \
 *   CHAITE_PG_USER=chaite CHAITE_PG_PASSWORD=... pnpm test:pg:integration
 */

const PG_ENV = {
  host: process.env.CHAITE_PG_HOST,
  port: process.env.CHAITE_PG_PORT ? Number(process.env.CHAITE_PG_PORT) : undefined,
  database: process.env.CHAITE_PG_DB,
  username: process.env.CHAITE_PG_USER,
  password: process.env.CHAITE_PG_PASSWORD,
}

const CONFIGURED = Boolean(PG_ENV.host && PG_ENV.database && PG_ENV.username)
const describeIfPg = CONFIGURED ? describe : describe.skip

function pgOptions(overrides: Partial<PostgresConnectionOptions> = {}): PostgresConnectionOptions {
  return {
    dialect: 'postgres',
    host: PG_ENV.host,
    port: PG_ENV.port,
    database: PG_ENV.database as string,
    username: PG_ENV.username,
    password: PG_ENV.password,
    ...overrides,
  }
}

/** 每个用例都从干净的 schema 开始，互不干扰。 */
async function resetSchema(): Promise<void> {
  const driver = await createPostgresDriver(pgOptions())
  await driver.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  await driver.close()
}

interface Widget { id?: string, name?: string, kind?: string, weight?: number }

const widgetSpec: TableSpec<Widget> = {
  table: 'widgets',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    kind: { type: 'text' },
    weight: { type: 'int', default: 1 },
  },
  indexes: [{ columns: ['kind'] }],
  filterable: ['id', 'name', 'kind', 'weight'],
  numeric: ['weight'],
  toRecord: (entity, id) => ({ id, name: entity.name, kind: entity.kind, weight: entity.weight ?? 1 }),
  fromRecord: record => ({
    id: record.id as string,
    name: record.name as string,
    kind: record.kind as string,
    weight: Number(record.weight),
  }),
}

describeIfPg('PostgresDriver against a real server', () => {
  beforeEach(resetSchema)

  test('connects over TCP with real authentication', async () => {
    const driver = await createPostgresDriver(pgOptions())
    const row = await driver.get<{ db: string, v: string }>('SELECT current_database() AS db, version() AS v', [])
    expect(row?.db).toBe(PG_ENV.database)
    expect(row?.v).toMatch(/PostgreSQL/)
    await driver.close()
  })

  test('a bad password fails fast and does not leak the pool', async () => {
    // 关键在于「不挂住」：pool 没 end 的话它的重连计时器会把 jest 吊到超时
    await expect(
      createPostgresDriver(pgOptions({ password: 'definitely-not-the-password' }))
    ).rejects.toThrow()
  }, 30000)

  test('an unreachable host fails fast and does not leak the pool', async () => {
    await expect(
      createPostgresDriver(pgOptions({ host: '127.0.0.1', port: 1, pool: { acquire: 2000 } }))
    ).rejects.toThrow()
  }, 30000)

  test('a nonexistent database is reported rather than hanging', async () => {
    await expect(
      createPostgresDriver(pgOptions({ database: 'no_such_database_here' }))
    ).rejects.toThrow()
  }, 30000)

  test('concurrent transactions on separate clients stay isolated', async () => {
    const driver = await createPostgresDriver(pgOptions({ pool: { max: 5 } }))
    await driver.exec('CREATE TABLE counters (id TEXT PRIMARY KEY, n INT)')
    await driver.run('INSERT INTO counters VALUES (?, ?)', ['a', 0])

    // 10 个并发事务各自 +1，行级锁应当让它们串起来，最终正好是 10
    await Promise.all(
      Array.from({ length: 10 }, () =>
        driver.transaction(async tx => {
          const row = await tx.get<{ n: number }>('SELECT n FROM counters WHERE id = ? FOR UPDATE', ['a'])
          await tx.run('UPDATE counters SET n = ? WHERE id = ?', [Number(row?.n) + 1, 'a'])
        })
      )
    )

    const final = await driver.get<{ n: number }>('SELECT n FROM counters WHERE id = ?', ['a'])
    expect(Number(final?.n)).toBe(10)
    await driver.close()
  }, 60000)

  test('a rolled back transaction leaves nothing behind on the server', async () => {
    const driver = await createPostgresDriver(pgOptions())
    await driver.exec('CREATE TABLE t (id TEXT PRIMARY KEY)')

    await expect(driver.transaction(async tx => {
      await tx.run('INSERT INTO t VALUES (?)', ['x'])
      throw new Error('boom')
    })).rejects.toThrow('boom')

    expect(await driver.all('SELECT * FROM t', [])).toHaveLength(0)
    // 回滚之后 client 必须干净地还回池子，后续查询照常
    expect(await driver.get('SELECT 1 AS ok', [])).toMatchObject({ ok: 1 })
    await driver.close()
  })

  test('more concurrent work than pool.max queues instead of failing', async () => {
    const driver = await createPostgresDriver(pgOptions({ pool: { max: 2 } }))
    await driver.exec('CREATE TABLE t (id INT)')

    // 20 个并发查询、池子只有 2 条连接：应该排队而不是报 acquire 失败
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => driver.get<{ n: number }>('SELECT ? ::int AS n', [i]))
    )
    expect(results.map(r => Number(r?.n)).sort((a, b) => a - b)[19]).toBe(19)
    await driver.close()
  }, 60000)

  test('acquire timeout surfaces as an error, not a hang', async () => {
    const driver = await createPostgresDriver(pgOptions({ pool: { max: 1, acquire: 500 } }))
    await driver.exec('CREATE TABLE t (id INT)')

    // 占住唯一那条连接，另一边应当在 acquire 超时后报错
    let release: () => void = () => {}
    const held = new Promise<void>(resolve => { release = resolve })
    const holding = driver.transaction(async () => { await held })
    await new Promise(resolve => setTimeout(resolve, 100))

    await expect(driver.get('SELECT 1', [])).rejects.toThrow(/timeout|timed out/i)

    release()
    await holding
    await driver.close()
  }, 60000)

  test('close() ends the pool and the server sees the connections go', async () => {
    const driver = await createPostgresDriver(pgOptions({ pool: { max: 3 } }))
    await driver.exec('CREATE TABLE t (id INT)')
    await Promise.all([driver.get('SELECT 1', []), driver.get('SELECT 2', []), driver.get('SELECT 3', [])])

    await driver.close()
    // end() 之后再用同一个 driver 必须失败，而不是悄悄重连
    await expect(driver.get('SELECT 1', [])).rejects.toThrow()

    // 从一条新连接确认服务端这边的连接已经收掉
    const probe = await createPostgresDriver(pgOptions())
    const row = await probe.get<{ n: number }>(
      'SELECT count(*) AS n FROM pg_stat_activity WHERE datname = ? AND pid <> pg_backend_pid()',
      [PG_ENV.database]
    )
    expect(Number(row?.n)).toBe(0)
    await probe.close()
  }, 60000)

  test('an older table missing columns is reconciled on a real server', async () => {
    const driver = await createPostgresDriver(pgOptions())
    // 老版本表：只有主键和 name
    await driver.exec('CREATE TABLE widgets (id TEXT PRIMARY KEY, name TEXT NOT NULL)')
    await driver.run('INSERT INTO widgets (id, name) VALUES (?, ?)', ['old', 'legacy row'])

    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    const columns = await driver.all<{ column_name: string }>(
      'SELECT column_name FROM information_schema.columns WHERE table_name = ?', ['widgets']
    )
    expect(columns.map(c => c.column_name).sort()).toEqual(['id', 'kind', 'name', 'weight'])

    // 补列之前这里会报 column "kind" of relation "widgets" does not exist
    await storage.setItem('new', { name: 'fresh', kind: 'a', weight: 3 })
    expect(await storage.listItems()).toHaveLength(2)
    // 老行拿到 weight 的默认值
    expect((await storage.getItem('old'))?.weight).toBe(1)
    await driver.close()
  }, 60000)

  test('storages round-trip through the real driver', async () => {
    const driver = await createPostgresDriver(pgOptions())
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    await storage.setItem('w1', { name: 'first', kind: 'a', weight: 5 })
    await storage.setItem('w1', { name: 'renamed', kind: 'b', weight: 6 })
    expect(await storage.listItems()).toHaveLength(1)
    expect((await storage.getItem('w1'))?.name).toBe('renamed')
    expect((await storage.listItemsByEqFilter({ weight: '6' })).map(w => w.id)).toEqual(['w1'])
    await driver.close()
  })

  test('user_states dedupe and unique index hold on a real server', async () => {
    const driver = await createPostgresDriver(pgOptions())
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

    // 唯一索引真的在服务端生效
    await expect(driver.run(insert, ['uuid-third', '555', 'dupe', 3000])).rejects.toThrow()
    await driver.close()
  }, 60000)

  test('concurrent initialize() on the same table does not fight', async () => {
    const driver = await createPostgresDriver(pgOptions({ pool: { max: 5 } }))
    // 三个实例同时建同一张表 + 唯一索引，IF NOT EXISTS 要能顶住并发
    const storages = [
      new SqlUserStateStorage(driver),
      new SqlUserStateStorage(driver),
      new SqlUserStateStorage(driver),
    ]
    await Promise.all(storages.map(s => s.initialize()))

    const indexes = await driver.all<{ indexname: string }>(
      'SELECT indexname FROM pg_indexes WHERE tablename = ?', ['user_states']
    )
    expect(indexes.map(i => i.indexname)).toContain('uniq_user_states_userId')
    await driver.close()
  }, 60000)

  test('history chain CTE and pruning work on a real server', async () => {
    const driver = await createPostgresDriver(pgOptions())
    const manager = new SqlHistoryManager(driver, fs.mkdtempSync(path.join(os.tmpdir(), 'pgi-img-')))
    await manager.initialize()

    const messages: HistoryMessage[] = Array.from({ length: 400 }, (_, i) => ({
      id: `m${String(i).padStart(4, '0')}`,
      parentId: i ? `m${String(i - 1).padStart(4, '0')}` : null,
      role: 'user',
      content: [{ type: 'text', text: `消息 ${i}` }],
    }) as unknown as HistoryMessage)
    await manager.saveHistories(messages, 'conv1')

    // 400 层的链必须是一次查询，不是 400 次往返
    const startedAt = Date.now()
    const chain = await manager.getHistory('m0399')
    const elapsed = Date.now() - startedAt
    expect(chain).toHaveLength(400)
    expect(chain[0].id).toBe('m0000')
    // 真网络上 400 次往返绝不可能在这个时间内跑完，这就是 CTE 生效的证据
    expect(elapsed).toBeLessThan(2000)

    await driver.run('UPDATE history SET "createdAt" = ? WHERE id = ?', ['2000-01-01T00:00:00.000Z', 'm0000'])
    expect(await manager.countHistoryBefore({ before: '2001-01-01T00:00:00.000Z' })).toBe(1)
    expect((await manager.pruneHistory({ before: '2001-01-01T00:00:00.000Z' })).deleted).toBe(1)
    await driver.close()
  }, 120000)

  test('operation log retention prunes on a real server', async () => {
    const driver = await createPostgresDriver(pgOptions())
    const logs = new SqlOperationLogStorage(driver, 10)
    await logs.initialize()
    for (let i = 0; i < 40; i++) {
      const id = `log-${String(i).padStart(3, '0')}`
      await logs.setItem(id, { id, timestamp: i, type: 'llm.call', level: 'info', summary: id } as OperationLog)
    }
    await logs.setMaxEntries(10)
    expect(await driver.all('SELECT id FROM operation_logs', [])).toHaveLength(10)
    await driver.close()
  }, 60000)
})

describeIfPg('DriverRegistry against a real server', () => {
  beforeEach(resetSchema)

  test('postgres init shares one pool across all three logical databases', async () => {
    const registry = new DriverRegistry()
    await registry.init(pgOptions())

    expect(registry.listUnique()).toHaveLength(1)
    expect(registry.get('main')).toBe(registry.get('history'))
    expect(registry.get('operation_logs')).toBe(registry.get('main'))
    await registry.close()
  })

  test('concurrent init() against a real server opens one pool', async () => {
    const registry = new DriverRegistry()
    await Promise.all([registry.init(pgOptions()), registry.init(pgOptions()), registry.init(pgOptions())])
    expect(registry.listUnique()).toHaveLength(1)
    await registry.close()

    // 并发初始化不该漏下额外连接
    const probe = await createPostgresDriver(pgOptions())
    const row = await probe.get<{ n: number }>(
      'SELECT count(*) AS n FROM pg_stat_activity WHERE datname = ? AND pid <> pg_backend_pid()',
      [PG_ENV.database]
    )
    expect(Number(row?.n)).toBe(0)
    await probe.close()
  }, 60000)

  test('a failed postgres init leaves nothing open and stays retryable', async () => {
    const registry = new DriverRegistry()
    await expect(registry.init(pgOptions({ password: 'wrong-password' }))).rejects.toThrow()
    expect(registry.isInitialized()).toBe(false)
    expect(registry.listUnique()).toHaveLength(0)

    // 配置修好后还能正常初始化
    await registry.init(pgOptions())
    expect(registry.isInitialized()).toBe(true)
    await registry.close()
  }, 60000)
})

describeIfPg('SQLite -> real Postgres migration', () => {
  beforeEach(resetSchema)

  test('moves a populated SQLite install and is idempotent', async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pgi-src-'))
    const imagesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pgi-img-'))
    const tables = getChaiteTables()
    const find = (name: string) => tables.find(t => t.table === name)!

    const sqliteMain = new SqliteDriver(path.join(dataDir, 'data.db'))
    const sqliteHistory = new SqliteDriver(path.join(dataDir, 'history.db'))
    const sqliteLogs = new SqliteDriver(path.join(dataDir, 'operation_logs.db'))
    await Promise.all([sqliteMain.ready(), sqliteHistory.ready(), sqliteLogs.ready()])

    await sqliteMain.exec(sqliteMain.dialect.createTable('channels', find('channels').columns))
    for (let i = 0; i < 20; i++) {
      await sqliteMain.run(
        'INSERT INTO "channels" ("id","name","adapterType","type","weight","models","embedded") VALUES (?,?,?,?,?,?,?)',
        [`c${i}`, `渠道${i}`, 'openai', 'openai', i + 1, JSON.stringify([{ name: 'gpt-5', features: ['chat'] }]), 0]
      )
    }

    const userStates = new SqlUserStateStorage(sqliteMain)
    await userStates.initialize()
    await userStates.setItem('10001', {
      userId: '10001', nickname: '昵称', conversations: [], settings: {}, current: {},
    } as unknown as UserState)

    const history = new SqlHistoryManager(sqliteHistory, imagesDir)
    await history.initialize()
    await history.saveHistories(
      Array.from({ length: 1500 }, (_, i) => ({
        id: `m${String(i).padStart(5, '0')}`,
        parentId: i ? `m${String(i - 1).padStart(5, '0')}` : null,
        role: 'user',
        content: [{ type: 'text', text: `消息 ${i}` }],
      }) as unknown as HistoryMessage),
      'conv1'
    )

    const logs = new SqlOperationLogStorage(sqliteLogs, 0)
    await logs.initialize()
    for (let i = 0; i < 50; i++) {
      await logs.setItem(`l${i}`, { id: `l${i}`, timestamp: i, type: 'llm.call', level: 'info', summary: `l${i}` } as OperationLog)
    }

    const target = await createPostgresDriver(pgOptions({ pool: { max: 4 } }))
    const source = (db: LogicalDatabase) =>
      db === 'history' ? sqliteHistory : db === 'operation_logs' ? sqliteLogs : sqliteMain

    const result = await migrateSqlStorage({ from: source, to: () => target, batchSize: 250 })
    const byTable = Object.fromEntries(result.tables.map(t => [t.table, t]))
    expect(byTable.channels.copied).toBe(20)
    expect(byTable.user_states.copied).toBe(1)
    expect(byTable.history.copied).toBe(1500)
    expect(byTable.operation_logs.copied).toBe(50)

    // 搬完之后在 Postgres 上把整条 1500 层的链走一遍
    const pgHistory = new SqlHistoryManager(target, imagesDir)
    await pgHistory.initialize()
    const chain = await pgHistory.getHistory('m01499')
    expect(chain).toHaveLength(1500)
    expect(chain[0].id).toBe('m00000')

    const pgUser = new SqlUserStateStorage(target)
    await pgUser.initialize()
    expect((await pgUser.getItem('10001'))?.nickname).toBe('昵称')

    // 重跑一遍不该产生重复行
    const second = await migrateSqlStorage({ from: source, to: () => target, batchSize: 250 })
    expect(second.total).toBe(result.total)
    expect(await target.all('SELECT id FROM channels', [])).toHaveLength(20)
    expect(await target.all('SELECT id FROM history', [])).toHaveLength(1500)

    await Promise.all([sqliteMain.close(), sqliteHistory.close(), sqliteLogs.close(), target.close()])
  }, 300000)
})

if (!CONFIGURED) {
  describe('Postgres integration', () => {
    test.skip('skipped: CHAITE_PG_* not configured', () => {})
  })
}
