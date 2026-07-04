/**
 * Self-management tools for the LLM.
 *
 * These tools allow the LLM to bootstrap itself:
 *  - Create / update / delete Skills (SKILL.md + system-prompt.md)
 *  - Create / overwrite Workflows (workflow.json bound to a skill)
 *  - List existing skills
 *  - Run a skill's workflow on demand
 *
 * Usage: include the result of createSelfTools() in the tool list
 * given to the LLM.  They all resolve the SkillRegistry via ChaiteContext.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'
import type { SkillFrontmatter } from '../skills/skill.types'

export function createSelfTools(): Tool[] {
  return [
    listSkillsTool(),
    createSkillTool(),
    updateSkillTool(),
    deleteSkillTool(),
    createWorkflowTool(),
    runSkillTool(),
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Serialise a partial SkillFrontmatter to YAML front-matter block */
function buildFrontmatter(fields: Partial<SkillFrontmatter>): string {
  const lines: string[] = ['---']

  const str = (key: string, val: string | undefined) => {
    if (val !== undefined && val !== '') lines.push(`${key}: ${val}`)
  }
  const arr = (key: string, vals: string[] | undefined) => {
    if (vals && vals.length > 0) {
      lines.push(`${key}:`)
      vals.forEach(v => lines.push(`  - ${v}`))
    }
  }

  str('name', fields.name)
  str('description', fields.description)
  str('version', fields.version)
  if (fields.executionMode) str('executionMode', fields.executionMode)
  if (fields.workflowRef) str('workflowRef', fields.workflowRef)
  if (fields.preset) str('preset', fields.preset)
  if (fields.planningModel) str('planningModel', fields.planningModel)
  if (fields.readonly) lines.push('readonly: true')
  arr('allowedTools', fields.allowedTools)
  arr('processors', fields.processors)
  arr('triggers', fields.triggers)

  lines.push('---')
  return lines.join('\n') + '\n'
}

/** Parse comma-separated or JSON-array string → string[] */
function parseStringList(raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as string[]
    } catch {
      // fall through
    }
  }
  return trimmed.split(',').map(s => s.trim()).filter(Boolean)
}

function registryErr(res: Record<string, unknown>) {
  return JSON.stringify({ ...res })
}

// ─── list_skills ──────────────────────────────────────────────────────────────

function listSkillsTool(): Tool {
  return {
    name: 'list_skills',
    type: 'function',
    function: {
      name: 'list_skills',
      description: 'List all currently loaded skills with their metadata. Use this to see what skills exist before creating or updating one.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    async run(_args, context?: ChaiteContext) {
      const registry = context?.getChaite()?.getSkillRegistry()
      if (!registry) return registryErr({ error: 'SkillRegistry is not configured' })

      const metas = registry.listSkillMetas()
      if (metas.length === 0) return JSON.stringify({ skills: [], message: '当前没有加载任何技能' })

      return JSON.stringify({
        skills: metas.map(m => ({
          name: m.id,
          description: m.frontmatter.description,
          executionMode: m.frontmatter.executionMode ?? 'direct',
          workflowRef: m.frontmatter.workflowRef,
          allowedTools: m.frontmatter.allowedTools,
          preset: m.frontmatter.preset,
          readonly: m.frontmatter.readonly ?? false,
        })),
        total: metas.length,
      })
    },
  }
}

// ─── create_skill ─────────────────────────────────────────────────────────────

