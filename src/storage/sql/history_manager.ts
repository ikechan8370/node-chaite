import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { AbstractHistoryManager } from '../../types/adapter'
import { HistoryMessage } from '../../types/models'
import { SqlDriver } from '../driver/types'
import { isBase64Image } from './base64_image'
import { log } from '../logger'

interface HistoryRecord {
  id: string
  parentId: string | null
  conversationId: string
  role: string
  messageData: string
  createdAt: string
}

/**
 * 处理图片时用的宽松视图。MessageContent 是个联合类型，而这里要就地改写
 * item.image，用联合类型会被窄化规则挡住，所以本地放宽再转回去。
 */
type MutableMessage = Omit<HistoryMessage, 'content'> & { content: ImageContentItem[] }

interface ImageContentItem {
  type?: string
  image?: string
  mimeType?: string
  text?: string
  _type?: string
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
}

const IMAGE_REF = /^\$image:([a-f0-9]+):(\.[a-z]+)$/

/**
 * 前缀的下一个字符串，用于把「以 prefix 开头」表达成范围比较。
 *
 * 用范围而不是 LIKE 'prefix%'：LIKE 能不能走索引取决于 case_sensitive_like
 * 之类的设置，范围比较则一定能用上 conversationId 索引。
 */
function nextPrefix(prefix: string): string {
  const last = prefix.charCodeAt(prefix.length - 1)
  return prefix.slice(0, -1) + String.fromCharCode(last + 1)
}

export interface PruneOptions {
  before: string
  conversationPrefix?: string
  batchSize?: number
  maxBatches?: number
}

/**
 * 基于 SQL 的对话历史。
 *
 * 和其他 storage 不同，它实现的是 AbstractHistoryManager 而不是 ChaiteStorage，
 * 而且还要把消息里的 base64 图片落盘换成引用——历史库是最大的一张表，把几 MB 的
 * 图片塞进行里会让它迅速膨胀到几百 MB。
 */
export class SqlHistoryManager extends AbstractHistoryManager {
  name = 'SqlHistoryManager'

  readonly driver: SqlDriver
  readonly imagesDir: string
  readonly table = 'history'

  /**
   * 保留期清理按 createdAt 过滤，没有索引就是全表扫描。但在已经很大的历史表上
   * 建索引可能要好几秒，不该卡住升级后的第一条消息，所以放到后台用 low 优先级
   * 建——实时对话的写入会插在前面，建好之前清理只是慢一点，不影响正确性。
   * 暴露成 promise，便于测试和清理流程在需要时等待。
   */
  createdAtIndexReady?: Promise<void>

  private initialized = false
  private initPromise: Promise<void> | null = null

  constructor(driver: SqlDriver, imagesDir: string) {
    super()
    this.driver = driver
    this.imagesDir = imagesDir
  }

