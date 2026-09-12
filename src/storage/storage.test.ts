import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { toDollarPlaceholders, countPlaceholders } from './driver/placeholders'
import { createDialect } from './driver/dialect'
import { SqliteDriver } from './driver/sqlite'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from './sql_storage'
import { SqlUserStateStorage } from './sql/user_state_storage'
import { SqlOperationLogStorage } from './sql/operation_log_storage'
import { SqlHistoryManager } from './sql/history_manager'
import { HistoryMessage } from '../types/models'
import { OperationLog } from '../types/operation-log'

function tempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function tempDbPath(): string {
  return path.join(tempDir('chaite-sql-'), 'test.db')
}

async function makeDriver(): Promise<SqliteDriver> {
  const driver = new SqliteDriver(tempDbPath())
  await driver.ready()
  return driver
}

describe('placeholders', () => {
  test('numbers placeholders in order', () => {
    expect(toDollarPlaceholders('SELECT * FROM t WHERE a = ? AND b = ?')).toBe(
      'SELECT * FROM t WHERE a = $1 AND b = $2'
    )
  })

  test('leaves placeholders inside string literals alone', () => {
    expect(toDollarPlaceholders('SELECT * FROM t WHERE a = ? AND b = \'why?\'')).toBe(
      'SELECT * FROM t WHERE a = $1 AND b = \'why?\''
    )
    // '' 是转义的单引号，不能被当成字符串结束
    expect(toDollarPlaceholders('SELECT \'it\'\'s a ?\' , ?')).toBe('SELECT \'it\'\'s a ?\' , $1')
  })

  test('leaves quoted identifiers and comments alone', () => {
    expect(toDollarPlaceholders('SELECT "we?rd" FROM t WHERE a = ? -- trailing ?\n')).toBe(
      'SELECT "we?rd" FROM t WHERE a = $1 -- trailing ?\n'
    )
    expect(toDollarPlaceholders('SELECT /* ? */ a FROM t WHERE b = ?')).toBe('SELECT /* ? */ a FROM t WHERE b = $1')
  })

  test('counts placeholders', () => {
    expect(countPlaceholders('SELECT ?, ?, ?')).toBe(3)
    expect(countPlaceholders('SELECT \'no ? here\'')).toBe(0)
  })
})

describe('dialect', () => {
  test('upsert updates every column except the conflict key', () => {
    const sql = createDialect('postgres').upsert('channels', ['id', 'name', 'weight'], 'id')
    expect(sql).toMatch(/ON CONFLICT\("id"\) DO UPDATE SET/)
    expect(sql).toMatch(/"name" = EXCLUDED\."name"/)
    expect(sql).not.toMatch(/"id" = EXCLUDED\."id"/)
  })

  test('immutable columns are not overwritten on conflict', () => {
    const sql = createDialect('sqlite').upsert('user_states', ['id', 'userId', 'nickname'], 'userId', ['id'])
    expect(sql).toMatch(/"nickname" = EXCLUDED\."nickname"/)
    expect(sql).not.toMatch(/"id" = EXCLUDED\."id"/)
  })

  test('a single-column table degrades to DO NOTHING', () => {
    expect(createDialect('sqlite').upsert('t', ['id'], 'id')).toMatch(/DO NOTHING/)
  })

  test('both dialects emit the same upsert shape', () => {
    const columns = ['id', 'name']
    expect(createDialect('sqlite').upsert('t', columns, 'id')).toBe(createDialect('postgres').upsert('t', columns, 'id'))
  })

  test('autoincrement differs per dialect', () => {
    expect(createDialect('sqlite').autoIncrementPk()).toMatch(/AUTOINCREMENT/)
    expect(createDialect('postgres').autoIncrementPk()).toMatch(/BIGSERIAL/)
  })

  test('per-column index ordering is preserved', () => {
    const sql = createDialect('sqlite').createIndex('operation_logs', ['userId', { column: 'timestamp', order: 'DESC' }])
    expect(sql).toMatch(/\("userId", "timestamp" DESC\)/)
  })

  test('unsafe identifiers are rejected', () => {
    expect(() => createDialect('sqlite').quoteId('a"; DROP TABLE t; --')).toThrow(/unsafe identifier/)
  })
})

