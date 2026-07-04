import type { AgentToolCall, ExecutionContext, ToolExecutor, ToolResult, ToolSchema } from '../contracts'

export interface McpEndpoint {
  /** Base URL of the MCP server, e.g. https://tools.example.com/mcp */
  baseUrl: string
  /** Optional Authorization header value */
  authHeader?: string
  /** Default request timeout in ms */
  defaultTimeoutMs?: number
}

/**
 * MCP client-side ToolExecutor.
 * Communicates with an MCP server over JSON-RPC 2.0 (HTTP transport).
 * Optional fallback executor is called when the remote call fails.
 *
 * Install @modelcontextprotocol/sdk for full lifecycle support;
 * this implementation uses raw fetch for minimal overhead.
 */
export class McpToolExecutor implements ToolExecutor {
  private toolCache: ToolSchema[] | null = null

  constructor(
    private readonly endpoint: McpEndpoint,
    private readonly fallback?: ToolExecutor,
  ) {}

  async execute(call: AgentToolCall, ctx: ExecutionContext): Promise<ToolResult> {
    const timeoutMs = ctx.timeoutMs ?? this.endpoint.defaultTimeoutMs ?? 15_000

    try {
      const result = await this.rpcCall(
        'tools/call',
        { name: call.name, arguments: call.arguments },
        call.id,
        timeoutMs,
      )

      const content: Array<{ type: string; text?: string }> = (result as { content?: Array<{ type: string; text?: string }> })?.content ?? []
      const outputText = content
        .filter(c => c.type === 'text')
        .map(c => c.text ?? '')
        .join('\n')
        .trim()

      return { id: call.id, name: call.name, ok: true, outputText }
    } catch (err) {
      const isFatal = err instanceof McpError && err.code !== 'TIMEOUT' && err.code !== 'NETWORK'
      if (!isFatal && this.fallback) {
        return this.fallback.execute(call, ctx)
      }
      return {
        id: call.id,
        name: call.name,
        ok: false,
        outputText: '',
        error: {
          kind: isFatal ? 'FATAL' : 'RETRYABLE',
          message: err instanceof Error ? err.message : String(err),
          cause: err,
        },
      }
    }
  }

  async listAvailableTools(_ctx: ExecutionContext): Promise<ToolSchema[]> {
    if (this.toolCache) return this.toolCache

    try {
      const result = await this.rpcCall('tools/list', {}, 'list', 10_000)
      const tools: ToolSchema[] = ((result as { tools?: Array<{ name: string; description?: string; inputSchema?: unknown }> })?.tools ?? []).map((t) => ({
        name: t.name,
        description: t.description,
        schema: t.inputSchema,
      }))
      this.toolCache = tools
      return tools
    } catch {
      return []
    }
  }

  /** Invalidate tool list cache (call after server reconnect) */
  invalidateCache(): void {
    this.toolCache = null
  }

  private async rpcCall(method: string, params: unknown, id: string, timeoutMs: number): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' }
      if (this.endpoint.authHeader) {
        headers['authorization'] = this.endpoint.authHeader
      }

      const res = await fetch(this.endpoint.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const kind = res.status >= 500 ? 'NETWORK' : 'FATAL'
        throw new McpError(`MCP HTTP ${res.status}`, kind)
      }

      const json = (await res.json()) as { result?: unknown; error?: { message: string } }
      if (json.error) {
        throw new McpError(json.error.message, 'FATAL')
      }
      return json.result
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new McpError(`MCP request timeout after ${timeoutMs}ms`, 'TIMEOUT')
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}

class McpError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'NETWORK' | 'FATAL',
  ) {
    super(message)
    this.name = 'McpError'
  }
}
