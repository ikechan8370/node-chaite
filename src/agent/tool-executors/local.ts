import type { AgentToolCall, ExecutionContext, ToolExecutor, ToolResult, ToolSchema } from '../contracts'
import type { Tool } from '../../types/tools'

/**
 * Default fallback executor: runs tools in-process via tool.run().
 * Used when no remote/sandbox executor is configured.
 */
export class LocalToolExecutor implements ToolExecutor {
  constructor(private readonly getTools: () => Tool[]) {}

  async execute(call: AgentToolCall, _ctx: ExecutionContext): Promise<ToolResult> {
    const tool = this.getTools().find(t => t.function.name === call.name)
    if (!tool) {
      return {
        id: call.id,
        name: call.name,
        ok: false,
        outputText: '',
        error: {
          kind: 'FATAL',
          message: `Tool "${call.name}" not found in local registry`,
        },
      }
    }

    try {
      const raw = await tool.run(call.arguments as never)
      const outputText = typeof raw === 'string' ? raw : JSON.stringify(raw)
      return { id: call.id, name: call.name, ok: true, outputText }
    } catch (err) {
      return {
        id: call.id,
        name: call.name,
        ok: false,
        outputText: '',
        error: {
          kind: 'RETRYABLE',
          message: err instanceof Error ? err.message : String(err),
          cause: err,
        },
      }
    }
  }

  listAvailableTools(_ctx: ExecutionContext): Promise<ToolSchema[]> {
    return Promise.resolve(
      this.getTools().map(t => ({
        name: t.function.name,
        description: t.function.description,
        schema: t.function.parameters,
      })),
    )
  }
}
