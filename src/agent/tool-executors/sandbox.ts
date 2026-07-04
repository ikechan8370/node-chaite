import { spawn } from 'node:child_process'
import type {
  AgentToolCall,
  ExecutionContext,
  SandboxExecutor,
  SandboxOptions,
  SandboxResult,
  ToolExecutor,
  ToolResult,
} from '../contracts'

// ─── SandboxExecutor implementations ─────────────────────────────────────────

/**
 * Runs a trusted tool module in a separate child process with a restricted
 * environment and hard timeout.
 *
 * The tool entry file must accept a JSON string as its first CLI argument
 * and print its result to stdout.
 *
 * NOTE: This is NOT a security sandbox for untrusted code — it provides
 * resource isolation and timeout enforcement for trusted tool modules.
 * For untrusted code, delegate to a container-based remote sandbox.
 */
export class ChildProcessSandbox implements SandboxExecutor {
  async run(entry: string, argsJson: string, opts: SandboxOptions = {}): Promise<SandboxResult> {
    const timeoutMs = opts.timeoutMs ?? 10_000
    const env = opts.env ?? {}
    const maxBytes = opts.maxOutputBytes ?? 512 * 1024

    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [entry, argsJson], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...env, NODE_ENV: 'production' },
      })

      let output = ''
      let timedOut = false

      const timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGKILL')
      }, timeoutMs)

      const onData = (chunk: Buffer) => {
        if (output.length < maxBytes) {
          output += chunk.toString('utf8')
        }
      }

      child.stdout.on('data', onData)
      child.stderr.on('data', onData)

      child.on('error', err => {
        clearTimeout(timer)
        reject(err)
      })

      child.on('exit', code => {
        clearTimeout(timer)
        resolve({
          output: output.trim(),
          exitCode: code ?? -1,
          timedOut,
        })
      })
    })
  }
}

/**
 * Delegates sandbox execution to a remote REST API.
 * POST { entry, argsJson, opts } → { output, exitCode, timedOut }
 *
 * Use this when the process host is too resource-constrained to run
 * certain tools locally, but a remote sandbox service is available.
 */
export class RemoteSandboxExecutor implements SandboxExecutor {
  constructor(
    private readonly baseUrl: string,
    private readonly authHeader?: string,
  ) {}

  async run(entry: string, argsJson: string, opts: SandboxOptions = {}): Promise<SandboxResult> {
    const timeoutMs = (opts.timeoutMs ?? 15_000) + 2_000 // extra for network
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' }
      if (this.authHeader) headers['authorization'] = this.authHeader

      const res = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ entry, argsJson, opts }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Remote sandbox HTTP ${res.status}`)
      }

      return (await res.json()) as SandboxResult
    } finally {
      clearTimeout(timer)
    }
  }
}

// ─── SandboxedToolExecutor ────────────────────────────────────────────────────

/**
 * ToolExecutor that runs tools via a SandboxExecutor.
 * The tool must be a Node.js script that reads args from process.argv[2]
 * and writes the result to stdout.
 *
 * Requires a resolver function that maps tool name → entry file path.
 */
export class SandboxedToolExecutor implements ToolExecutor {
  constructor(
    private readonly sandbox: SandboxExecutor,
    private readonly resolveEntry: (toolName: string) => string | null,
    private readonly fallback?: ToolExecutor,
  ) {}

  async execute(call: AgentToolCall, ctx: ExecutionContext): Promise<ToolResult> {
    const entry = this.resolveEntry(call.name)

    if (!entry) {
      if (this.fallback) return this.fallback.execute(call, ctx)
      return {
        id: call.id,
        name: call.name,
        ok: false,
        outputText: '',
        error: { kind: 'FATAL', message: `No sandbox entry found for tool "${call.name}"` },
      }
    }

    try {
      const result = await this.sandbox.run(entry, JSON.stringify(call.arguments), {
        timeoutMs: ctx.timeoutMs,
      })

      if (result.timedOut) {
        return {
          id: call.id,
          name: call.name,
          ok: false,
          outputText: '',
          error: { kind: 'RETRYABLE', message: `Tool "${call.name}" timed out` },
        }
      }

      if (result.exitCode !== 0) {
        return {
          id: call.id,
          name: call.name,
          ok: false,
          outputText: result.output,
          error: { kind: 'FATAL', message: `Tool exited with code ${result.exitCode}` },
        }
      }

      return { id: call.id, name: call.name, ok: true, outputText: result.output }
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
}