  private q(name: string): string {
    return this.driver.dialect.quoteId(name)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      const dialect = this.driver.dialect
      fs.mkdirSync(this.imagesDir, { recursive: true })

      await this.driver.exec(
        dialect.createTable(this.table, {
          id: { type: 'text', pk: true },
          parentId: { type: 'text' },
          conversationId: { type: 'text' },
          role: { type: 'text' },
          messageData: { type: 'json' },
          createdAt: { type: 'text' },
        }),
      )
      await this.driver.exec(
        dialect.createIndex(this.table, ['conversationId'], { name: 'idx_history_conversation' }),
      )
      await this.driver.exec(dialect.createIndex(this.table, ['parentId'], { name: 'idx_history_parent' }))
      this.initialized = true

      this.createdAtIndexReady = this.driver
        .exec(dialect.createIndex(this.table, ['createdAt'], { name: 'idx_history_created' }), {
          priority: 'low',
          label: 'create createdAt index',
        })
        .catch((error: unknown) => {
          log().warn(
            `[History] failed to create createdAt index: ${error instanceof Error ? error.message : String(error)}`,
          )
        })
    })().catch((error: unknown) => {
      this.initPromise = null
      throw error
    })

    return this.initPromise
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize()
  }

  private getMd5(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex')
  }

  private getMimeTypeFromBase64(base64: string, defaultMimeType = 'image/jpeg'): string {
    if (base64 && base64.startsWith('data:image/')) {
      const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/)
      if (match) return match[1]
    }
    // 纯 base64 字符串没有类型信息，用调用方给的默认值
    return defaultMimeType
  }

  private getExtensionFromMimeType(mimeType: string): string {
    return MIME_EXTENSIONS[mimeType] || '.png'
  }

  /** 把消息里的 base64 图片落盘，行里只留 `$image:md5:ext` 引用。 */
  private processMessageImages(message: HistoryMessage): HistoryMessage {
    if (!message.content || !Array.isArray(message.content)) return message

    const processed = JSON.parse(JSON.stringify(message)) as MutableMessage
    processed.content = processed.content.map((item: ImageContentItem) => {
      if (item.type !== 'image' || !item.image || !isBase64Image(item.image)) return item

      let base64Data = item.image
      let mimeType = item.mimeType || 'image/jpeg'

      if (base64Data.startsWith('data:')) {
        const parts = base64Data.split(',')
        if (parts.length > 1) {
          base64Data = parts[1]
          mimeType = this.getMimeTypeFromBase64(item.image, mimeType)
        }
      }

      try {
        const md5 = this.getMd5(base64Data)
        const ext = this.getExtensionFromMimeType(mimeType)
        const filePath = path.join(this.imagesDir, `${md5}${ext}`)
        // 同一张图只落一次盘
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
        }
        item.image = `$image:${md5}:${ext}`
        item._type = mimeType
      } catch (error) {
        log().warn(`[History] 保存图片失败: ${error instanceof Error ? error.message : String(error)}`)
      }
      return item
    })

    return processed as unknown as HistoryMessage
  }

  /** 把 `$image:md5:ext` 引用读回 base64；文件没了就把这一项去掉并补上 [图片]。 */
  private restoreMessageImages(message: HistoryMessage): HistoryMessage {
    if (!message || !message.content || !Array.isArray(message.content)) return message

    const restored = JSON.parse(JSON.stringify(message)) as MutableMessage
    let needImageText = true
    let hasRemovedImage = false

    restored.content = restored.content.filter((item: ImageContentItem) => {
      if (item.type === 'image' && typeof item.image === 'string') {
        const match = item.image.match(IMAGE_REF)
        if (match) {
          const filePath = path.join(this.imagesDir, `${match[1]}${match[2]}`)
          if (!fs.existsSync(filePath)) {
            hasRemovedImage = true
            return false
          }
          try {
            item.image = fs.readFileSync(filePath).toString('base64')
            return true
          } catch (error) {
            log().warn(
              `[History] 读取图片文件失败 ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
            )
            hasRemovedImage = true
            return false
          }
        }
      }
      if (item.type === 'text') needImageText = false
      return true
    })

    if (hasRemovedImage) {
      if (restored.content.length === 0) {
        restored.content.push({ type: 'text', text: '[图片]' })
      } else if (needImageText) {
        const textIndex = restored.content.findIndex((item: ImageContentItem) => item.type === 'text')
        if (textIndex !== -1) {
          restored.content[textIndex].text = `[图片] ${restored.content[textIndex].text}`
        } else {
          restored.content.unshift({ type: 'text', text: '[图片]' })
        }
      }
    }

    return restored as unknown as HistoryMessage
  }

  private messageToRecord(message: HistoryMessage, conversationId: string): HistoryRecord {
    const processed = this.processMessageImages(message)
    const { id, parentId, role } = processed as HistoryMessage & { parentId?: string }
    return {
      id: id || '',
      parentId: parentId || null,
      conversationId: conversationId || '',
      role: role || '',
      messageData: JSON.stringify(processed),
      createdAt: new Date().toISOString(),
    }
  }

  private recordToMessage(record: Record<string, unknown> | undefined): HistoryMessage | null {
    if (!record) return null
    try {
      return this.restoreMessageImages(JSON.parse(String(record.messageData)) as HistoryMessage)
    } catch {
      // 解析失败就尽量给个最小结构，别让整个会话读不出来
      return {
        id: record.id,
        parentId: record.parentId,
        role: record.role,
        conversationId: record.conversationId,
        content: [],
      } as unknown as HistoryMessage
    }
  }

  private upsertSql(): string {
    const fields = ['id', 'parentId', 'conversationId', 'role', 'messageData', 'createdAt']
    return this.driver.dialect.upsert(this.table, fields, 'id')
  }

  private recordValues(record: HistoryRecord): unknown[] {
    return [record.id, record.parentId, record.conversationId, record.role, record.messageData, record.createdAt]
  }

  async saveHistory(message: HistoryMessage, conversationId: string): Promise<void> {
    await this.ensureInitialized()
    const record = this.messageToRecord(message, conversationId)
    await this.driver.run(this.upsertSql(), this.recordValues(record), {
      priority: 'high',
      label: 'save history message',
    })
  }

  /** 批量保存走一个事务，避免多条消息逐条 autocommit。 */
  async saveHistories(messages: HistoryMessage[], conversationId: string): Promise<void> {
    await this.ensureInitialized()
    if (!messages || messages.length === 0) return

    const records = messages.map(message => this.messageToRecord(message, conversationId))
    const sql = this.upsertSql()
    await this.driver.transaction(
      async transaction => {
        for (const record of records) {
          await transaction.run(sql, this.recordValues(record))
        }
      },
      { priority: 'high', label: `save ${records.length} history messages` },
    )
  }

  async getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]> {
    await this.ensureInitialized()
    if (messageId) return this.getMessageChain(messageId)
    if (conversationId) return this.getConversationMessages(conversationId)
    return []
  }

  /** 从指定消息沿 parentId 追溯到根。 */
  private async getMessageChain(messageId: string): Promise<HistoryMessage[]> {
    const messages: HistoryMessage[] = []
    // parentId 理论上不该成环，但一条坏数据就能让这里无限循环，所以带个访问集合
    const visited = new Set<string>()
    let currentId: string | null = messageId

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      const row: Record<string, unknown> | undefined = await this.driver.get(
        `SELECT * FROM ${this.q(this.table)} WHERE ${this.q('id')} = ?`,
        [currentId],
      )
      if (!row) break
      const message = this.recordToMessage(row)
      if (message) messages.unshift(message)
      currentId = (row.parentId as string) || null
    }

    if (currentId && visited.has(currentId)) {
      log().warn(`[History] detected a parentId cycle at ${currentId}, truncating the chain`)
    }
    return messages
  }

  private async getConversationMessages(conversationId: string): Promise<HistoryMessage[]> {
    const rows = await this.driver.all(
      `SELECT * FROM ${this.q(this.table)} WHERE ${this.q('conversationId')} = ? ORDER BY ${this.q('createdAt')}`,
      [conversationId],
    )
    return rows.map(row => this.recordToMessage(row)).filter((m): m is HistoryMessage => Boolean(m))
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.ensureInitialized()
    await this.driver.run(`DELETE FROM ${this.q(this.table)} WHERE ${this.q('conversationId')} = ?`, [conversationId])
  }

  /** 删一条消息但不断链：先把它的直接子节点改挂到它的父节点上。 */
  async removeHistory(messageId: string, conversationId: string): Promise<void> {
    await this.ensureInitialized()
    await this.driver.transaction(
      async transaction => {
        const row = await transaction.get<{ parentId: string | null }>(
          `SELECT ${this.q('parentId')} FROM ${this.q(this.table)}
           WHERE ${this.q('id')} = ? AND ${this.q('conversationId')} = ?`,
          [messageId, conversationId],
        )
        if (!row) return
        await transaction.run(
          `UPDATE ${this.q(this.table)} SET ${this.q('parentId')} = ?
           WHERE ${this.q('conversationId')} = ? AND ${this.q('parentId')} = ?`,
          [row.parentId || null, conversationId, messageId],
        )
        await transaction.run(
          `DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} = ? AND ${this.q('conversationId')} = ?`,
          [messageId, conversationId],
        )
      },
      { priority: 'high', label: 'remove history message' },
    )
  }

  async getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined> {
    await this.ensureInitialized()
    const conditions: string[] = []
    const params: unknown[] = []

    if (messageId) {
      conditions.push(`${this.q('id')} = ?`)
      params.push(messageId)
    }
    if (conversationId) {
      conditions.push(`${this.q('conversationId')} = ?`)
      params.push(conversationId)
    }
    if (conditions.length === 0) return undefined

    const row = await this.driver.get(
      `SELECT * FROM ${this.q(this.table)} WHERE ${conditions.join(' AND ')} LIMIT 1`,
      params,
    )
    return this.recordToMessage(row) ?? undefined
  }

  private buildPruneFilter(before: string, conversationPrefix: string) {
    const conditions = [`${this.q('createdAt')} < ?`]
    const params: unknown[] = [before]
    if (conversationPrefix) {
      conditions.push(`${this.q('conversationId')} >= ?`, `${this.q('conversationId')} < ?`)
      params.push(conversationPrefix, nextPrefix(conversationPrefix))
    }
    return { where: conditions.join(' AND '), params }
  }

  async countHistoryBefore({ before, conversationPrefix = '' }: { before: string, conversationPrefix?: string }): Promise<number> {
    await this.ensureInitialized()
    if (!before) return 0
    const { where, params } = this.buildPruneFilter(before, conversationPrefix)
    const row = await this.driver.get<{ count: number }>(
      `SELECT COUNT(*) AS "count" FROM ${this.q(this.table)} WHERE ${where}`,
      params,
    )
    return Number(row?.count || 0)
  }

  /**
   * 按保留期删除历史消息。
   *
   * 分批删而不是一条 DELETE 干掉几十万行：单条大 DELETE 会长时间占住写连接，
   * 期间所有对话的写入都要排队。批次走 low 优先级，让实时对话的写入插在前面。
   */
  async pruneHistory({
    before,
    conversationPrefix = '',
    batchSize = 2000,
    maxBatches = 500,
  }: PruneOptions): Promise<{ deleted: number, truncated: boolean }> {
    await this.ensureInitialized()
    if (!before) return { deleted: 0, truncated: false }

    const { where, params } = this.buildPruneFilter(before, conversationPrefix)
    const sql = `DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} IN (
      SELECT ${this.q('id')} FROM ${this.q(this.table)} WHERE ${where} LIMIT ?
    )`

    let deleted = 0
    for (let batch = 0; batch < maxBatches; batch++) {
      const result = await this.driver.run(sql, [...params, batchSize], {
        priority: 'low',
        label: 'prune history',
      })
      const changes = result?.changes || 0
      deleted += changes
      if (changes < batchSize) return { deleted, truncated: false }
    }
    // 还没删完，剩下的留给下一次，避免一次任务跑太久
    return { deleted, truncated: true }
  }

  /** 删掉已经没有任何消息引用的图片文件。 */
  async cleanupUnusedImages(): Promise<{ deleted: number, total: number }> {
    await this.ensureInitialized()
    const rows = await this.driver.all<{ messageData: string }>(
      `SELECT ${this.q('messageData')} FROM ${this.q(this.table)}`,
      [],
    )

    const usedImageRefs = new Set<string>()
    for (const row of rows) {
      try {
        const message = JSON.parse(row.messageData) as { content?: ImageContentItem[] }
        if (!Array.isArray(message.content)) continue
        for (const item of message.content) {
          if (item.type === 'image' && typeof item.image === 'string') {
            const match = item.image.match(IMAGE_REF)
            if (match) usedImageRefs.add(`${match[1]}${match[2]}`)
          }
        }
      } catch {
        // 单条坏数据不该让整次清理失败
      }
    }

    const files = fs.readdirSync(this.imagesDir)
    let deleted = 0
    for (const file of files) {
      if (!usedImageRefs.has(file)) {
        fs.unlinkSync(path.join(this.imagesDir, file))
        deleted++
      }
    }
    return { deleted, total: files.length }
  }

  /** 连接归 DriverRegistry 管，这里不关。 */
  async close(): Promise<void> {}
}
