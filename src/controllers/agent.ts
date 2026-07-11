/**
 * Agent subsystem HTTP controller.
 * Mounts under /api/agent and covers:
 *   /api/agent/skills          - SkillRegistry (full CRUD, readonly-aware)
 *   /api/agent/jobs            - BackgroundJobManager
 *   /api/agent/scheduled-tasks - DynamicScheduler
 *   /api/agent/plans           - PlanExecutor (read-only)
 *   /api/agent/mcp-servers     - McpServerManager
 */
import express, { Router, Request, Response } from 'express'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Chaite, ChaiteResponse } from '../index'
import type { McpServerConfig } from '../agent/mcp/McpServerConfig'
import type { SkillFrontmatter } from '../agent/skills/skill.types'

const router: Router = express.Router()

// ─── Helper ───────────────────────────────────────────────────────────────────

function handle(res: Response, fn: () => Promise<unknown>) {
  fn()
    .then(data => { if (!res.headersSent) res.status(200).json(ChaiteResponse.ok(data)) })
    .catch((e: unknown) => {
      if (!res.headersSent) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        Chaite.getInstance().getLogger().error(e as object)
        res.status(500).json(ChaiteResponse.fail(null, msg))
      }
    })
}

function notConfigured(res: Response, name: string) {
  res.status(503).json(ChaiteResponse.fail(null, `${name} is not configured`))
}

function paginate<T>(items: T[], req: Request): { items: T[]; total: number; page: number; pageSize: number } {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20))
  const total = items.length
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize }
}

async function discoverMcpTools(config: McpServerConfig) {
  const { McpToolExecutor } = await import('../agent/tool-executors/mcp')
  const executor = new McpToolExecutor(config)
  try {
    return await executor.listAvailableTools({ runId: 'discovery', userId: 'admin', timeoutMs: config.timeoutMs })
  } finally {
    await executor.close()
  }
}

/** Return 403 if the skill is marked readonly. Returns true if the response was sent (caller should return). */
function readonlyGuard(res: Response, name: string, frontmatter: SkillFrontmatter): boolean {
  if (frontmatter.readonly) {
    res.status(403).json(ChaiteResponse.fail(null, `Skill "${name}" is readonly and cannot be modified or deleted via the API. Remove readonly: true from its SKILL.md to enable editing.`))
    return true
  }
  return false
}

/** Parse comma-separated or JSON-array string → string[] */
function parseToolList(raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed) as string[] } catch { /* fall through */ }
  }
  return trimmed.split(',').map(s => s.trim()).filter(Boolean)
}

function buildSkillFrontmatter(fields: Partial<SkillFrontmatter>): string {
  const lines: string[] = ['---']
  const s = (k: string, v: string | undefined) => { if (v) lines.push(`${k}: ${v}`) }
  const a = (k: string, vs: string[] | undefined) => {
    if (vs && vs.length > 0) { lines.push(`${k}:`); vs.forEach(v => lines.push(`  - ${v}`)) }
  }
  s('name', fields.name)
  s('description', fields.description)
  s('version', fields.version)
  if (fields.executionMode) s('executionMode', fields.executionMode)
  if (fields.workflowRef) s('workflowRef', fields.workflowRef)
  if (fields.preset) s('preset', fields.preset)
  if (fields.planningModel) s('planningModel', fields.planningModel)
  if (fields.readonly) lines.push('readonly: true')
  a('allowedTools', fields.allowedTools)
  a('processors', fields.processors)
  a('triggers', fields.triggers)
  a('keywords', fields.keywords)
  s('mcpServer', fields.mcpServer)
  a('mcpTools', fields.mcpTools)
  lines.push('---')
  return lines.join('\n') + '\n'
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS  /api/agent/skills
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/agent/skills?page=1&pageSize=20&name=xxx — list skills with optional name filter + pagination */
router.get('/skills', (req: Request, res: Response) => {
  const registry = Chaite.getInstance().getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    let metas = registry.listSkillMetas()
    const name = req.query['name'] as string | undefined
    const mode = req.query['executionMode'] as string | undefined
    if (name) metas = metas.filter(m => m.frontmatter.name.includes(name) || m.frontmatter.description?.includes(name))
    if (mode) metas = metas.filter(m => (m.frontmatter.executionMode ?? 'direct') === mode)
    return paginate(metas, req)
  })
})

