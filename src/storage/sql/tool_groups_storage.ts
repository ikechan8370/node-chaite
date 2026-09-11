import { ToolsGroupDTO } from '../../types/tools'
import { SqlDriver } from '../driver/types'
import { SqlKvStorage, TableSpec, parseJson } from '../sql_storage'
import { stampTimestamps } from './shareable'

const spec: TableSpec<ToolsGroupDTO> = {
  table: 'tools_groups',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    toolIds: { type: 'json', notNull: true },
    isDefault: { type: 'bool', default: 0 },
    createdAt: { type: 'text' },
    updatedAt: { type: 'text' },
  },
  indexes: [{ columns: ['name'], name: 'idx_tools_groups_name' }],
  filterable: ['id', 'name', 'description', 'isDefault'],
  boolean: ['isDefault'],
  toRecord(group, id) {
    const { name, description, toolIds, isDefault, createdAt, updatedAt } = group
    return {
      id,
      name: name || '',
      description: description || '',
      toolIds: JSON.stringify(toolIds || []),
      isDefault: isDefault ? 1 : 0,
      createdAt: createdAt || '',
      updatedAt: updatedAt || '',
    }
  },
  fromRecord(record) {
    if (!record) return null
    return new ToolsGroupDTO({
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      toolIds: parseJson<string[]>(record.toolIds, []),
      isDefault: Boolean(record.isDefault),
      createdAt: record.createdAt as string,
      updatedAt: record.updatedAt as string,
    })
  },
}

export class SqlToolsGroupStorage extends SqlKvStorage<ToolsGroupDTO> {
  constructor(driver: SqlDriver) {
    super(driver, spec)
  }

  getName(): string {
    return 'SqlToolsGroupStorage'
  }

  async setItem(id: string, group: ToolsGroupDTO): Promise<string> {
    stampTimestamps(group)
    return super.setItem(id, group)
  }
}

export { spec as toolsGroupSpec }