describe('json helpers', () => {
  test('tolerate garbage', () => {
    expect(parseJson('{"a":1}', null)).toEqual({ a: 1 })
    expect(parseJson('not json', null)).toBeNull()
    expect(parseJson('not json', {})).toEqual({})
    expect(stringifyJson(undefined)).toBeNull()
  })
})

interface Widget {
  id?: string
  name?: string
  kind?: string
  weight?: number
  enabled?: boolean
  payload?: unknown
}

/** 一份最小 spec，覆盖提升列、数值列、布尔列和 JSON 列四种形态 */
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

describe('SqlKvStorage', () => {
  async function makeStorage() {
    const driver = await makeDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()
    return storage
  }

  test('round-trips an item', async () => {
    const storage = await makeStorage()
    expect(await storage.setItem('w1', { name: 'first', kind: 'a', weight: 5, enabled: true, payload: { deep: [1, 2] } })).toBe('w1')

    const loaded = await storage.getItem('w1')
    expect(loaded).toMatchObject({ name: 'first', weight: 5, enabled: true, payload: { deep: [1, 2] } })
    expect(await storage.getItem('missing')).toBeNull()
    await storage.driver.close()
  })

  test('setItem upserts rather than duplicating', async () => {
    const storage = await makeStorage()
    await storage.setItem('w1', { name: 'first', kind: 'a' })
    await storage.setItem('w1', { name: 'renamed', kind: 'b' })

    const all = await storage.listItems()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ name: 'renamed', kind: 'b' })
    await storage.driver.close()
  })

  test('generates an id when none is given', async () => {
    const storage = await makeStorage()
    const id = await storage.setItem('', { name: 'anon' })
    expect(id).toBeTruthy()
    expect((await storage.getItem(id))?.name).toBe('anon')
    await storage.driver.close()
  })

  test('eq filter pushes known columns down and filters the rest in memory', async () => {
    const storage = await makeStorage()
    await storage.setItem('w1', { name: 'a', kind: 'x', weight: 1 })
    await storage.setItem('w2', { name: 'b', kind: 'x', weight: 2 })
    await storage.setItem('w3', { name: 'c', kind: 'y', weight: 1 })

    expect((await storage.listItemsByEqFilter({ kind: 'x' })).map(i => i.id).sort()).toEqual(['w1', 'w2'])
    // weight 是数值列：传字符串也应该匹配得上
    expect((await storage.listItemsByEqFilter({ weight: '1' })).map(i => i.id).sort()).toEqual(['w1', 'w3'])
    // 不在 filterable 里的字段只能在内存里比
    expect(await storage.listItemsByEqFilter({ kind: 'x', nope: 'zzz' })).toHaveLength(0)
    expect(await storage.listItemsByEqFilter({})).toHaveLength(3)
    await storage.driver.close()
  })

  test('boolean columns normalise to 0/1 in the query', async () => {
    const storage = await makeStorage()
    await storage.setItem('on', { name: 'on', enabled: true })
    await storage.setItem('off', { name: 'off', enabled: false })

    expect((await storage.listItemsByEqFilter({ enabled: true })).map(i => i.id)).toEqual(['on'])
    expect((await storage.listItemsByEqFilter({ enabled: false })).map(i => i.id)).toEqual(['off'])
    await storage.driver.close()
  })

  test('in-query intersects and short-circuits on an empty set', async () => {
    const storage = await makeStorage()
    await storage.setItem('w1', { name: 'a', kind: 'x' })
    await storage.setItem('w2', { name: 'b', kind: 'y' })
    await storage.setItem('w3', { name: 'c', kind: 'x' })

    const hits = await storage.listItemsByInQuery([
      { field: 'kind', values: ['x'] },
      { field: 'name', values: ['a', 'c'] },
    ])
    expect(hits.map(i => i.id).sort()).toEqual(['w1', 'w3'])
    expect(await storage.listItemsByInQuery([{ field: 'kind', values: [] }])).toEqual([])
    expect(await storage.listItemsByInQuery([])).toHaveLength(3)
    await storage.driver.close()
  })

  test('removeItem and clear', async () => {
    const storage = await makeStorage()
    await storage.setItem('w1', { name: 'a' })
    await storage.setItem('w2', { name: 'b' })

    await storage.removeItem('w1')
    expect(await storage.listItems()).toHaveLength(1)
    await storage.clear()
    expect(await storage.listItems()).toHaveLength(0)
    await storage.driver.close()
  })

  test('initialize is idempotent under a race', async () => {
    const driver = await makeDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await Promise.all([storage.initialize(), storage.initialize(), storage.initialize()])
    await storage.setItem('w1', { name: 'a' })
    expect(await storage.listItems()).toHaveLength(1)
    await driver.close()
  })

  test('close() does not disconnect the shared driver', async () => {
    const driver = await makeDriver()
    const a = new SqlKvStorage<Widget>(driver, widgetSpec)
    await a.initialize()
    // 八个 storage 共用一个 driver，任何一个 close 都不该把连接关掉
    await a.close()
    await a.setItem('w1', { name: 'still works' })
    expect(await a.listItems()).toHaveLength(1)
    await driver.close()
  })
})