function createSkillTool(): Tool {
  return {
    name: 'create_skill',
    type: 'function',
    function: {
      name: 'create_skill',
      description: `Create a new Skill that defines how the agent behaves for a specific purpose.
A Skill consists of:
- A unique name (used as identifier)
- A description (used for matching)
- A system prompt (the actual instructions)
- An optional execution_mode: "direct" (normal LLM), "plan" (LLM-driven planning), "workflow" (runs a workflow.json)
- Optional allowed_tools (comma-separated or JSON array)
- Optional preset: which chat preset to use

After creation, the skill is immediately active and available for matching.
Use create_workflow afterwards if execution_mode is "workflow".`,
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Unique identifier for the skill (kebab-case recommended, e.g. "weather-report")',
          },
          description: {
            type: 'string',
            description: 'What this skill does — used for keyword matching when routing user messages',
          },
          system_prompt: {
            type: 'string',
            description: 'The full system prompt / instructions for this skill',
          },
          execution_mode: {
            type: 'string',
            description: 'How this skill executes: "direct"=normal LLM call, "plan"=LLM builds a step plan, "workflow"=runs a workflow.json file',
          },
          allowed_tools: {
            type: 'string',
            description: 'Comma-separated or JSON array of tool names this skill can use, e.g. "web_search,calculator"',
          },
          preset: {
            type: 'string',
            description: 'Name of the ChatPreset to activate for this skill (optional)',
          },
          planning_model: {
            type: 'string',
            description: 'Model to use for the planning step when execution_mode=plan (optional)',
          },
          overwrite: {
            type: 'boolean',
            description: 'If the skill already exists and is NOT readonly, set true to overwrite it. Default: false (refuse if exists).',
          },
        },
        required: ['name', 'description', 'system_prompt'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const registry = context?.getChaite()?.getSkillRegistry()
      if (!registry) return registryErr({ error: 'SkillRegistry is not configured' })

      const name = (args['name'] as string).trim().replace(/\s+/g, '-')
      const description = args['description'] as string
      const systemPrompt = args['system_prompt'] as string
      const executionMode = args['execution_mode'] as SkillFrontmatter['executionMode'] | undefined
      const allowedTools = args['allowed_tools'] ? parseStringList(args['allowed_tools'] as string) : undefined
      const preset = args['preset'] as string | undefined
      const planningModel = args['planning_model'] as string | undefined
      const overwrite = (args['overwrite'] as boolean | undefined) ?? false

      // Check for existing skill
      const existing = registry.getSkillByName(name)
      if (existing) {
        if (existing.frontmatter.readonly) {
          return JSON.stringify({ error: `技能 "${name}" 是只读保护的（readonly: true），无法通过此工具修改。请直接编辑文件系统。` })
        }
        if (!overwrite) {
          return JSON.stringify({
            error: `技能 "${name}" 已存在。如需覆盖，请将 overwrite 参数设为 true。`,
            existingSkill: { description: existing.frontmatter.description, executionMode: existing.frontmatter.executionMode },
          })
        }
      }

      const skillsDir = registry.getSkillsDir()
      const skillDir = path.join(skillsDir, name)

      try {
        await fs.promises.mkdir(skillDir, { recursive: true })

        const frontmatter = buildFrontmatter({
          name,
          description,
          executionMode,
          allowedTools,
          preset,
          planningModel,
        })

        await fs.promises.writeFile(path.join(skillDir, 'SKILL.md'), frontmatter, 'utf-8')
        await fs.promises.writeFile(path.join(skillDir, 'system-prompt.md'), systemPrompt, 'utf-8')

        await registry.load()

        return JSON.stringify({
          success: true,
          skillName: name,
          path: skillDir,
          message: `技能 "${name}" 已创建并加载。${executionMode === 'workflow' ? '现在可以用 create_workflow 为它添加工作流步骤。' : ''}`,
        })
      } catch (err) {
        return JSON.stringify({ error: `创建技能失败: ${String(err)}` })
      }
    },
  }
}

// ─── update_skill ─────────────────────────────────────────────────────────────

function updateSkillTool(): Tool {
  return {
    name: 'update_skill',
    type: 'function',
    function: {
      name: 'update_skill',
      description: 'Update an existing skill\'s system prompt or settings. Only provide the fields you want to change.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The skill name to update' },
          description: { type: 'string', description: 'New description (optional)' },
          system_prompt: { type: 'string', description: 'New system prompt content (optional)' },
          execution_mode: {
            type: 'string',
            description: 'Change execution mode: "direct", "plan", or "workflow" (optional)',
          },
          allowed_tools: { type: 'string', description: 'New comma-separated or JSON array of allowed tools (optional)' },
          preset: { type: 'string', description: 'New preset name (optional)' },
        },
        required: ['name'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const registry = context?.getChaite()?.getSkillRegistry()
      if (!registry) return registryErr({ error: 'SkillRegistry is not configured' })

      const name = args['name'] as string
      const skill = registry.getSkillByName(name)
      if (!skill) return JSON.stringify({ error: `技能 "${name}" 不存在` })
      if (skill.frontmatter.readonly) {
        return JSON.stringify({ error: `技能 "${name}" 是只读保护的（readonly: true），无法通过此工具修改。` })
      }

      try {
        // Merge existing frontmatter with provided updates
        const existing = skill.frontmatter
        const updated: Partial<SkillFrontmatter> = { ...existing }

        if (args['description']) updated.description = args['description'] as string
        if (args['execution_mode']) updated.executionMode = args['execution_mode'] as SkillFrontmatter['executionMode']
        if (args['allowed_tools']) updated.allowedTools = parseStringList(args['allowed_tools'] as string)
        if (args['preset'] !== undefined) updated.preset = args['preset'] as string

        const newFrontmatter = buildFrontmatter(updated)
        await fs.promises.writeFile(path.join(skill.rootDir, 'SKILL.md'), newFrontmatter, 'utf-8')

        if (args['system_prompt']) {
          await fs.promises.writeFile(
            path.join(skill.rootDir, 'system-prompt.md'),
            args['system_prompt'] as string,
            'utf-8',
          )
        }

        await registry.load()

        return JSON.stringify({ success: true, skillName: name, message: `技能 "${name}" 已更新并重新加载` })
      } catch (err) {
        return JSON.stringify({ error: `更新技能失败: ${String(err)}` })
      }
    },
  }
}

