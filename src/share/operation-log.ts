import * as crypto from 'node:crypto'
import type {
  ListLogsFilter,
  LogsPage,
  LogsStats,
  OperationLog,
  OperationLogLevel,
  OperationLogType,
} from '../types/operation-log'
import type { BasicStorage } from '../types/storage'

/** Default max entries kept in memory when no external storage is provided */
const DEFAULT_MAX_IN_MEMORY = 5000

/**
 * Manages operation logs for the AI system.
 *
 * By default stores up to `maxInMemory` recent entries in a ring buffer.
 * Optionally accepts a `BasicStorage<OperationLog>` for durable persistence —
 * when provided, all writes go to storage and reads query from there.
 *
 * Attach to Chaite via `chaite.setOperationLogManager(mgr)` to activate
 * event-based logging of jobs, plans, and tool calls.
 */
export class OperationLogManager {
  private readonly memBuf: OperationLog[] = []
  private readonly maxInMemory: number

  constructor(
    private readonly storage?: BasicStorage<OperationLog>,
    maxInMemory: number = DEFAULT_MAX_IN_MEMORY,
  ) {
    this.maxInMemory = maxInMemory
  }

  // ─── Write ────────────────────────────────────────────────────────────────

  async add(entry: Omit<OperationLog, 'id' | 'timestamp'> & Partial<Pick<OperationLog, 'id' | 'timestamp'>>): Promise<OperationLog> {
    const log: OperationLog = {
      id: entry.id ?? crypto.randomUUID(),
      timestamp: entry.timestamp ?? Date.now(),
      ...entry,
    }

    if (this.storage) {
      try {
        await this.storage.setItem(log.id, log)
      }
      catch {
        // storage failure should never break the main flow — fall through to memory
        this.pushMemory(log)
      }
    }
    else {
      this.pushMemory(log)
    }

    return log
  }

