import OpenAI from 'openai'
import { buildOpenAIRequest } from './request'
import { SendMessageOption } from '../../../types/adapter'
import type { IMessage, TextContent, Tool } from '../../../types'
const history: IMessage[] = [{ role: 'user', content: [{ type: 'text', text: 'hi' } as TextContent] }]
const tool = { function: { name: 'search', parameters: { type: 'object', properties: {} } } } as Tool
const request = (options: Partial<SendMessageOption>, tools: Tool[] = [], url = 'https://api.openai.com/v1') => buildOpenAIRequest(history, tools, SendMessageOption.create(options), url)

describe('OpenAI request compatibility', () => {
  test.each(['gpt-5', 'gpt-5.4', 'o3', 'o4-mini'])('%s omits unsupported sampling and vendor budgets', model => {
    const body = request({ model, temperature: 0.7, enableReasoning: true, reasoningEffort: 'medium', reasoningBudgetTokens: 2000 })
    expect(body.reasoning_effort).toBe('medium')
    expect(body).not.toHaveProperty('temperature')
    expect(body).not.toHaveProperty('thinking_budget_tokens')
  })
  test('detects reasoning models without a checkbox and allows sampling only with explicit none', () => {
    expect(request({ model: 'gpt-5.4', temperature: 0.7 })).not.toHaveProperty('temperature')
    expect(request({ model: 'gpt-5.4', openaiReasoningEffort: 'none', temperature: 0.7 }).temperature).toBe(0.7)
    expect(() => request({ model: 'o3', openaiReasoningEffort: 'none' })).toThrow(/不支持/)
    expect(request({ model: 'gpt-5.4', reasoningEffort: 'minimal' }).reasoning_effort).toBe('low')
    expect(request({ model: 'gpt-4.1', temperature: 0.3, enableReasoning: true })).not.toHaveProperty('reasoning_effort')
  })
  test('none, required and named tool choices are transmitted correctly', () => {
    expect(request({ toolChoice: { type: 'none' } }, [tool]).tool_choice).toBe('none')
    expect(request({ toolChoice: { type: 'any' } }, [tool]).tool_choice).toBe('required')
    expect(request({ toolChoice: { type: 'specified', tools: ['search'] } }, [tool]).tool_choice).toEqual({ type: 'function', function: { name: 'search' } })
    expect(() => request({ toolChoice: { type: 'specified', tools: ['missing'] } }, [tool])).toThrow(/当前 tools/)
    expect(() => request({ toolChoice: { type: 'any' } })).toThrow(/至少/)
  })
  test('compatible token limits and llama budgets are explicit and kept off official endpoints', () => {
    expect(request({ model: 'llama', maxToken: 1000, enableReasoning: true, reasoningBudgetTokens: 2000 }, [], 'http://localhost:8080/v1')).toMatchObject({ max_tokens: 1000 })
    expect(request({ model: 'llama', enableReasoning: true, reasoningBudgetTokens: 2000 }, [], 'http://localhost:8080/v1')).not.toHaveProperty('thinking_budget_tokens')
    expect(request({ model: 'llama', openaiThinkingBudgetTokens: 2000, openaiMaxTokenField: 'max_completion_tokens', maxToken: 1000 }, [], 'http://localhost:8080/v1')).toMatchObject({ thinking_budget_tokens: 2000, max_completion_tokens: 1000 })
    expect(() => request({ openaiThinkingBudgetTokens: 2000 })).toThrow(/不支持 thinking_budget_tokens/)
  })
  test('official requests strip reasoning_content imported from compatible-server history', () => {
    const source: IMessage[] = [{ role: 'assistant', content: [{ type: 'provider_context', provider: 'openai', data: { reasoning_content: 'private reasoning' } }, { type: 'text', text: 'answer' }] } as unknown as IMessage, ...history]
    const body = buildOpenAIRequest(source, [], SendMessageOption.create({ model: 'gpt-5.4' }))
    expect(body.messages[0]).not.toHaveProperty('reasoning_content')
  })
  test('unsupported Chat Completions tool models fail locally with the required API', () => {
    expect(() => request({ model: 'gpt-6-astra' }, [tool])).toThrow(/Responses API/)
    expect(request({ model: 'gpt-6-astra', toolChoice: { type: 'none' } }, [tool])).not.toHaveProperty('tools')
  })
  test('compatible reasoning servers keep the widely supported system role', () => {
    expect(request({ model: 'compatible-model', isThinkingModel: true, systemOverride: 'instructions' }, [], 'https://compatible.example/v1').messages[0].role).toBe('system')
    expect(request({ model: 'gpt-5.4', systemOverride: 'instructions' }).messages[0].role).toBe('developer')
  })
  test('reasoning-only legacy history does not become a null assistant message', () => {
    const source = [{ role: 'assistant', content: [{ type: 'reasoning', text: 'old reasoning' }] } as unknown as IMessage, ...history]
    expect(buildOpenAIRequest(source, [], SendMessageOption.create({ model: 'gpt-5.4' })).messages).toHaveLength(1)
  })
  test('SDK serializes the same validated payload for the non-streaming path', async () => {
    let sent: Record<string, unknown> | undefined
    const sdk = new OpenAI({ apiKey: 'test', fetch: async (_url, init) => {
      sent = JSON.parse(String(init?.body))
      return new Response(JSON.stringify({ id: 'test', object: 'chat.completion', created: 0, model: 'gpt-5.4', choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }] }), { headers: { 'content-type': 'application/json' } })
    } })
    await sdk.chat.completions.create({ ...request({ model: 'gpt-5.4', enableReasoning: true, temperature: 0.4, reasoningBudgetTokens: 2000, toolChoice: { type: 'none' } }, [tool]), stream: false })
    expect(sent?.tool_choice).toBe('none')
    expect(sent).not.toHaveProperty('thinking_budget_tokens')
    expect(sent).not.toHaveProperty('temperature')
  })
})