/*
 * 注意：Channel / ChatPreset / ToolDTO / TriggerDTO 这四个具体 spec 的测试没有放在
 * 这里。它们要 import 对应的 DTO 类，而那条链路会走到 types 桶文件 -> core ->
 * adapters，chaite 现有的模块循环在 jest 的 CJS 环境下会炸（ESM 打包时靠提升侥幸
 * 不炸）。把 jest 切到 ESM 或者拆掉这些环都是独立的工程。
 *
 * 这四个 spec 的序列化行为由宿主插件里的 parity 测试覆盖：那边用真实数据文件比对
 * 新旧两套实现的读写结果，正好是最该保证的东西。
 */

describe('SqlUserStateStorage', () => {
  test('keys on userId and keeps the surrogate id stable', async () => {
    const driver = await makeDriver()
    const storage = new SqlUserStateStorage(driver)
    await storage.initialize()

    await storage.setItem('10001', { userId: '10001', nickname: 'first', conversations: [], settings: {}, current: {} } as never)
    const firstRow = await driver.get<{ id: string }>('SELECT id FROM user_states', [])

    await storage.setItem('10001', { userId: '10001', nickname: 'second', conversations: [], settings: {}, current: {} } as never)
    const rows = await driver.all<{ id: string, nickname: string }>('SELECT * FROM user_states', [])

    expect(rows).toHaveLength(1)
    expect(rows[0].nickname).toBe('second')
    expect(rows[0].id).toBe(firstRow?.id)
    await driver.close()
  })

  test('collapses duplicate userIds before adding the unique index', async () => {
    const driver = await makeDriver()
    // 先建出老结构（没有唯一索引），再插两行同 userId，模拟并发写留下的重复
    await driver.exec(`CREATE TABLE IF NOT EXISTS user_states (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL, nickname TEXT, card TEXT,
      conversations TEXT NOT NULL, settings TEXT NOT NULL, current TEXT NOT NULL, updatedAt INTEGER
    )`)
    const insert = `INSERT INTO user_states (id, userId, nickname, card, conversations, settings, current, updatedAt)
                    VALUES (?, ?, ?, NULL, '[]', '{}', '{}', ?)`
    await driver.run(insert, ['uuid-old', '555', 'stale', 1000])
    await driver.run(insert, ['uuid-new', '555', 'fresh', 2000])

    const storage = new SqlUserStateStorage(driver)
    await storage.initialize()

    const rows = await driver.all<{ id: string, nickname: string }>('SELECT * FROM user_states', [])
    expect(rows).toHaveLength(1)
    expect(rows[0].nickname).toBe('fresh')
    expect(rows[0].id).toBe('uuid-new')
    await driver.close()
  })
})

