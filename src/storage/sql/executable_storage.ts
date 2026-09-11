import { ToolDTO } from '../../types/tools'
import { TriggerDTO } from '../../types/trigger'
import { ColumnSpec, ColumnTypeName, SqlDriver } from '../driver/types'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from '../sql_storage'
import { SHAREABLE_COLUMNS, stampTimestamps } from './shareable'

/**
 * 工具和触发器的表结构除了 isOneTime 之外完全一样，序列化逻辑也一样。
 * 与其抄两遍，不如把共同部分参数化——这正是整个改造要消灭的那种重复。
 */
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

const EXECUTABLE_FILTERABLE = [
  'id', 'name', 'description', 'modelType', 'cloudId', 'md5', 'status', 'permission', 'embedded',
]

interface ExecutableLike {
  id?: string
  name?: string
  description?: string
  modelType?: string
  code?: string
  cloudId?: string
  createdAt?: string
  updatedAt?: string
  md5?: string
  embedded?: boolean
  uploader?: unknown
  status?: string
  permission?: string
}

function writeExecutable(entity: ExecutableLike & Record<string, unknown>, id: string, defaultModelType: string) {
  const {
    id: _ignored, name, description, modelType, code, cloudId,
    embedded, uploader, createdAt, updatedAt, md5,
    status, permission, isOneTime: _isOneTime, ...rest
  } = entity

  return {
    record: {
      id,
      name: name || '',
      description: description || '',
      modelType: modelType || defaultModelType,
      code: code || null,
      cloudId: cloudId || null,
      embedded: embedded ? 1 : 0,
      uploader: stringifyJson(uploader),
      createdAt: createdAt || '',
      updatedAt: updatedAt || '',
      md5: md5 || '',
      status: status || 'enabled',
      permission: permission || 'public',
    },
    rest,
  }
}

function readExecutable(record: Record<string, unknown>) {
  return {
    id: record.id as string,
    name: record.name as string,
    description: record.description as string,
    modelType: record.modelType as 'settings' | 'executable' | undefined,
    code: record.code as string,
    cloudId: record.cloudId as unknown as string,
    embedded: Boolean(record.embedded),
    uploader: parseJson(record.uploader, undefined),
    createdAt: record.createdAt as string,
    updatedAt: record.updatedAt as string,
    md5: record.md5 as string,
    status: record.status as 'enabled' | 'disabled',
    permission: record.permission as 'public' | 'private' | 'onetime',
    ...parseJson<Record<string, unknown>>(record.extraData, {}),
  }
}

const toolsSpec: TableSpec<ToolDTO> = {
  table: 'tools',
  columns: { ...EXECUTABLE_COLUMNS, extraData: { type: 'json' } },
  indexes: [
    { columns: ['name'], name: 'idx_tools_name' },
    { columns: ['status'], name: 'idx_tools_status' },
    { columns: ['permission'], name: 'idx_tools_permission' },
  ],
  filterable: EXECUTABLE_FILTERABLE,
  boolean: ['embedded'],
  toRecord(tool, id) {
    const { record, rest } = writeExecutable(tool as ToolDTO & Record<string, unknown>, id, '')
    return { ...record, extraData: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null }
  },
  fromRecord(record) {
    if (!record) return null
    return new ToolDTO(readExecutable(record))
  },
}

const triggerSpec: TableSpec<TriggerDTO> = {
  table: 'triggers',
  columns: { ...EXECUTABLE_COLUMNS, isOneTime: { type: 'bool' }, extraData: { type: 'json' } },
  indexes: [
    { columns: ['name'], name: 'idx_triggers_name' },
    { columns: ['status'], name: 'idx_triggers_status' },
  ],
  filterable: [...EXECUTABLE_FILTERABLE, 'isOneTime'],
  boolean: ['embedded', 'isOneTime'],
  toRecord(trigger, id) {
    const { record, rest } = writeExecutable(trigger as TriggerDTO & Record<string, unknown>, id, 'executable')
    return {
      ...record,
      isOneTime: trigger.isOneTime ? 1 : 0,
      extraData: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
    }
  },
  fromRecord(record) {
    if (!record) return null
    return new TriggerDTO({ ...readExecutable(record), isOneTime: Boolean(record.isOneTime) })
  },
}

export class SqlToolsStorage extends SqlKvStorage<ToolDTO> {
  constructor(driver: SqlDriver) {
    super(driver, toolsSpec)
  }

  getName(): string {
    return 'SqlToolsStorage'
  }

  async setItem(id: string, tool: ToolDTO): Promise<string> {
    stampTimestamps(tool)
    return super.setItem(id, tool)
  }
}

export class SqlTriggerStorage extends SqlKvStorage<TriggerDTO> {
  constructor(driver: SqlDriver) {
    super(driver, triggerSpec)
  }

  getName(): string {
    return 'SqlTriggerStorage'
  }

  async setItem(id: string, trigger: TriggerDTO): Promise<string> {
    stampTimestamps(trigger)
    return super.setItem(id, trigger)
  }
}

export { toolsSpec, triggerSpec }