/** GET /api/agent/skills/:name — get one skill detail (includes instructions body) */
router.get('/skills/:name', (req: Request<{ name: string }>, res: Response) => {
  const registry = Chaite.getInstance().getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    const skill = registry.getSkillByName(req.params.name)
    if (!skill) {
      res.status(404).json(ChaiteResponse.fail(null, `Skill "${req.params.name}" not found`))
      return null
    }
    const instructions = await skill.loadInstructions()
    return { ...skill.frontmatter, id: skill.id, rootDir: skill.rootDir, instructions }
  })
})

/** POST /api/agent/skills/reload — hot-reload all skills from disk */
router.post('/skills/reload', (req: Request, res: Response) => {
  const registry = Chaite.getInstance().getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    await registry.load()
    return { count: registry.listSkillMetas().length }
  })
})

/**
 * POST /api/agent/skills
 * Create a new skill (writes SKILL.md + system-prompt.md, then hot-reloads).
 * Body: { name, description, systemPrompt, executionMode?, allowedTools?, preset?, overwrite? }
 * Returns 409 if skill exists and overwrite is not true.
 */
router.post('/skills', (req: Request, res: Response) => {
  const registry = Chaite.getInstance().getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    const { name, description, systemPrompt, executionMode, allowedTools, preset, planningModel, keywords, mcpServer, mcpTools, overwrite = false } = req.body as {
      name: string
      description: string
      systemPrompt: string
      executionMode?: SkillFrontmatter['executionMode']
      allowedTools?: string | string[]
      preset?: string
      planningModel?: string
      keywords?: string | string[]
      mcpServer?: string
      mcpTools?: string | string[]
      overwrite?: boolean
    }

    if (!name || !description || !systemPrompt) {
      res.status(400).json(ChaiteResponse.fail(null, 'name, description and systemPrompt are required'))
      return null
    }

    const safeName = name.trim().replace(/\s+/g, '-')
    const existing = registry.getSkillByName(safeName)
    if (existing) {
      if (readonlyGuard(res, safeName, existing.frontmatter)) return null
      if (!overwrite) {
        res.status(409).json(ChaiteResponse.fail(null, `Skill "${safeName}" already exists. Set overwrite: true to replace it.`))
        return null
      }
    }

    const tools = typeof allowedTools === 'string' ? parseToolList(allowedTools) : allowedTools
    const skillKeywords = typeof keywords === 'string' ? parseToolList(keywords) : keywords
    const selectedMcpTools = typeof mcpTools === 'string' ? parseToolList(mcpTools) : mcpTools
    const skillDir = path.join(registry.getSkillsDir(), safeName)
    await fs.promises.mkdir(skillDir, { recursive: true })
    await fs.promises.writeFile(path.join(skillDir, 'SKILL.md'), buildSkillFrontmatter({ name: safeName, description, executionMode, allowedTools: tools, preset, planningModel, keywords: skillKeywords, mcpServer, mcpTools: selectedMcpTools }), 'utf-8')
    await fs.promises.writeFile(path.join(skillDir, 'system-prompt.md'), systemPrompt, 'utf-8')
    await registry.load()

    return { name: safeName, created: true }
  })
})

/**
 * PATCH /api/agent/skills/:name
 * Update an existing skill. Readonly skills return 403.
 * Body: { description?, systemPrompt?, executionMode?, allowedTools?, preset? }
 */
