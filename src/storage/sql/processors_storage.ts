import { ProcessorDTO } from '../../types/processors'
import { SqlDriver } from '../driver/types'
import { SqlKvStorage, TableSpec, parseJson, stringifyJson } from '../sql_storage'
import { SHAREABLE_COLUMNS, stampTimestamps } from './shareable'

const spec: TableSpec<ProcessorDTO> = {
  table: 'processors',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    type: { type: 'text', notNull: true },
    code: { type: 'text' },
    ...SHAREABLE_COLUMNS,
    extraData: { type: 'json' },
  },
  indexes: [{ columns: ['type'] }],
  filterable: ['id', 'name', 'description', 'type', 'cloudId', 'md5', 'embedded'],
  boolean: ['embedded'],
  toRecord(processor, id) {
    const {
      id: _ignored, name, description, type, code, cloudId,
      createdAt, updatedAt, md5, embedded, uploader, ...rest
    } = processor as ProcessorDTO & Record<string, unknown>

    return {
      id,
      name: name || '',
      description: description || '',
      // 'pre' 或 'post'
      type: type || '',
      code: code || '',
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
    return new ProcessorDTO({
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      type: record.type as ProcessorDTO['type'],
      code: record.code as string,
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

export class SqlProcessorsStorage extends SqlKvStorage<ProcessorDTO> {
  constructor(driver: SqlDriver) {
    super(driver, spec)
  }

  getName(): string {
    return 'SqlProcessorsStorage'
  }

  async setItem(id: string, processor: ProcessorDTO): Promise<string> {
    stampTimestamps(processor)
    return super.setItem(id, processor)
  }
}

export { spec as processorsSpec }
