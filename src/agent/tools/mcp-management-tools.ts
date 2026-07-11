import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'

/** Owner-only MCP management tools. Creating a draft never starts a process. */
export function createMcpManagementTools(): Tool[] {
  return [listMcpServersTool(), draftMcpServerTool()]
}

function listMcpServersTool(): Tool {
  return {
    name: 'list_mcp_servers', type: 'function',
    function: { name: 'list_mcp_servers', description: 'List configured MCP servers and their discovered tool counts. Credentials are never returned.', parameters: { type: 'object', properties: {}, required: [] } },
    async run(_args, context?: ChaiteContext) {
      const chaite = context?.getChaite()
      if (!chaite?.canManageMcp(context!)) return JSON.stringify({ error: 'Only the bot owner can manage MCP servers' })
      const servers = await chaite.getMcpServerManager()?.list() ?? []
      return JSON.stringify({ servers: servers.map(server => ({ id: server.id, name: server.name, transport: server.transport ?? 'streamable-http', enabled: server.enabled, toolCount: server.tools?.length ?? 0, toolGroups: server.toolGroupIds ?? [] })) })
    },
  }
}

function draftMcpServerTool(): Tool {
  return {
    name: 'draft_mcp_server', type: 'function',
    function: {
      name: 'draft_mcp_server',
      description: 'Prepare an MCP server configuration for the owner. It is not saved or started until the owner confirms it with the QQ confirmation command.',
      parameters: { type: 'object', properties: {
        name: { type: 'string', description: 'Server name' }, transport: { type: 'string', description: 'streamable-http, sse, or stdio' }, url: { type: 'string', description: 'URL for HTTP/SSE' }, command: { type: 'string', description: 'Command for stdio' }, args: { type: 'array', description: 'stdio command arguments' }, tool_group_ids: { type: 'array', description: 'Existing tool group IDs to bind' }, description: { type: 'string', description: 'Optional description' },
      }, required: ['name', 'transport'] },
    },
    async run(args, context?: ChaiteContext) {
      const chaite = context?.getChaite()
      if (!chaite?.canManageMcp(context!)) return JSON.stringify({ error: 'Only the bot owner can manage MCP servers' })
      const transport = String(args.transport ?? 'streamable-http')
      if (!['streamable-http', 'sse', 'stdio'].includes(transport)) return JSON.stringify({ error: 'Unsupported transport' })
      const config = {
        name: String(args.name ?? '').trim(), description: String(args.description ?? ''), transport: transport as 'streamable-http' | 'sse' | 'stdio',
        url: String(args.url ?? '').trim() || undefined, command: String(args.command ?? '').trim() || undefined,
        args: Array.isArray(args.args) ? args.args.map(String) : [], toolGroupIds: Array.isArray(args.tool_group_ids) ? args.tool_group_ids.map(String) : [], enabled: true,
      }
      if (!config.name || (transport === 'stdio' ? !config.command : !config.url)) return JSON.stringify({ error: 'Missing server name or transport endpoint' })
      const draft = chaite.getMcpCapabilityManager()?.createDraft(config)
      return JSON.stringify({ drafted: true, draftId: draft?.id, message: `Draft created. The owner must send the MCP confirmation command with ID ${draft?.id} within 10 minutes before it is saved.` })
    },
  }
}
