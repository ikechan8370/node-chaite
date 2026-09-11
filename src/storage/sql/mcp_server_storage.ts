import { McpServerConfig } from '../../agent/mcp/McpServerConfig'
import { SqlDriver } from '../driver/types'
import { SqlKvStorage, TableSpec, parseJson } from '../sql_storage'

/**
 * MCP 连接配置。里面有凭据（headers 里的 Authorization、env 里的 API key），
 * 所以整条记录只落本地库，不上传云端。
 */
const spec: TableSpec<McpServerConfig> = {
  table: 'mcp_servers',
  columns: {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    enabled: { type: 'bool', notNull: true, default: 1 },
    updatedAt: { type: 'bigint', notNull: true },
    payload: { type: 'json', notNull: true },
  },
  indexes: [{ columns: ['name'], name: 'idx_mcp_servers_name' }],
  filterable: ['id', 'name', 'enabled'],
  boolean: ['enabled'],
  orderBy: 'updatedAt DESC',
  toRecord(value, id) {
    return {
      id,
      name: value.name,
      enabled: value.enabled ? 1 : 0,
      updatedAt: value.updatedAt || Date.now(),
      payload: JSON.stringify(value),
    }
  },
  fromRecord(record) {
    if (!record) return null
    return parseJson<McpServerConfig | null>(record.payload, null)
  },
}

export class SqlMcpServerStorage extends SqlKvStorage<McpServerConfig> {
  constructor(driver: SqlDriver) {
    super(driver, spec)
  }

  getName(): string {
    return 'SqlMcpServerStorage'
  }
}

export { spec as mcpServerSpec }
