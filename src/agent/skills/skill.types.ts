export type ExecutionMode = 'plan' | 'workflow' | 'direct'

export interface SkillFrontmatter {
  /** Unique skill name, a-z0-9- recommended */
  name: string
  description: string
  version?: string
  license?: string
  compatibility?: string
  /** Tool names this skill is allowed to invoke */
  allowedTools?: string[]
  executionMode?: ExecutionMode
  /** Model used for the planning step when executionMode=plan */
  planningModel?: string
  /** Path to workflow definition file when executionMode=workflow */
  workflowRef?: string
  /** ChatPreset name to activate */
  preset?: string
  /** Processor ids */
  processors?: string[]
  /** Trigger ids */
  triggers?: string[]
  /**
   * When true, this skill is protected from modification or deletion by the LLM's
   * self-management tools (update_skill / delete_skill / create_skill overwrite).
   * Set this in SKILL.md for developer-configured skills you don't want the LLM to touch.
   * Only a human with filesystem access can modify readonly skills.
   */
  readonly?: boolean
  metadata?: Record<string, unknown>
}

export interface Skill {
  id: string
  rootDir: string
  frontmatter: SkillFrontmatter
  /**
   * Progressive disclosure: load full instruction body on demand.
   * Tries system-prompt.md first, falls back to SKILL.md body.
   */
  loadInstructions(): Promise<string>
  /** Read a file relative to the skill root directory */
  readFile(relPath: string): Promise<Buffer>
}

export type SkillMeta = Pick<Skill, 'id' | 'rootDir' | 'frontmatter'>
