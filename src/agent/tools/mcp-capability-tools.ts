import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'

/** Small always-visible tools. They are an index, not the MCP tool schemas. */
export function createMcpCapabilityTools(): Tool[] {
  return [searchSkillsTool(), activateSkillToolsTool()]
}

function searchSkillsTool(): Tool {
  return {
    name: 'search_skills', type: 'function',
    function: {
      name: 'search_skills',
      description: 'Search the compact skill catalogue. Use before activating MCP tools for a specialised task.',
      parameters: { type: 'object', properties: { query: { type: 'string', description: 'User intent or capability to search for' } }, required: ['query'] },
    },
    async run(args, context?: ChaiteContext) {
      const registry = context?.getChaite()?.getSkillRegistry()
      if (!registry) return JSON.stringify({ skills: [], message: 'Skill registry is not configured' })
      const query = String(args.query ?? '').toLowerCase()
      const skills = registry.listSkillMetas()
        .filter(skill => `${skill.id} ${skill.frontmatter.description} ${(skill.frontmatter.keywords ?? []).join(' ')}`.toLowerCase().includes(query))
        .slice(0, 12)
        .map(skill => ({ name: skill.id, description: skill.frontmatter.description, keywords: skill.frontmatter.keywords ?? [], hasMcpTools: Boolean(skill.frontmatter.mcpServer && skill.frontmatter.mcpTools?.length) }))
      return JSON.stringify({ skills })
    },
  }
}

function activateSkillToolsTool(): Tool {
  return {
    name: 'activate_skill_tools', type: 'function',
    function: {
      name: 'activate_skill_tools',
      description: 'Activate only the MCP tools required by one skill. The selected tool schemas become available immediately in the next internal model turn.',
      parameters: {
        type: 'object',
        properties: {
          skill_name: { type: 'string', description: 'Skill name returned by search_skills' },
          tools: {
            type: 'array',
            description: 'Optional subset of the skill MCP tools. Omit to use the skill default set.',
            items: { type: 'string', description: 'One MCP tool name' },
          },
        },
        required: ['skill_name'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const chaite = context?.getChaite()
      const registry = chaite?.getSkillRegistry()
      const capabilities = chaite?.getMcpCapabilityManager()
      const skillName = String(args.skill_name ?? '')
      const skill = registry?.getSkillByName(skillName)
      if (!skill) return JSON.stringify({ error: `Skill "${skillName}" not found` })
      if (!skill.frontmatter.mcpServer) return JSON.stringify({ error: `Skill "${skillName}" has no MCP server binding` })
      const tools = Array.isArray(args.tools) && args.tools.length ? args.tools.map(String) : (skill.frontmatter.mcpTools ?? [])
      if (!capabilities || !context) return JSON.stringify({ error: 'MCP capabilities are not configured' })
      const active = await capabilities.activate(context, skill.frontmatter.mcpServer, tools)
      context.skillName = skill.id
      return JSON.stringify({ activated: true, server: active.server.name, tools: active.toolNames, expiresAt: active.expiresAt, refreshTools: true })
    },
  }
}