describe('SqlOperationLogStorage', () => {
  function log(id: string, timestamp: number): OperationLog {
    return { id, timestamp, type: 'llm.call', level: 'info', summary: `log ${id}` }
  }

  test('prunes down to maxEntries, oldest first', async () => {
    const driver = await makeDriver()
    const storage = new SqlOperationLogStorage(driver, 10)
    await storage.initialize()

    for (let i = 0; i < 30; i++) {
      await storage.setItem(`log-${String(i).padStart(3, '0')}`, log(`log-${String(i).padStart(3, '0')}`, i))
    }
    // 直接调一次强制裁剪，避免依赖写入计数的触发时机
    await storage.setMaxEntries(10)

    const rows = await driver.all<{ id: string }>('SELECT id FROM operation_logs ORDER BY timestamp ASC', [])
    expect(rows).toHaveLength(10)
    // 保留的应该是最新的十条
    expect(rows[0].id).toBe('log-020')
    await driver.close()
  })

  test('maxEntries of 0 disables pruning', async () => {
    const driver = await makeDriver()
    const storage = new SqlOperationLogStorage(driver, 0)
    await storage.initialize()

    for (let i = 0; i < 20; i++) await storage.setItem(`log-${i}`, log(`log-${i}`, i))
    await storage.setMaxEntries(0)

    expect(await driver.all('SELECT id FROM operation_logs', [])).toHaveLength(20)
    await driver.close()
  })

  test('reads back the full payload and orders newest first', async () => {
    const driver = await makeDriver()
    const storage = new SqlOperationLogStorage(driver, 0)
    await storage.initialize()

    await storage.setItem('a', { ...log('a', 1), userId: 'u1' })
    await storage.setItem('b', { ...log('b', 2), userId: 'u2' })

    expect((await storage.listItems()).map(l => l.id)).toEqual(['b', 'a'])
    expect((await storage.listItemsByEqFilter({ userId: 'u1' })).map(l => l.id)).toEqual(['a'])
    await driver.close()
  })
})