  /** Convenience: add a log entry synchronously (fire-and-forget, swallows errors) */
  addSync(entry: Omit<OperationLog, 'id' | 'timestamp'> & Partial<Pick<OperationLog, 'id' | 'timestamp'>>): void {
    this.add(entry).catch(() => {})
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async list(filter: ListLogsFilter = {}): Promise<LogsPage> {
    const {
      page = 1,
      pageSize = 50,
      type,
      level,
      userId,
      groupId,
      channelId,
      model,
      presetId,
      toolName,
      processorName,
      triggerName,
      from,
      to,
      keyword,
    } = filter

    let items: OperationLog[]

    if (this.storage) {
      items = await this.storage.listItems()
    }
    else {
      items = [...this.memBuf]
    }

    // Sort newest first
    items.sort((a, b) => b.timestamp - a.timestamp)

    // Apply filters
    if (type) items = items.filter(l => l.type === type)
    if (level) items = items.filter(l => l.level === level)
    if (userId) items = items.filter(l => l.userId === userId)
    if (groupId) items = items.filter(l => l.groupId === groupId)
    if (channelId) items = items.filter(l => l.channelId === channelId)
    if (model) items = items.filter(l => l.model === model)
    if (presetId) items = items.filter(l => l.presetId === presetId)
    if (toolName) items = items.filter(l => l.toolName === toolName)
    if (processorName) items = items.filter(l => l.processorName === processorName)
    if (triggerName) items = items.filter(l => l.triggerName === triggerName)
    if (from) items = items.filter(l => l.timestamp >= from)
    if (to) items = items.filter(l => l.timestamp <= to)
    if (keyword) {
      const kw = keyword.toLowerCase()
      items = items.filter(l =>
        l.summary.toLowerCase().includes(kw)
        || (l.detail ?? '').toLowerCase().includes(kw)
        || (l.toolName ?? '').toLowerCase().includes(kw)
        || (l.model ?? '').toLowerCase().includes(kw)
        || (l.channelName ?? '').toLowerCase().includes(kw)
        || (l.presetName ?? '').toLowerCase().includes(kw)
        || (l.processorName ?? '').toLowerCase().includes(kw)
        || (l.triggerName ?? '').toLowerCase().includes(kw)
      )
    }

    const total = items.length
    const start = (page - 1) * pageSize
    return {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    }
  }

  async getStats(): Promise<LogsStats> {
    let items: OperationLog[]
    if (this.storage) {
      items = await this.storage.listItems()
    }
    else {
      items = [...this.memBuf]
    }

    const now = Date.now()
    const h24ago = now - 24 * 60 * 60 * 1000

    const byType: Partial<Record<OperationLogType, number>> = {}
    const byLevel: Record<OperationLogLevel, number> = { info: 0, warn: 0, error: 0 }
    let last24h = 0
    let llmDurationSum = 0
    let llmDurationCount = 0
    let totalTokens = 0
    let inputTokens = 0
    let outputTokens = 0
    let cachedTokens = 0
    let reasoningTokens = 0
    let errorCount = 0
    const byChannel: Record<string, number> = {}
    const byModel: Record<string, number> = {}
    const byPreset: Record<string, number> = {}

    for (const l of items) {
      byType[l.type] = (byType[l.type] ?? 0) + 1
      byLevel[l.level] = (byLevel[l.level] ?? 0) + 1
      if (l.level === 'error') errorCount++
      if (l.timestamp >= h24ago) last24h++
      if (l.type === 'llm.call' && l.durationMs != null) {
        llmDurationSum += l.durationMs
        llmDurationCount++
      }
      inputTokens += l.inputTokens ?? 0
      outputTokens += l.outputTokens ?? 0
      cachedTokens += l.cachedTokens ?? 0
      reasoningTokens += l.reasoningTokens ?? 0
      totalTokens += l.totalTokens ?? ((l.inputTokens ?? 0) + (l.outputTokens ?? 0))
      if (l.channelId || l.channelName) {
        const key = l.channelName || l.channelId!
        byChannel[key] = (byChannel[key] ?? 0) + 1
      }
      if (l.model) byModel[l.model] = (byModel[l.model] ?? 0) + 1
      if (l.presetId || l.presetName) {
        const key = l.presetName || l.presetId!
        byPreset[key] = (byPreset[key] ?? 0) + 1
      }
    }

    return {
      total: items.length,
      byType,
      byLevel,
      last24h,
      avgLlmDurationMs: llmDurationCount > 0 ? Math.round(llmDurationSum / llmDurationCount) : 0,
      totalTokens,
      inputTokens,
      outputTokens,
      cachedTokens,
      reasoningTokens,
      errorRate: items.length ? errorCount / items.length : 0,
      byChannel,
      byModel,
      byPreset,
    }
  }

  async clear(filter?: Pick<ListLogsFilter, 'type' | 'level' | 'userId' | 'from' | 'to'>): Promise<number> {
    let count = 0

    if (!filter || Object.keys(filter).length === 0) {
      // Clear everything
      if (this.storage) {
        const all = await this.storage.listItems()
        for (const l of all) {
          await this.storage.removeItem(l.id)
          count++
        }
      }
      else {
        count = this.memBuf.length
        this.memBuf.splice(0)
      }
      return count
    }

    // Selective clear
    if (this.storage) {
      const all = await this.storage.listItems()
      for (const l of all) {
        if (this.matchesFilter(l, filter)) {
          await this.storage.removeItem(l.id)
          count++
        }
      }
    }
    else {
      const before = this.memBuf.length
      const keep = this.memBuf.filter(l => !this.matchesFilter(l, filter))
      this.memBuf.splice(0, this.memBuf.length, ...keep)
      count = before - this.memBuf.length
    }

    return count
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private pushMemory(log: OperationLog): void {
    this.memBuf.push(log)
    if (this.memBuf.length > this.maxInMemory) {
      // Trim oldest 10% to avoid repeated splicing overhead
      const trimCount = Math.ceil(this.maxInMemory * 0.1)
      this.memBuf.splice(0, trimCount)
    }
  }

  private matchesFilter(l: OperationLog, f: Pick<ListLogsFilter, 'type' | 'level' | 'userId' | 'from' | 'to'>): boolean {
    if (f.type && l.type !== f.type) return false
    if (f.level && l.level !== f.level) return false
    if (f.userId && l.userId !== f.userId) return false
    if (f.from && l.timestamp < f.from) return false
    if (f.to && l.timestamp > f.to) return false
    return true
  }
}