// ─── delete_skill ─────────────────────────────────────────────────────────────

function deleteSkillTool(): Tool {
  return {
    name: 'delete_skill',
    type: 'function',
    function: {
      name: 'delete_skill',
      description: 'Permanently delete a skill and all its files. This cannot be undone.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The skill name to delete' },
        },
        required: ['name'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const registry = context?.getChaite()?.getSkillRegistry()
      if (!registry) return registryErr({ error: 'SkillRegistry is not configured' })

      const name = args['name'] as string
      const skill = registry.getSkillByName(name)
      if (!skill) return JSON.stringify({ error: `技能 "${name}" 不存在` })
      if (skill.frontmatter.readonly) {
        return JSON.stringify({ error: `技能 "${name}" 是只读保护的（readonly: true），无法通过此工具删除。` })
      }

      try {
        await fs.promises.rm(skill.rootDir, { recursive: true, force: true })
        await registry.load()
        return JSON.stringify({ success: true, message: `技能 "${name}" 已删除` })
      } catch (err) {
        return JSON.stringify({ error: `删除技能失败: ${String(err)}` })
      }
    },
  }
}

// ─── create_workflow ──────────────────────────────────────────────────────────

function createWorkflowTool(): Tool {
  return {
    name: 'create_workflow',
    type: 'function',
    function: {
      name: 'create_workflow',
      description: `Create or overwrite the workflow definition for an existing skill.
The workflow defines a sequence of steps the agent will execute when the skill is triggered.

Workflow JSON format:
{
  "id": "my-workflow",
  "name": "Human readable name",
  "steps": [
    { "id": "step1", "type": "llm", "goal": "查询今日天气" },
    { "id": "step2", "type": "llm", "goal": "根据天气 {{step1}} 写一段播报文案", "dependsOn": ["step1"] }
  ]
}

Step types:
- "llm": sends a goal to the LLM. Use {{stepId}} to reference prior step outputs.
- "tool": calls a specific tool directly. Requires { toolName, args }.
- "parallel": runs sub-steps concurrently. Requires { steps: [...] }.
- "condition": branches on expression. Requires { expression, branches }.
- "background": spawns a background job. Requires { description, goal }.
- "subworkflow": runs an inline nested workflow. Requires { workflowDef }.

After saving, the skill's executionMode is automatically set to "workflow".`,
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: 'The name of the skill to attach this workflow to',
          },
          workflow_json: {
            type: 'string',
            description: 'The full WorkflowDefinition as a JSON string',
          },
        },
        required: ['skill_name', 'workflow_json'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const registry = context?.getChaite()?.getSkillRegistry()
      if (!registry) return registryErr({ error: 'SkillRegistry is not configured' })

      const skillName = args['skill_name'] as string
      const workflowJson = args['workflow_json'] as string

      const skill = registry.getSkillByName(skillName)
      if (!skill) return JSON.stringify({ error: `技能 "${skillName}" 不存在，请先用 create_skill 创建它` })
      if (skill.frontmatter.readonly) {
        return JSON.stringify({ error: `技能 "${skillName}" 是只读保护的（readonly: true），无法修改其工作流。` })
      }

      // Validate JSON
      let workflowDef: Record<string, unknown>
      try {
        workflowDef = JSON.parse(workflowJson) as Record<string, unknown>
      } catch (parseErr) {
        return JSON.stringify({ error: `workflow_json 不是合法的 JSON: ${String(parseErr)}` })
      }

      if (!workflowDef['steps'] || !Array.isArray(workflowDef['steps'])) {
        return JSON.stringify({ error: 'workflow_json 必须包含 "steps" 数组' })
      }

      try {
        const workflowFile = 'workflow.json'
        const workflowPath = path.join(skill.rootDir, workflowFile)
        await fs.promises.writeFile(workflowPath, JSON.stringify(workflowDef, null, 2), 'utf-8')

        // Ensure SKILL.md has workflowRef + executionMode: workflow
        const updated: Partial<SkillFrontmatter> = {
          ...skill.frontmatter,
          executionMode: 'workflow',
          workflowRef: workflowFile,
        }
        await fs.promises.writeFile(
          path.join(skill.rootDir, 'SKILL.md'),
          buildFrontmatter(updated),
          'utf-8',
        )

        await registry.load()

        const stepCount = (workflowDef['steps'] as unknown[]).length
        return JSON.stringify({
          success: true,
          skillName,
          workflowFile: workflowPath,
          stepCount,
          message: `工作流已保存到技能 "${skillName}"（${stepCount} 个步骤）。该技能现在会自动路由到工作流执行模式。`,
        })
      } catch (err) {
        return JSON.stringify({ error: `保存工作流失败: ${String(err)}` })
      }
    },
  }
}