describe('SqlHistoryManager', () => {
  async function makeHistory() {
    const driver = await makeDriver()
    const manager = new SqlHistoryManager(driver, tempDir('chaite-img-'))
    await manager.initialize()
    return manager
  }

  function message(id: string, parentId: string | null, text: string): HistoryMessage {
    return { id, parentId, role: 'user', content: [{ type: 'text', text }] } as unknown as HistoryMessage
  }

  test('walks the parent chain back to the root, oldest first', async () => {
    const manager = await makeHistory()
    await manager.saveHistory(message('m1', null, 'first'), 'c1')
    await manager.saveHistory(message('m2', 'm1', 'second'), 'c1')
    await manager.saveHistory(message('m3', 'm2', 'third'), 'c1')

    const chain = await manager.getHistory('m3')
    expect(chain.map(m => m.id)).toEqual(['m1', 'm2', 'm3'])
    await manager.driver.close()
  })

  test('a parentId cycle truncates instead of hanging', async () => {
    const manager = await makeHistory()
    await manager.saveHistory(message('a', 'b', 'one'), 'c1')
    await manager.saveHistory(message('b', 'a', 'two'), 'c1')

    // 改造前这里是无限递归；带访问集合后应该有限步停下
    const chain = await manager.getHistory('a')
    expect(chain.map(m => m.id).sort()).toEqual(['a', 'b'])
    await manager.driver.close()
  })

  test('saveHistories writes every message in one transaction', async () => {
    const manager = await makeHistory()
    await manager.saveHistories([message('m1', null, 'a'), message('m2', 'm1', 'b')], 'c1')
    expect(await manager.getHistory(undefined, 'c1')).toHaveLength(2)
    await manager.driver.close()
  })

  test('removeHistory reparents children instead of breaking the chain', async () => {
    const manager = await makeHistory()
    await manager.saveHistory(message('m1', null, 'first'), 'c1')
    await manager.saveHistory(message('m2', 'm1', 'second'), 'c1')
    await manager.saveHistory(message('m3', 'm2', 'third'), 'c1')

    await manager.removeHistory('m2', 'c1')

    const chain = await manager.getHistory('m3')
    expect(chain.map(m => m.id)).toEqual(['m1', 'm3'])
    await manager.driver.close()
  })

  test('base64 images are written to disk and restored on read', async () => {
    const manager = await makeHistory()
    const png = Buffer.from('hello world, pretend this is a png').toString('base64')
    await manager.saveHistory(
      { id: 'm1', parentId: null, role: 'user', content: [{ type: 'image', image: png }] } as unknown as HistoryMessage,
      'c1'
    )

    // 行里存的应该是引用而不是图片本体
    const row = await manager.driver.get<{ messageData: string }>('SELECT messageData FROM history WHERE id = ?', ['m1'])
    expect(row?.messageData).toMatch(/\$image:[a-f0-9]+:\.jpg/)
    expect(row?.messageData).not.toContain(png)
    expect(fs.readdirSync(manager.imagesDir)).toHaveLength(1)

    const restored = await manager.getOneHistory('m1', 'c1')
    expect((restored?.content as { image?: string }[])[0].image).toBe(png)
    await manager.driver.close()
  })

  test('a missing image file degrades to a [图片] placeholder', async () => {
    const manager = await makeHistory()
    const png = Buffer.from('another fake png').toString('base64')
    await manager.saveHistory(
      { id: 'm1', parentId: null, role: 'user', content: [{ type: 'image', image: png }] } as unknown as HistoryMessage,
      'c1'
    )
    for (const file of fs.readdirSync(manager.imagesDir)) fs.unlinkSync(path.join(manager.imagesDir, file))

    const restored = await manager.getOneHistory('m1', 'c1')
    expect(restored?.content as unknown).toEqual([{ type: 'text', text: '[图片]' }])
    await manager.driver.close()
  })

  test('cleanupUnusedImages keeps referenced files only', async () => {
    const manager = await makeHistory()
    const png = Buffer.from('referenced').toString('base64')
    await manager.saveHistory(
      { id: 'm1', parentId: null, role: 'user', content: [{ type: 'image', image: png }] } as unknown as HistoryMessage,
      'c1'
    )
    fs.writeFileSync(path.join(manager.imagesDir, 'orphan.png'), 'nobody references me')

    const result = await manager.cleanupUnusedImages()
    expect(result.deleted).toBe(1)
    expect(fs.readdirSync(manager.imagesDir)).toHaveLength(1)
    await manager.driver.close()
  })

  test('prune deletes only what predates the cutoff', async () => {
    const manager = await makeHistory()
    await manager.saveHistory(message('m1', null, 'old'), 'c1')
    await manager.saveHistory(message('m2', null, 'new'), 'c1')
    // createdAt 是写入时生成的，这里直接改成一个确定的旧值
    await manager.driver.run('UPDATE history SET createdAt = ? WHERE id = ?', ['2000-01-01T00:00:00.000Z', 'm1'])

    const cutoff = '2001-01-01T00:00:00.000Z'
    expect(await manager.countHistoryBefore({ before: cutoff })).toBe(1)

    const result = await manager.pruneHistory({ before: cutoff })
    expect(result.deleted).toBe(1)
    expect(result.truncated).toBe(false)
    expect((await manager.getHistory(undefined, 'c1')).map(m => m.id)).toEqual(['m2'])
    await manager.driver.close()
  })

  test('prune can be scoped to a conversation prefix', async () => {
    const manager = await makeHistory()
    await manager.saveHistory(message('m1', null, 'a'), 'group:111')
    await manager.saveHistory(message('m2', null, 'b'), 'private:222')
    await manager.driver.run('UPDATE history SET createdAt = ?', ['2000-01-01T00:00:00.000Z'])

    const result = await manager.pruneHistory({ before: '2001-01-01T00:00:00.000Z', conversationPrefix: 'group:' })
    expect(result.deleted).toBe(1)
    expect((await manager.getHistory(undefined, 'private:222'))).toHaveLength(1)
    await manager.driver.close()
  })

  test('deleteConversation removes the whole conversation', async () => {
    const manager = await makeHistory()
    await manager.saveHistory(message('m1', null, 'a'), 'c1')
    await manager.saveHistory(message('m2', null, 'b'), 'c2')

    await manager.deleteConversation('c1')
    expect(await manager.getHistory(undefined, 'c1')).toHaveLength(0)
    expect(await manager.getHistory(undefined, 'c2')).toHaveLength(1)
    await manager.driver.close()
  })
})

