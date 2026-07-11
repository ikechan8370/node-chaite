import type { BasicStorage } from '../../types/storage'
import * as crypto from 'node:crypto'

export type McpTransportType = 'streamable-http' | 'sse' | 'stdio'

export interface McpToolManifest {
  name: string
  description?: string
  schema?: unknown
}

/** Persistent configuration for a single MCP server connection */
export interface McpServerConfig {
  id: string
  name: string
  description?: string
  /** Transport type. Existing baseUrl-only records default to streamable HTTP. */
  transport?: McpTransportType
  /** MCP endpoint for Streamable HTTP / legacy SSE transports. */
  url?: string
  /** @deprecated Use url. Kept to migrate existing MCP configuration records. */
  baseUrl?: string
  /** Extra request headers. Useful for Authorization and vendor API keys. */
  headers?: Record<string, string>
  /** @deprecated Use headers.Authorization. */
  authHeader?: string
  /** Command to run for a local stdio MCP server. */
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  /** Existing tool groups that expose this server's tools to a preset. */
  toolGroupIds?: string[]
  /** Cached on a successful connection test; avoids discovering tools per chat. */
  tools?: McpToolManifest[]
  toolsDiscoveredAt?: number
  /** Default timeout for tool calls in ms */
  timeoutMs?: number
  /** Whether this server is active */
  enabled: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Manager for MCP server configurations.
 * CRUD over BasicStorage — no cloud sharing (configs contain private credentials).
 *
 * These configs are used by Chaite.buildToolExecutor() to create McpToolExecutors
 * and attach them to channels at startup.
 */
export class McpServerManager {
  constructor(private readonly storage: BasicStorage<McpServerConfig>) {}

  async add(config: Omit<McpServerConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<McpServerConfig> {
    const now = Date.now()
    const full: McpServerConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await this.storage.setItem(full.id, full)
    return full
  }

  async update(id: string, patch: Partial<Omit<McpServerConfig, 'id' | 'createdAt'>>): Promise<McpServerConfig | null> {
    const existing = await this.storage.getItem(id)
    if (!existing) return null
    const updated: McpServerConfig = { ...existing, ...patch, id, updatedAt: Date.now() }
    await this.storage.setItem(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.storage.removeItem(id)
  }

  async get(id: string): Promise<McpServerConfig | null> {
    return this.storage.getItem(id)
  }

  async list(): Promise<McpServerConfig[]> {
    return this.storage.listItems()
  }

  async listEnabled(): Promise<McpServerConfig[]> {
    const all = await this.list()
    return all.filter(c => c.enabled)
  }

  async listEnabledForToolGroups(toolGroupIds: string[]): Promise<McpServerConfig[]> {
    const selected = new Set(toolGroupIds)
    return (await this.listEnabled()).filter(server =>
      (server.toolGroupIds ?? []).some(id => selected.has(id)),
    )
  }
}