router.patch('/skills/:name', (req: Request<{ name: string }>, res: Response) => {
  const registry = Chaite.getInstance().getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    const skill = registry.getSkillByName(req.params.name)
    if (!skill) {
      res.status(404).json(ChaiteResponse.fail(null, `Skill "${req.params.name}" not found`))
      return null
    }
    if (readonlyGuard(res, req.params.name, skill.frontmatter)) return null

    const { description, systemPrompt, executionMode, allowedTools, preset, planningModel, keywords, mcpServer, mcpTools } = req.body as {
      description?: string
      systemPrompt?: string
      executionMode?: SkillFrontmatter['executionMode']
      allowedTools?: string | string[]
      preset?: string
      planningModel?: string
      keywords?: string | string[]
      mcpServer?: string
      mcpTools?: string | string[]
    }

    const updated: Partial<SkillFrontmatter> = { ...skill.frontmatter }
    if (description) updated.description = description
    if (executionMode) updated.executionMode = executionMode
    if (preset !== undefined) updated.preset = preset
    if (planningModel) updated.planningModel = planningModel
    if (allowedTools !== undefined) {
      updated.allowedTools = typeof allowedTools === 'string' ? parseToolList(allowedTools) : allowedTools
    }
    if (keywords !== undefined) updated.keywords = typeof keywords === 'string' ? parseToolList(keywords) : keywords
    if (mcpServer !== undefined) updated.mcpServer = mcpServer
    if (mcpTools !== undefined) updated.mcpTools = typeof mcpTools === 'string' ? parseToolList(mcpTools) : mcpTools

    await fs.promises.writeFile(path.join(skill.rootDir, 'SKILL.md'), buildSkillFrontmatter(updated), 'utf-8')
    if (systemPrompt) {
      await fs.promises.writeFile(path.join(skill.rootDir, 'system-prompt.md'), systemPrompt, 'utf-8')
    }

    await registry.load()
    return { name: req.params.name, updated: true }
  })
})

/**
 * DELETE /api/agent/skills/:name
 * Delete a skill and all its files. Readonly skills return 403.
 */
router.delete('/skills/:name', (req: Request<{ name: string }>, res: Response) => {
  const registry = Chaite.getInstance().getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    const skill = registry.getSkillByName(req.params.name)
    if (!skill) {
      res.status(404).json(ChaiteResponse.fail(null, `Skill "${req.params.name}" not found`))
      return null
    }
    if (readonlyGuard(res, req.params.name, skill.frontmatter)) return null

    await fs.promises.rm(skill.rootDir, { recursive: true, force: true })
    await registry.load()
    return { name: req.params.name, deleted: true }
  })
})

/**
 * POST /api/agent/skills/:name/run
 * Manually trigger a skill's workflow or plan execution.
 * Body: { goal?: string, userId?: string, groupId?: string, background?: boolean }
 *   - goal: overrides the message text for plan mode
 *   - background: if true, wraps execution in a BackgroundJob and returns jobId immediately
 */
