import { ColumnSpec, ColumnTypeName, IndexColumn, IndexOptions, LogicalDatabase } from '../driver/types'

/**
 * 表的形状：表名、列、主键、所属逻辑库。
 *
 * 刻意和序列化逻辑分开放。toRecord/fromRecord 要 import DTO 类，而那条链会经由
 * types -> core -> 包入口绕回 storage，形成模块环；迁移工具只需要知道表长什么样，
 * 没有理由被卷进去。分开之后这里也成了列定义的唯一出处，storage 和迁移工具各取
 * 所需，不会各写一份然后慢慢漂移。
 */

export interface TableShape {
  database: LogicalDatabase
  table: string
  keyColumn: string
  columns: Record<string, ColumnSpec | ColumnTypeName>
  /**
   * upsert 依赖的唯一约束。
   *
   * 只有 keyColumn 不是主键时才需要——user_states 的业务主键是 userId，而 id
   * 是代理主键，ON CONFLICT(userId) 必须有唯一索引兜底。迁移工具建完表也要照建，
   * 否则往新库里搬数据时会直接报「no unique or exclusion constraint matching
   * the ON CONFLICT specification」。
   */
  uniqueIndex?: IndexOptions & { columns: IndexColumn[] }
}

/** 可分享实体共有的那组列（渠道、预设、工具、处理器、触发器）。 */
export const SHAREABLE_COLUMNS: Record<string, ColumnSpec | ColumnTypeName> = {
  cloudId: { type: 'int' },
  createdAt: { type: 'text' },
  updatedAt: { type: 'text' },
  md5: { type: 'text' },
  embedded: { type: 'bool', default: 0 },
  uploader: { type: 'json' },
}

/** 工具和触发器除 isOneTime 外结构完全一致。 */
const EXECUTABLE_COLUMNS: Record<string, ColumnSpec | ColumnTypeName> = {
  id: { type: 'text', pk: true },
  name: { type: 'text', notNull: true },
  description: { type: 'text' },
  modelType: { type: 'text' },
  code: { type: 'text' },
  status: { type: 'text' },
  permission: { type: 'text' },
  ...SHAREABLE_COLUMNS,
}

export const CHANNELS: TableShape = {
  database: 'main',
  table: 'channels',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    adapterType: { type: 'text', notNull: true },
    type: { type: 'text', notNull: true },
    weight: { type: 'int', default: 1 },
    priority: { type: 'int', default: 0 },
    status: { type: 'text', default: 'enabled' },
    disabledReason: { type: 'text' },
    models: { type: 'json' },
    options: { type: 'json' },
    statistics: { type: 'json' },
    ...SHAREABLE_COLUMNS,
    extra: { type: 'json' },
  },
}

export const CHAT_PRESETS: TableShape = {
  database: 'main',
  table: 'chat_presets',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    prefix: { type: 'text', notNull: true },
    local: { type: 'bool', default: 1 },
    namespace: { type: 'text' },
    sendMessageOption: { type: 'json', notNull: true },
    ...SHAREABLE_COLUMNS,
    extraData: { type: 'json' },
  },
}

export const TOOLS: TableShape = {
  database: 'main',
  table: 'tools',
  keyColumn: 'id',
  columns: { ...EXECUTABLE_COLUMNS, extraData: { type: 'json' } },
}

export const TRIGGERS: TableShape = {
  database: 'main',
  table: 'triggers',
  keyColumn: 'id',
  columns: { ...EXECUTABLE_COLUMNS, isOneTime: { type: 'bool' }, extraData: { type: 'json' } },
}

export const PROCESSORS: TableShape = {
  database: 'main',
  table: 'processors',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    type: { type: 'text', notNull: true },
    code: { type: 'text' },
    ...SHAREABLE_COLUMNS,
    extraData: { type: 'json' },
  },
}

export const TOOLS_GROUPS: TableShape = {
  database: 'main',
  table: 'tools_groups',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    toolIds: { type: 'json', notNull: true },
    isDefault: { type: 'bool', default: 0 },
    createdAt: { type: 'text' },
    updatedAt: { type: 'text' },
  },
}

export const USER_STATES: TableShape = {
  database: 'main',
  table: 'user_states',
  // 业务主键是 userId，id 只是个随机 UUID 代理键
  keyColumn: 'userId',
  uniqueIndex: { columns: ['userId'], name: 'uniq_user_states_userId', unique: true },
  columns: {
    id: { type: 'text', pk: true },
    userId: { type: 'text', notNull: true },
    nickname: { type: 'text' },
    card: { type: 'text' },
    conversations: { type: 'json', notNull: true },
    settings: { type: 'json', notNull: true },
    current: { type: 'json', notNull: true },
    updatedAt: { type: 'bigint' },
  },
}

export const MCP_SERVERS: TableShape = {
  database: 'main',
  table: 'mcp_servers',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    enabled: { type: 'bool', notNull: true, default: 1 },
    updatedAt: { type: 'bigint', notNull: true },
    payload: { type: 'json', notNull: true },
  },
}

export const HISTORY: TableShape = {
  database: 'history',
  table: 'history',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    parentId: { type: 'text' },
    conversationId: { type: 'text' },
    role: { type: 'text' },
    messageData: { type: 'json' },
    createdAt: { type: 'text' },
  },
}

export const OPERATION_LOGS: TableShape = {
  database: 'operation_logs',
  table: 'operation_logs',
  keyColumn: 'id',
  columns: {
    id: { type: 'text', pk: true },
    timestamp: { type: 'bigint', notNull: true },
    type: { type: 'text', notNull: true },
    level: { type: 'text', notNull: true },
    userId: { type: 'text' },
    groupId: { type: 'text' },
    channelId: { type: 'text' },
    model: { type: 'text' },
    presetId: { type: 'text' },
    payload: { type: 'json', notNull: true },
  },
}

/** chaite 自己管的全部表。宿主有额外的表可以自己追加。 */
export const CHAITE_TABLES: TableShape[] = [
  CHANNELS, CHAT_PRESETS, TOOLS, TRIGGERS, PROCESSORS,
  TOOLS_GROUPS, USER_STATES, MCP_SERVERS, HISTORY, OPERATION_LOGS,
]
