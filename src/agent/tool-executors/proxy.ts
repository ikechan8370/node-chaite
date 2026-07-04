import * as crypto from 'node:crypto'
import type { Tool, Parameter } from '../../types/tools'
import type { ChaiteContext } from '../../types/common'
import type { ToolExecutor, ToolSchema } from '../contracts'

/**
 * Wraps a remote tool schema (from MCP or any ToolExecutor) as an in-process Tool.
 *
 * This allows local and remote tools to coexist in the same tool list.
 * AbstractClient.fullfillTools() creates these proxies for each tool
 * discovered via toolExecutor.listAvailableTools(), then adds them to this.tools.
 * The execution loop then uniformly calls tool.run() for every tool —
 * no if/else branching needed.
 */
export class McpToolProxy implements Tool {
  readonly name: string
  readonly type = 'function' as const
  readonly function: { name: string; description: string; parameters: Parameter }

  constructor(
    schema: ToolSchema,
    private readonly executor: ToolExecutor,
    private readonly execCtxBuilder: () => import('../contracts').ExecutionContext,
  ) {
    this.name = schema.name
    this.function = {
      name: schema.name,
      description: (schema.description ?? '') as string,
      parameters: (schema.schema as Parameter) ?? {
        type: 'object',
        properties: {},
        required: [],
      },
    }
  }

  async run(
    args: Record<string, unknown>,
    _context?: ChaiteContext,
  ): Promise<string> {
    const result = await this.executor.execute(
      { id: crypto.randomUUID(), name: this.name, arguments: args },
      this.execCtxBuilder(),
    )

    if (!result.ok) {
      throw new Error(result.error?.message ?? `MCP tool "${this.name}" failed`)
    }

    return result.outputText
  }
}
