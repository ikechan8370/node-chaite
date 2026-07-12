import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'

/** Small always-visible MCP discovery tools. They are not MCP tool schemas. */
export function createMcpCapabilityTools(): Tool[] {
  return [searchMcpToolsTool(), activateMcpToolsTool()]
}

function searchMcpToolsTool(): Tool {
  return {
    name: 'search_mcp_tools', type: 'function',
    function: {
      name: 'search_mcp_tools',
      description: 'Search tools from configured MCP servers. Use when an external capability may help; it returns matching server and tool names without loading all schemas.',
      parameters: { type: 'object', properties: { query: { type: 'string', description: 'User intent or capability to search for' } }, required: ['query'] },
    },
    async run(args, context?: ChaiteContext) {
      const manager = context?.getChaite()?.getMcpServerManager()
      if (!manager) return JSON.stringify({ servers: [], message: 'MCP server manager is not configured' })
      const query = String(args.query ?? '').toLowerCase()
      const servers = await manager.listEnabled()
      const matches = servers.map(server => {
        const serverText = `${server.name} ${server.description ?? ''}`.toLowerCase()
        const tools = (server.tools ?? [])
          .filter(tool => !query || `${tool.name} ${tool.description ?? ''} ${serverText}`.toLowerCase().includes(query))
          .slice(0, 12)
          .map(tool => ({ name: tool.name, description: tool.description ?? '' }))
        return { id: server.id, name: server.name, description: server.description ?? '', toolCount: server.tools?.length ?? 0, tools }
      }).filter(server => server.tools.length > 0 || (!query && server.toolCount > 0))
      return JSON.stringify({ servers: matches })
    },
  }
}

function activateMcpToolsTool(): Tool {
  return {
    name: 'activate_mcp_tools', type: 'function',
    function: {
      name: 'activate_mcp_tools',
      description: 'Activate only selected tools from one configured MCP server. The real tool schemas become available immediately in the next internal model turn.',
      parameters: {
        type: 'object',
        properties: {
          server: { type: 'string', description: 'MCP server ID or name returned by search_mcp_tools' },
          tools: {
            type: 'array',
            description: 'One or more MCP tool names returned by search_mcp_tools',
            items: { type: 'string', description: 'One MCP tool name' },
          },
        },
        required: ['server', 'tools'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const chaite = context?.getChaite()
      const capabilities = chaite?.getMcpCapabilityManager()
      const server = String(args.server ?? '')
      const tools = Array.isArray(args.tools) ? args.tools.map(String) : []
      if (!capabilities || !context) return JSON.stringify({ error: 'MCP capabilities are not configured' })
      const active = await capabilities.activate(context, server, tools)
      return JSON.stringify({ activated: true, server: active.server.name, tools: active.toolNames, expiresAt: active.expiresAt, refreshTools: true })
    },
  }
}