router.post('/skills/:name/run', (req: Request<{ name: string }>, res: Response) => {
  const chaite = Chaite.getInstance()
  const registry = chaite.getSkillRegistry()
  if (!registry) return notConfigured(res, 'SkillRegistry')
  handle(res, async () => {
    const skill = registry.getSkillByName(req.params.name)
    if (!skill) {
      res.status(404).json(ChaiteResponse.fail(null, `Skill "${req.params.name}" not found`))
      return null
    }

    const { goal = skill.frontmatter.description ?? req.params.name, userId, groupId, background = false } = req.body as {
      goal?: string
      userId?: string
      groupId?: string
      background?: boolean
    }

    const agentCtx = chaite.buildAgentRunContext({ skillName: skill.id, userId, groupId })
    const mode = skill.frontmatter.executionMode

    if (background) {
      const jobMgr = chaite.getBackgroundJobManager()
      if (!jobMgr) return notConfigured(res, 'BackgroundJobManager')
      const jobId = await jobMgr.createAndRun({ description: `Skill run: ${skill.id}`, userId: userId ?? 'api', payload: { goal } })
      return { jobId }
    }

    if (mode === 'workflow') {
      const engine = chaite.getWorkflowEngine()
      if (!engine) return notConfigured(res, 'WorkflowEngine')
      if (!skill.frontmatter.workflowRef) {
        res.status(400).json(ChaiteResponse.fail(null, 'Skill has no workflowRef'))
        return null
      }
      const buf = await skill.readFile(skill.frontmatter.workflowRef)
      const workflowDef = JSON.parse(buf.toString('utf-8'))
      const result = await engine.run(workflowDef, agentCtx)
      return result
    }

    if (mode === 'plan') {
      const planExec = chaite.getPlanExecutor()
      if (!planExec) return notConfigured(res, 'PlanExecutor')
      const { plan, output } = await planExec.execute(goal, agentCtx)
      return { planId: plan.id, output, status: plan.status }
    }

    // direct mode — just run the skill as a sendMessage
    res.status(400).json(ChaiteResponse.fail(null, `Skill "${req.params.name}" has executionMode=direct; use the chat API instead`))
    return null
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND JOBS  /api/agent/jobs
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/agent/jobs?userId=xxx&status=xxx&page=1&pageSize=20 */
router.get('/jobs', (req: Request, res: Response) => {
  const mgr = Chaite.getInstance().getBackgroundJobManager()
  if (!mgr) return notConfigured(res, 'BackgroundJobManager')
  handle(res, async () => {
    const userId = req.query['userId'] as string | undefined
    const status = req.query['status'] as string | undefined
    let jobs = await mgr.listJobs(userId)
    if (status) jobs = jobs.filter(j => j.status === status)
    return paginate(jobs, req)
  })
})

/** GET /api/agent/jobs/:id — get one job */
router.get('/jobs/:id', (req: Request<{ id: string }>, res: Response) => {
  const mgr = Chaite.getInstance().getBackgroundJobManager()
  if (!mgr) return notConfigured(res, 'BackgroundJobManager')
  handle(res, async () => {
    const job = await mgr.getJob(req.params.id)
    if (!job) {
      res.status(404).json(ChaiteResponse.fail(null, 'Job not found'))
      return null
    }
    return job
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED TASKS  /api/agent/scheduled-tasks
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/agent/scheduled-tasks?userId=xxx&page=1&pageSize=20 */
router.get('/scheduled-tasks', (req: Request, res: Response) => {
  const scheduler = Chaite.getInstance().getDynamicScheduler()
  if (!scheduler) return notConfigured(res, 'DynamicScheduler')
  handle(res, async () => {
    const userId = req.query['userId'] as string | undefined
    const tasks = await scheduler.listTasks(userId)
    return paginate(tasks, req)
  })
})

/** GET /api/agent/scheduled-tasks/:id — get one task */
router.get('/scheduled-tasks/:id', (req: Request<{ id: string }>, res: Response) => {
  const scheduler = Chaite.getInstance().getDynamicScheduler()
  if (!scheduler) return notConfigured(res, 'DynamicScheduler')
  handle(res, async () => {
    const task = await scheduler.getTask(req.params.id)
    if (!task) {
      res.status(404).json(ChaiteResponse.fail(null, 'Task not found'))
      return null
    }
    return task
  })
})

/** DELETE /api/agent/scheduled-tasks/:id — cancel a task */
router.delete('/scheduled-tasks/:id', (req: Request<{ id: string }>, res: Response) => {
  const scheduler = Chaite.getInstance().getDynamicScheduler()
  if (!scheduler) return notConfigured(res, 'DynamicScheduler')
  handle(res, async () => {
    const ok = await scheduler.cancelTask(req.params.id)
    if (!ok) {
      res.status(404).json(ChaiteResponse.fail(null, 'Task not found'))
      return null
    }
    return { cancelled: true }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PLANS  /api/agent/plans  (read-only — plans are created by the agent)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/agent/plans/:id — get plan + step progress */
router.get('/plans/:id', (req: Request<{ id: string }>, res: Response) => {
  const storage = Chaite.getInstance().getAgentStorage()
  if (!storage) return notConfigured(res, 'AgentStorage')
  handle(res, async () => {
    const plan = await storage.getItem('plan:' + req.params.id)
    if (!plan) {
      res.status(404).json(ChaiteResponse.fail(null, 'Plan not found'))
      return null
    }
    return plan
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MCP SERVERS  /api/agent/mcp-servers
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/agent/mcp-servers?page=1&pageSize=20 */
router.get('/mcp-servers', (req: Request, res: Response) => {
  const mgr = Chaite.getInstance().getMcpServerManager()
  if (!mgr) return notConfigured(res, 'McpServerManager')
  handle(res, async () => paginate(await mgr.list(), req))
})

/** GET /api/agent/mcp-servers/:id */
router.get('/mcp-servers/:id', (req: Request<{ id: string }>, res: Response) => {
  const mgr = Chaite.getInstance().getMcpServerManager()
  if (!mgr) return notConfigured(res, 'McpServerManager')
  handle(res, async () => {
    const cfg = await mgr.get(req.params.id)
    if (!cfg) {
      res.status(404).json(ChaiteResponse.fail(null, 'MCP server not found'))
      return null
    }
    return cfg
  })
})

/** POST /api/agent/mcp-servers — add a new MCP server */
router.post('/mcp-servers', (
  req: Request<object, object, Omit<McpServerConfig, 'id' | 'createdAt' | 'updatedAt'>>,
  res: Response,
) => {
  const mgr = Chaite.getInstance().getMcpServerManager()
  if (!mgr) return notConfigured(res, 'McpServerManager')
  handle(res, async () => {
    // Adding a server is also its first connection validation and discovery.
    // Do not leave an unusable endpoint in the user's configuration.
    const created = await mgr.add(req.body)
    try {
      const tools = await discoverMcpTools(created)
      const updated = await mgr.update(created.id, { tools, toolsDiscoveredAt: Date.now() })
      if (!updated) throw new Error('MCP server disappeared while saving its tool manifest')
      return updated
    } catch (error) {
      await mgr.delete(created.id)
      throw new Error(`MCP server connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
})

/** PATCH /api/agent/mcp-servers/:id — update an existing MCP server */
router.patch('/mcp-servers/:id', (
  req: Request<{ id: string }, object, Partial<McpServerConfig>>,
  res: Response,
) => {
  const mgr = Chaite.getInstance().getMcpServerManager()
  if (!mgr) return notConfigured(res, 'McpServerManager')
  handle(res, async () => {
    const existing = await mgr.get(req.params.id)
    if (!existing) {
      res.status(404).json(ChaiteResponse.fail(null, 'MCP server not found'))
      return null
    }
    // Validate the proposed connection before replacing a working config.
    const candidate = { ...existing, ...req.body, id: existing.id, createdAt: existing.createdAt, updatedAt: existing.updatedAt }
    const tools = await discoverMcpTools(candidate)
    const updated = await mgr.update(req.params.id, { ...req.body, tools, toolsDiscoveredAt: Date.now() })
    if (!updated) {
      res.status(404).json(ChaiteResponse.fail(null, 'MCP server not found'))
      return null
    }
    return updated
  })
})

/** DELETE /api/agent/mcp-servers/:id — remove an MCP server config */
router.delete('/mcp-servers/:id', (req: Request<{ id: string }>, res: Response) => {
  const mgr = Chaite.getInstance().getMcpServerManager()
  if (!mgr) return notConfigured(res, 'McpServerManager')
  handle(res, async () => {
    const existing = await mgr.get(req.params.id)
    if (!existing) {
      res.status(404).json(ChaiteResponse.fail(null, 'MCP server not found'))
      return null
    }
    await mgr.delete(req.params.id)
    return { deleted: true }
  })
})

/** POST /api/agent/mcp-servers/:id/test — ping the MCP server and list its tools */
router.post('/mcp-servers/:id/test', (req: Request<{ id: string }>, res: Response) => {
  const mgr = Chaite.getInstance().getMcpServerManager()
  if (!mgr) return notConfigured(res, 'McpServerManager')
  handle(res, async () => {
    const cfg = await mgr.get(req.params.id)
    if (!cfg) {
      res.status(404).json(ChaiteResponse.fail(null, 'MCP server not found'))
      return null
    }
    const tools = await discoverMcpTools(cfg)
    const updated = await mgr.update(cfg.id, { tools, toolsDiscoveredAt: Date.now() })
    if (!updated || updated.tools?.length !== tools.length) {
      throw new Error('MCP tool manifest could not be persisted')
    }
    return { ok: true, toolCount: tools.length, cachedToolCount: updated.tools.length, tools }
  })
})

export default router