describe('lifecycle and concurrency', () => {
  test('a racing ensureInitialized never sees a half-built user_states', async () => {
    const driver = await makeDriver()
    const storage = new SqlUserStateStorage(driver)

    // 三个并发调用：只要有任何一个在唯一索引建好之前就放行，后面的写入就可能
    // 插进重复 userId
    await Promise.all([
      storage.initialize(),
      storage.ensureInitialized(),
      storage.ensureInitialized(),
    ])

    const indexes = await driver.all<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type = ? AND tbl_name = ?', ['index', 'user_states']
    )
    expect(indexes.map(i => i.name)).toContain('uniq_user_states_userId')
    await driver.close()
  })

  test('a failed afterInitialize leaves the storage retryable', async () => {
    const driver = await makeDriver()
    let attempts = 0

    class FlakyStorage extends SqlKvStorage<Widget> {
      protected async afterInitialize(): Promise<void> {
        attempts++
        if (attempts === 1) throw new Error('afterInitialize boom')
      }
    }
    const storage = new FlakyStorage(driver, widgetSpec)

    await expect(storage.initialize()).rejects.toThrow('afterInitialize boom')
    // 关键在于没有被标成已就绪：下一次调用要重跑整条链路，而不是带着没建好的
    // 模式继续用下去
    expect(attempts).toBe(1)

    // 后续任何一次访问都会触发重试，这次能成
    await storage.setItem('w1', { name: 'ok' })
    expect((await storage.getItem('w1'))?.name).toBe('ok')
    expect(attempts).toBe(2)
    await driver.close()
  })

  test('close() rejects new work instead of queueing onto a dying connection', async () => {
    const driver = await makeDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()
    await storage.setItem('w1', { name: 'a' })

    await driver.close()

    await expect(driver.run('INSERT INTO widgets (id,name) VALUES (?,?)', ['w2', 'b'])).rejects.toThrow(/closing|closed/)
    await expect(driver.get('SELECT * FROM widgets', [])).rejects.toThrow(/closing|closed/)
  })

  test('concurrent close() calls share one shutdown', async () => {
    const driver = await makeDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    // 三个并发 close 不该各关一遍（第二次 close 原生连接会报错）
    await Promise.all([driver.close(), driver.close(), driver.close()])
    await expect(driver.get('SELECT 1', [])).rejects.toThrow(/closing|closed/)
  })

  test('in-flight writes finish before close() tears the connection down', async () => {
    const driver = await makeDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    // driver.run 是同步入队的，所以这三条在 close 发起前就已经在队列里了。
    // 经由 storage.setItem 会先 await ensureInitialized，那时 close 已经开始，
    // 属于「关闭后才到达」，应当被拒绝——那是另一个用例。
    const writes = [
      driver.run('INSERT INTO widgets (id,name) VALUES (?,?)', ['w1', 'a']),
      driver.run('INSERT INTO widgets (id,name) VALUES (?,?)', ['w2', 'b']),
      driver.run('INSERT INTO widgets (id,name) VALUES (?,?)', ['w3', 'c']),
    ]
    const closing = driver.close()
    await Promise.all(writes)
    await closing

    // 重新打开，确认三条都落盘了
    const reopened = new SqliteDriver(driver.dbPath)
    await reopened.ready()
    expect(await reopened.all('SELECT id FROM widgets', [])).toHaveLength(3)
    await reopened.close()
  })
})