// ─── run_skill ────────────────────────────────────────────────────────────────

function runSkillTool(): Tool {
  return {
    name: 'run_skill',
    type: 'function',
    function: {
      name: 'run_skill',
      description: 'Manually trigger a skill\'s workflow or plan execution right now. Useful for testing a newly created skill or running it on demand.',
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: 'The skill name to run',
          },
          goal: {
            type: 'string',
            description: 'Goal / input for the skill (used as context for plan mode). For workflow mode this is optional.',
          },
          background: {
            type: 'boolean',
            description: 'If true, run as a background job and return immediately with a job ID. Default: false.',
          },
        },
        required: ['skill_name'],
      },
    },
    async run(args, context?: ChaiteContext) {
      const chaite = context?.getChaite()
      const registry = chaite?.getSkillRegistry()
      if (!registry) return registryErr({ error: 'SkillRegistry is not configured' })

      const skillName = args['skill_name'] as string
      const goal = (args['goal'] as string | undefined) ?? skillName
      const background = (args['background'] as boolean | undefined) ?? false

      const skill = registry.getSkillByName(skillName)
      if (!skill) return JSON.stringify({ error: `技能 "${skillName}" 不存在` })

      const event = context?.getEvent()
      const userId = String(event?.sender?.user_id ?? 'agent')
      const groupId = event?.group?.group_id ? String(event.group.group_id) : undefined

      if (background) {
        const jobMgr = chaite?.getBackgroundJobManager()
        if (!jobMgr) return JSON.stringify({ error: 'BackgroundJobManager is not configured' })
        const jobId = await jobMgr.createAndRun({
          description: `Skill run: ${skillName}`,
          userId,
          groupId,
          skillName,
          payload: { goal },
        })
        return JSON.stringify({ jobId, message: `技能 "${skillName}" 已在后台启动，完成后会通知你。任务ID: ${jobId}` })
      }

      const agentCtx = chaite!.buildAgentRunContext({ skillName, userId, groupId })
      const mode = skill.frontmatter.executionMode

      try {
        if (mode === 'workflow') {
          const engine = chaite?.getWorkflowEngine()
          if (!engine) return JSON.stringify({ error: 'WorkflowEngine is not configured' })
          if (!skill.frontmatter.workflowRef) return JSON.stringify({ error: `技能 "${skillName}" 没有 workflowRef` })

          const buf = await skill.readFile(skill.frontmatter.workflowRef)
          const workflowDef = JSON.parse(buf.toString('utf-8'))
          const result = await engine.run(workflowDef, agentCtx)
          return JSON.stringify({
            status: result.status,
            output: result.finalOutput,
            stepCount: result.stepResults.length,
            error: result.error,
          })
        }

        if (mode === 'plan') {
          const planExec = chaite?.getPlanExecutor()
          if (!planExec) return JSON.stringify({ error: 'PlanExecutor is not configured' })
          const { plan, output } = await planExec.execute(goal, agentCtx)
          return JSON.stringify({ planId: plan.id, status: plan.status, output })
        }

        return JSON.stringify({ error: `技能 "${skillName}" 的 executionMode 是 "${mode ?? 'direct'}"，请直接对话触发它，不需要手动 run。` })
      } catch (err) {
        return JSON.stringify({ error: `执行技能失败: ${String(err)}` })
      }
    },
  }
}
