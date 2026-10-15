import Anthropic from '@anthropic-ai/sdk'
import { buildClaudeRequest } from './request'
import { SendMessageOption } from '../../../types/adapter'
import type { IMessage, TextContent, Tool } from '../../../types'

const messages: IMessage[] = [{ role: 'user', content: [{ type: 'text', text: 'Hello' } as TextContent] }]
const tool = { function: { name: 'search', description: 'Search', parameters: { type: 'object', properties: {} } } } as Tool
const request = (options: Partial<SendMessageOption> = {}, history = messages, tools: Tool[] = []) => buildClaudeRequest(history, tools, SendMessageOption.create(options))

describe('Claude request compatibility', () => {
  test.each(['claude-haiku-5-5', 'haiku-5.5', 'anthropic/claude-haiku-5-5', 'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-opus-5-5', 'claude-sonnet-5-5'])('%s uses adaptive thinking and effort', model => {
    const body = request({ model, enableReasoning: true, reasoningBudgetTokens: 2048, reasoningEffort: 'medium', temperature: 0.7 })
    expect(body.thinking).toEqual({ type: 'adaptive', display: 'summarized' })
    expect(body.output_config).toEqual({ effort: 'medium' })
    expect(body).not.toHaveProperty('temperature')
    expect(body.thinking).not.toHaveProperty('budget_tokens')
  })

  test.each(['claude-haiku-4-5-20251001', 'claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219'])('%s keeps manual thinking and a valid budget', model => {
    const body = request({ model, enableReasoning: true, reasoningBudgetTokens: 2048, maxToken: 4096, temperature: 0.7 })
    expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 2048 })
    expect(body).not.toHaveProperty('temperature')
    expect(body).not.toHaveProperty('output_config')
  })

  test('normal legacy requests retain temperature', () => {
    expect(request({ model: 'claude-haiku-4-5', enableReasoning: false, temperature: 0.7 }).temperature).toBe(0.7)
  })

  test('Haiku 5.5 honors disabled thinking without invalid sampling parameters', () => {
    expect(request({ model: 'claude-haiku-5-5', enableReasoning: false, reasoningEffort: 'medium', temperature: 0.5 })).toMatchObject({
      thinking: { type: 'disabled' }, output_config: { effort: 'medium' },
    })
    expect(request({ model: 'claude-haiku-5-5' })).not.toHaveProperty('thinking')
  })

  test('supports max/xhigh effort and maps minimal to low', () => {
    expect(request({ model: 'claude-haiku-5-5', enableReasoning: true, claudeEffort: 'max' }).output_config?.effort).toBe('max')
    expect(request({ model: 'claude-haiku-5-5', enableReasoning: true, claudeEffort: 'xhigh' }).output_config?.effort).toBe('xhigh')
    expect(request({ model: 'claude-haiku-5-5', reasoningEffort: 'minimal' }).output_config?.effort).toBe('low')
    expect(() => request({ model: 'claude-sonnet-4-6', claudeEffort: 'xhigh' })).toThrow(/xhigh/)
    expect(() => request({ model: 'claude-haiku-5-5', enableReasoning: false, claudeEffort: 'max' })).toThrow(/adaptive/)
  })

  test('handles newer models that cannot disable thinking', () => {
    expect(request({ model: 'claude-opus-5-5', enableReasoning: false }).thinking?.type).toBe('adaptive')
    expect(request({ model: 'claude-sonnet-5-5', enableReasoning: false }).thinking?.type).toBe('between_tools')
    expect(() => request({ model: 'claude-opus-5-5', claudeThinkingMode: 'disabled' })).toThrow(/不支持关闭/)
  })

  test('gateway aliases can explicitly select adaptive thinking', () => {
    const options = SendMessageOption.create({ model: 'my-custom-model', claudeThinkingMode: 'adaptive', claudeEffort: 'high' })
    const restored = SendMessageOption.create(JSON.parse(options.toString()))
    expect(request(restored).thinking?.type).toBe('adaptive')
    expect(request(restored).output_config?.effort).toBe('high')
  })

  test('validates legacy budgets before sending invalid requests', () => {
    expect(request({ enableReasoning: true }).max_tokens).toBeGreaterThan(1024)
    expect(() => request({ enableReasoning: true, reasoningBudgetTokens: 500 })).toThrow(/reasoningBudgetTokens/)
    expect(() => request({ enableReasoning: true, reasoningBudgetTokens: 2048, maxToken: 1024 })).toThrow(/maxToken/)
    expect(() => request({ maxToken: 0 })).toThrow(/maxToken/)
  })

  test('validates tool selection and allows adaptive forced tools', () => {
    expect(request({ model: 'claude-haiku-5-5', enableReasoning: true, toolChoice: { type: 'any' } }, messages, [tool]).tool_choice).toEqual({ type: 'any' })
    expect(request({ model: 'claude-haiku-5-5', enableReasoning: true, toolChoice: { type: 'specified', tools: ['search'] } }, messages, [tool]).tool_choice).toEqual({ type: 'tool', name: 'search' })
    expect(() => request({ enableReasoning: true, toolChoice: { type: 'any' } }, messages, [tool])).toThrow(/手动 thinking/)
    expect(() => request({ toolChoice: { type: 'any' } })).toThrow(/至少需要/)
    expect(() => request({ toolChoice: { type: 'specified', tools: ['missing'] } }, messages, [tool])).toThrow(/当前 tools/)
    expect(request({ toolChoice: { type: 'auto' } })).not.toHaveProperty('tool_choice')
  })

  test('system/developer history goes into the system field and empty content is omitted', () => {
    const history: IMessage[] = [
      { role: 'system', content: [{ type: 'text', text: 'system' } as TextContent] },
      { role: 'developer', content: [{ type: 'text', text: 'developer' } as TextContent] },
      { role: 'user', content: [{ type: 'audio' }] },
      ...messages,
    ]
    const body = request({ systemOverride: 'override' }, history)
    expect(body.system).toBe('override\n\nsystem\n\ndeveloper')
    expect(body.messages).toHaveLength(1)
    expect(() => request({ model: 'claude-haiku-5-5' }, [{ role: 'assistant', content: [{ type: 'text', text: 'prefill' } as TextContent] }])).toThrow(/prefill/)
  })

  test('latest SDK serializes an actual Haiku 5.5 request without legacy fields', async () => {
    let captured: Record<string, unknown> | undefined
    const sdk = new Anthropic({
      apiKey: 'test-key',
      fetch: async (_url, init) => {
        captured = JSON.parse(String(init?.body))
        return new Response(JSON.stringify({ id: 'test', type: 'message', role: 'assistant', model: 'claude-haiku-5-5', content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }), { headers: { 'content-type': 'application/json' } })
      },
    })
    const result = await sdk.messages.create(request({ model: 'claude-haiku-5-5', enableReasoning: true, reasoningEffort: 'high', temperature: 0.5 }))
    expect(result.content[0].type).toBe('text')
    expect(captured).toMatchObject({ thinking: { type: 'adaptive', display: 'summarized' }, output_config: { effort: 'high' } })
    expect(captured).not.toHaveProperty('temperature')
    expect(captured?.thinking).not.toHaveProperty('budget_tokens')
  })
})
