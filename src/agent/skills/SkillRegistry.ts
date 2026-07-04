import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Skill, SkillFrontmatter, SkillMeta } from './skill.types'

/**
 * Minimal YAML-subset parser for SKILL.md frontmatter.
 * Handles: string, number, boolean, block arrays (- item), inline arrays ([a, b]).
 * kebab-case keys are converted to camelCase.
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const yamlStr = match[1]
  const body = (match[2] ?? '').trimStart()
  const frontmatter: Record<string, unknown> = {}

  let pendingArrayKey: string | null = null
  let pendingArray: string[] | null = null

  const flush = () => {
    if (pendingArrayKey !== null && pendingArray !== null) {
      frontmatter[pendingArrayKey] = pendingArray
      pendingArrayKey = null
      pendingArray = null
    }
  }

  for (const rawLine of yamlStr.split('\n')) {
    const line = rawLine.trimEnd()

    // Block array item
    if (/^\s+-\s/.test(line) && pendingArrayKey !== null) {
      pendingArray!.push(line.replace(/^\s+-\s+/, '').trim())
      continue
    }

    flush()

    // Key: value
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/)
    if (!kvMatch) continue

    const rawKey = kvMatch[1]
    const camelKey = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    const val = kvMatch[2].trim()

    if (val === '') {
      // Upcoming block array
      pendingArrayKey = camelKey
      pendingArray = []
    } else if (val.startsWith('[') && val.endsWith(']')) {
      // Inline array
      frontmatter[camelKey] = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else if (val === 'true') {
      frontmatter[camelKey] = true
    } else if (val === 'false') {
      frontmatter[camelKey] = false
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      frontmatter[camelKey] = Number(val)
    } else {
      frontmatter[camelKey] = val.replace(/^['"]|['"]$/g, '')
    }
  }

  flush()
  return { frontmatter, body }
}

// ─── Skill implementation ─────────────────────────────────────────────────────

class SkillImpl implements Skill {
  readonly id: string
  readonly rootDir: string
  readonly frontmatter: SkillFrontmatter
  private readonly skillMdPath: string

  constructor(id: string, rootDir: string, frontmatter: SkillFrontmatter, skillMdPath: string) {
    this.id = id
    this.rootDir = rootDir
    this.frontmatter = frontmatter
    this.skillMdPath = skillMdPath
  }

  async loadInstructions(): Promise<string> {
    const systemPromptPath = path.join(this.rootDir, 'system-prompt.md')
    if (fs.existsSync(systemPromptPath)) {
      return fs.promises.readFile(systemPromptPath, 'utf-8')
    }
    const content = await fs.promises.readFile(this.skillMdPath, 'utf-8')
    const { body } = parseFrontmatter(content)
    return body.trim()
  }

  async readFile(relPath: string): Promise<Buffer> {
    return fs.promises.readFile(path.join(this.rootDir, relPath))
  }
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map()
  private readonly skillsDir: string

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir
  }

  async load(): Promise<void> {
    if (!fs.existsSync(this.skillsDir)) {
      return
    }

    const entries = await fs.promises.readdir(this.skillsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillDir = path.join(this.skillsDir, entry.name)
      const skillMdPath = path.join(skillDir, 'SKILL.md')
      if (!fs.existsSync(skillMdPath)) continue

      try {
        const content = await fs.promises.readFile(skillMdPath, 'utf-8')
        const { frontmatter } = parseFrontmatter(content)
        const sf = frontmatter as unknown as SkillFrontmatter

        if (!sf.name) {
          sf.name = entry.name
        }

        const skill = new SkillImpl(sf.name, skillDir, sf, skillMdPath)
        this.skills.set(sf.name, skill)
      } catch (err) {
        console.warn(`[SkillRegistry] Failed to load skill at ${skillDir}:`, err)
      }
    }
  }

  listSkillMetas(): SkillMeta[] {
    return Array.from(this.skills.values()).map(s => ({
      id: s.id,
      rootDir: s.rootDir,
      frontmatter: s.frontmatter,
    }))
  }

  getSkillByName(name: string): Skill | null {
    return this.skills.get(name) ?? null
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  getSkillsDir(): string {
    return this.skillsDir
  }

  /**
   * Simple rule-based skill matcher.
   * Searches skill descriptions and names for keyword overlap with the user message.
   * Returns the best match, or null if no good match found.
   */
  matchSkill(userMessage: string): Skill | null {
    const lower = userMessage.toLowerCase()
    let best: Skill | null = null
    let bestScore = 0

    for (const skill of this.skills.values()) {
      const { name, description } = skill.frontmatter
      const candidate = `${name} ${description ?? ''}`.toLowerCase()
      const words = lower.split(/\W+/).filter(w => w.length > 2)
      const score = words.filter(w => candidate.includes(w)).length
      if (score > bestScore) {
        bestScore = score
        best = skill
      }
    }

    return bestScore >= 1 ? best : null
  }
}