describe('DriverRegistry', () => {
  test('concurrent init() opens exactly one set of drivers', async () => {
    const { DriverRegistry } = await import('./driver/registry')
    const registry = new DriverRegistry()
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-'))

    await Promise.all([
      registry.init({ dialect: 'sqlite', dataDir }),
      registry.init({ dialect: 'sqlite', dataDir }),
      registry.init({ dialect: 'sqlite', dataDir }),
    ])

    // 三个逻辑库、三个文件，绝不能因为并发多开一套
    expect(registry.listUnique()).toHaveLength(3)
    await registry.close()
  })

  test('a failed init() leaves nothing open and stays retryable', async () => {
    const { DriverRegistry } = await import('./driver/registry')
    const registry = new DriverRegistry()

    await expect(
      registry.init({ dialect: 'mysql' } as never)
    ).rejects.toThrow(/不支持的数据库方言/)

    expect(registry.isInitialized()).toBe(false)
    expect(registry.listUnique()).toHaveLength(0)

    // 修好之后应该还能正常初始化
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-retry-'))
    await registry.init({ dialect: 'sqlite', dataDir })
    expect(registry.isInitialized()).toBe(true)
    await registry.close()
  })

  test('close() is idempotent', async () => {
    const { DriverRegistry } = await import('./driver/registry')
    const registry = new DriverRegistry()
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-close-'))
    await registry.init({ dialect: 'sqlite', dataDir })

    await Promise.all([registry.close(), registry.close()])
    expect(registry.isInitialized()).toBe(false)
  })
})

describe('column reconciliation on upgrade', () => {
  test('adds columns that an older table is missing', async () => {
    const driver = await makeDriver()
    // 造一张「老版本」表：只有主键和 name，其余列都还不存在
    await driver.exec('CREATE TABLE widgets (id TEXT PRIMARY KEY, name TEXT NOT NULL)')
    await driver.run('INSERT INTO widgets (id, name) VALUES (?, ?)', ['old', 'legacy row'])

    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    const columns = await driver.all<{ name: string }>('PRAGMA table_info("widgets")', [])
    expect(columns.map(c => c.name).sort()).toEqual(['enabled', 'id', 'kind', 'name', 'payload', 'weight'])

    // 老行还在，而且现在能按当前 schema 正常写入——补列之前这里会报
    // "table widgets has no column named kind"
    await storage.setItem('new', { name: 'fresh', kind: 'a', weight: 3, enabled: true })
    expect(await storage.listItems()).toHaveLength(2)
    expect((await storage.getItem('old'))?.name).toBe('legacy row')
    expect((await storage.getItem('new'))?.kind).toBe('a')
    await driver.close()
  })

  test('a defaulted column keeps its default for pre-existing rows', async () => {
    const driver = await makeDriver()
    await driver.exec('CREATE TABLE widgets (id TEXT PRIMARY KEY, name TEXT NOT NULL)')
    await driver.run('INSERT INTO widgets (id, name) VALUES (?, ?)', ['old', 'legacy'])

    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()

    // weight 的 spec 默认值是 1，老行补列后应当拿到它
    const row = await driver.get<{ weight: number }>('SELECT weight FROM widgets WHERE id = ?', ['old'])
    expect(Number(row?.weight)).toBe(1)
    await driver.close()
  })

  test('reconciliation is a no-op on an already current table', async () => {
    const driver = await makeDriver()
    const storage = new SqlKvStorage<Widget>(driver, widgetSpec)
    await storage.initialize()
    await storage.setItem('w1', { name: 'a', kind: 'x' })

    // 第二个实例对着同一张表初始化，不该动任何东西
    const again = new SqlKvStorage<Widget>(driver, widgetSpec)
    await again.initialize()
    expect(await again.listItems()).toHaveLength(1)
    await driver.close()
  })
})
