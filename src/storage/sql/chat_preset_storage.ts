import { ChatPreset } from '../../channels/preset'
import { SendMessageOption } from '../../types'
import { SqlDriver } from '../driver/types'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from '../sql_storage'
import { stampTimestamps } from './shareable'
import { CHAT_PRESETS } from './tables'

const spec: TableSpec<ChatPreset> = {
  table: CHAT_PRESETS.table,
  columns: CHAT_PRESETS.columns,
  indexes: [{ columns: ['prefix'] }, { columns: ['name'] }],
  filterable: ['id', 'name', 'description', 'prefix', 'namespace', 'cloudId', 'local', 'embedded'],
  boolean: ['local', 'embedded'],
  toRecord(preset, id) {
    const {
      id: _ignored, name, description, prefix, local, namespace,
      sendMessageOption, cloudId, createdAt, updatedAt, md5,
      embedded, uploader, ...rest
    } = preset as ChatPreset & Record<string, unknown>

    return {
      id,
      name: name || '',
      description: description || '',
      prefix: prefix || '',
      // 历史行为：只有显式 false 才存 0
      local: local === false ? 0 : 1,
      namespace: namespace || null,
      sendMessageOption: JSON.stringify(sendMessageOption || {}),
      cloudId: cloudId || null,
      createdAt: createdAt || '',
      updatedAt: updatedAt || '',
      md5: md5 || '',
      embedded: embedded ? 1 : 0,
      uploader: stringifyJson(uploader),
      extraData: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
    }
  },
  fromRecord(record) {
    if (!record) return null
    return new ChatPreset({
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      prefix: record.prefix as string,
      local: Boolean(record.local),
      namespace: record.namespace as string,
      sendMessageOption: parseJson(record.sendMessageOption, {}) as SendMessageOption,
      cloudId: record.cloudId as unknown as string,
      createdAt: record.createdAt as string,
      updatedAt: record.updatedAt as string,
      md5: record.md5 as string,
      embedded: Boolean(record.embedded),
      uploader: parseJson(record.uploader, undefined),
      ...parseJson<Record<string, unknown>>(record.extraData, {}),
    })
  },
}

export class SqlChatPresetStorage extends SqlKvStorage<ChatPreset> {
  constructor(driver: SqlDriver) {
    super(driver, spec)
  }

  getName(): string {
    return 'SqlChatPresetStorage'
  }

  async setItem(id: string, preset: ChatPreset): Promise<string> {
    stampTimestamps(preset)
    return super.setItem(id, preset)
  }

  async getPresetByPrefix(prefix: string): Promise<ChatPreset | null> {
    await this.ensureInitialized()
    const row = await this.driver.get(`SELECT * FROM ${this.q(this.table)} WHERE ${this.q('prefix')} = ?`, [prefix])
    return row ? spec.fromRecord(row) : null
  }
}

export { spec as chatPresetSpec }
