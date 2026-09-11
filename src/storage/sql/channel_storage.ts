import { Channel } from '../../channels/channels'
import { SqlDriver } from '../driver/types'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from '../sql_storage'
import { SHAREABLE_COLUMNS, stampTimestamps } from './shareable'

const spec: TableSpec<Channel> = {
  table: 'channels',
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
  indexes: [{ columns: ['type'] }, { columns: ['status'] }],
  filterable: [
    'id', 'name', 'description', 'adapterType', 'type', 'status', 'cloudId', 'weight', 'priority', 'embedded',
  ],
  numeric: ['weight', 'priority'],
  boolean: ['embedded'],
  toRecord(channel, id) {
    const {
      id: _ignored, name, description, adapterType, type, weight, priority,
      status, disabledReason, models, options, statistics,
      uploader, cloudId, createdAt, updatedAt, md5, embedded, ...rest
    } = channel as Channel & Record<string, unknown>

    return {
      id,
      name: name || '',
      description: description || '',
      adapterType: adapterType || type || '',
      type: type || '',
      weight: weight || 1,
      priority: priority || 0,
      status: status || 'enabled',
      disabledReason: disabledReason || null,
      models: Array.isArray(models) ? JSON.stringify(models) : '[]',
      options: stringifyJson(options),
      statistics: stringifyJson(statistics),
      uploader: stringifyJson(uploader),
      cloudId: cloudId || null,
      createdAt: createdAt || '',
      updatedAt: updatedAt || '',
      md5: md5 || '',
      embedded: embedded ? 1 : 0,
      extra: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
    }
  },
  fromRecord(record) {
    if (!record) return null
    return new Channel({
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      adapterType: record.adapterType as Channel['adapterType'],
      type: record.type as Channel['type'],
      weight: Number(record.weight),
      priority: Number(record.priority),
      status: record.status as Channel['status'],
      disabledReason: record.disabledReason as string,
      models: parseJson(record.models, []),
      // Channel 的构造函数会把这两个普通对象分别喂给 BaseClientOptions.fromString
      // 和 ChannelStatistics，所以这里给的是反序列化后的裸对象，不是成品实例
      options: parseJson(record.options, {}) as Channel['options'],
      statistics: parseJson(record.statistics, {}) as Channel['statistics'],
      uploader: parseJson(record.uploader, undefined),
      // 列一直是 INTEGER（老库就是这么建的），但 Shareable 把 cloudId 声明成
      // string。保持列不变以兼容既有数据，这里只做类型上的转接。
      cloudId: record.cloudId as unknown as string,
      createdAt: record.createdAt as string,
      updatedAt: record.updatedAt as string,
      md5: record.md5 as string,
      embedded: Boolean(record.embedded),
      ...parseJson<Record<string, unknown>>(record.extra, {}),
    })
  },
}

export class SqlChannelStorage extends SqlKvStorage<Channel> {
  constructor(driver: SqlDriver) {
    super(driver, spec)
  }

  getName(): string {
    return 'SqlChannelStorage'
  }

  async setItem(id: string, channel: Channel): Promise<string> {
    stampTimestamps(channel)
    return super.setItem(id, channel)
  }

  /**
   * models 存的是 JSON 数组，按子串匹配单个模型名。
   *
   * 改造前这是藏在 listItemsByEqFilter 里的一个 LIKE 特判——叫「等值过滤」却做
   * 子串匹配是误导，这里提成显式方法。
   */
  async listItemsByModel(model: string): Promise<Channel[]> {
    await this.ensureInitialized()
    const rows = await this.driver.all(
      `SELECT * FROM ${this.q(this.table)} WHERE ${this.q('models')} LIKE ?`,
      [`%${model}%`],
    )
    return rows.map(row => spec.fromRecord(row)).filter((item): item is Channel => Boolean(item))
  }
}

export { spec as channelSpec }
