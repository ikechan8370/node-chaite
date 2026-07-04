import { CronTrigger } from '../../types/trigger'
import type { ChaiteContext } from '../../types/common'
import type { WorkflowDefinition } from '../workflow/workflow.types'
import { Chaite } from '../../core'

/**
 * A CronTrigger that runs a WorkflowDefinition when fired.
 *
 * Usage:
 *   const trigger = new WorkflowTrigger({
 *     name: 'daily-report',
 *     cronExpression: '0 9 * * *',
 *     workflowDef: myWorkflow,
 *   })
 *   await chaite.getTriggerManager().registerTrigger(trigger)
 */
export class WorkflowTrigger extends CronTrigger {
  private readonly workflowDef: WorkflowDefinition
  private readonly runAsUserId?: string
  private readonly runAsGroupId?: string

  constructor(params: {
    name: string
    cronExpression: string
    workflowDef: WorkflowDefinition
    isOneTime?: boolean
    userId?: string
    groupId?: string
  }) {
    super({
      name: params.name,
      description: `Workflow trigger: ${params.name}`,
      cronExpression: params.cronExpression,
      isOneTime: params.isOneTime,
    })
    this.workflowDef = params.workflowDef
    this.runAsUserId = params.userId
    this.runAsGroupId = params.groupId
  }

  protected async execute(_context: ChaiteContext): Promise<void> {
    const chaite = Chaite.getInstance()
    const engine = chaite.getWorkflowEngine()
    if (!engine) {
      chaite.getLogger().warn(`[WorkflowTrigger] No WorkflowEngine configured, skipping trigger "${this.name}"`)
      return
    }

    const ctx = chaite.buildAgentRunContext({
      skillName: this.name,
      userId: this.runAsUserId,
      groupId: this.runAsGroupId,
    })

    try {
      const result = await engine.run(this.workflowDef, ctx)
      if (result.status === 'failed') {
        chaite.getLogger().error(`[WorkflowTrigger] "${this.name}" workflow failed: ${result.error}`)
      }
    } catch (err) {
      chaite.getLogger().error(`[WorkflowTrigger] "${this.name}" threw: ${String(err)}`)
    }
  }
}

/**
 * A CronTrigger that resolves and runs a named Skill's workflow when fired.
 * The skill must have `executionMode: workflow` and a valid `workflowRef`.
 *
 * Usage:
 *   const trigger = new SkillWorkflowTrigger({
 *     name: 'daily-weather',
 *     cronExpression: '0 17 * * *',
 *     skillName: 'weather-report',
 *   })
 */
export class SkillWorkflowTrigger extends CronTrigger {
  private readonly skillName: string
  private readonly runAsUserId?: string
  private readonly runAsGroupId?: string

  constructor(params: {
    name: string
    cronExpression: string
    skillName: string
    isOneTime?: boolean
    userId?: string
    groupId?: string
  }) {
    super({
      name: params.name,
      description: `Skill workflow trigger for: ${params.skillName}`,
      cronExpression: params.cronExpression,
      isOneTime: params.isOneTime,
    })
    this.skillName = params.skillName
    this.runAsUserId = params.userId
    this.runAsGroupId = params.groupId
  }

  protected async execute(_context: ChaiteContext): Promise<void> {
    const chaite = Chaite.getInstance()
    const registry = chaite.getSkillRegistry()
    if (!registry) {
      chaite.getLogger().warn('[SkillWorkflowTrigger] No SkillRegistry configured')
      return
    }

    const skill = registry.getSkillByName(this.skillName)
    if (!skill) {
      chaite.getLogger().warn(`[SkillWorkflowTrigger] Skill "${this.skillName}" not found`)
      return
    }

    if (skill.frontmatter.executionMode !== 'workflow' || !skill.frontmatter.workflowRef) {
      chaite.getLogger().warn(
        `[SkillWorkflowTrigger] Skill "${this.skillName}" is not a workflow skill (executionMode=${skill.frontmatter.executionMode}, workflowRef=${skill.frontmatter.workflowRef})`,
      )
      return
    }

    const engine = chaite.getWorkflowEngine()
    if (!engine) {
      chaite.getLogger().warn('[SkillWorkflowTrigger] No WorkflowEngine configured')
      return
    }

    let workflowDef: WorkflowDefinition
    try {
      const buf = await skill.readFile(skill.frontmatter.workflowRef)
      workflowDef = JSON.parse(buf.toString('utf-8')) as WorkflowDefinition
    } catch (err) {
      chaite.getLogger().error(`[SkillWorkflowTrigger] Failed to load workflowRef for skill "${this.skillName}": ${String(err)}`)
      return
    }

    const ctx = chaite.buildAgentRunContext({
      skillName: this.skillName,
      userId: this.runAsUserId,
      groupId: this.runAsGroupId,
    })

    try {
      const result = await engine.run(workflowDef, ctx)
      if (result.status === 'failed') {
        chaite.getLogger().error(`[SkillWorkflowTrigger] Skill "${this.skillName}" workflow failed: ${result.error}`)
      }
    } catch (err) {
      chaite.getLogger().error(`[SkillWorkflowTrigger] Skill "${this.skillName}" threw: ${String(err)}`)
    }
  }
}
