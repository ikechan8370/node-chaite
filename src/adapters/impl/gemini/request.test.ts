import { ThinkingLevel, HarmCategory, HarmBlockThreshold } from '@google/genai'
import { buildGeminiRequest, buildGeminiThinking, geminiApiVersion } from './request'
import { SendMessageOption } from '../../../types/adapter'
import type { IMessage, TextContent } from '../../../types'
const history: IMessage[] = [{ role: 'user', content: [{ type: 'text', text: 'hi' } as TextContent] }]
const thinking = (model: string, options: Partial<SendMessageOption>) => buildGeminiThinking(model, SendMessageOption.create(options))

describe('Gemini request compatibility', () => {
  test('explicit API versions are not appended twice, even without built-in tools', () => {
    expect(geminiApiVersion('https://proxy.example/v1beta/', false)).toBe('')
    expect(geminiApiVersion('https://proxy.example/v1', false)).toBe('')
    expect(geminiApiVersion('https://proxy.example', true)).toBe('v1')
    expect(geminiApiVersion('https://generativelanguage.googleapis.com', true)).toBeUndefined()
  })
  test.each(['gemini-3-flash-preview', 'gemini-3.8-flash', 'models/gemini-4-argon'])('%s uses levels instead of legacy budgets', model => {
    const config = thinking(model, { enableReasoning: true, reasoningEffort: 'high', reasoningBudgetTokens: 2000 })
    expect(config).toEqual({ thinkingLevel: ThinkingLevel.HIGH, includeThoughts: true })
    expect(config).not.toHaveProperty('thinkingBudget')
  })
  test('chooses supported minimum levels when thinking cannot be disabled', () => {
    expect(thinking('gemini-4-argon', { enableReasoning: false })?.thinkingLevel).toBe(ThinkingLevel.LOW)
    expect(thinking('gemini-3-flash-preview', { enableReasoning: false })?.thinkingLevel).toBe(ThinkingLevel.MINIMAL)
    expect(thinking('gemini-3.8-flash', { reasoningEffort: 'minimal', enableReasoning: true })?.thinkingLevel).toBe(ThinkingLevel.LOW)
    expect(() => thinking('gemini-4-argon', { geminiThinkingLevel: 'minimal' })).toThrow(/不支持/)
    expect(thinking('gemini-4-argon', {})?.thinkingLevel).toBe(ThinkingLevel.MEDIUM)
  })
  test('2.5 uses budget, supports genuine off where available, and validates Pro bounds', () => {
    expect(thinking('gemini-2.5-flash', { enableReasoning: true, reasoningBudgetTokens: 2048 })).toEqual({ includeThoughts: true, thinkingBudget: 2048 })
    expect(thinking('gemini-2.5-flash', { enableReasoning: false })?.thinkingBudget).toBe(0)
    expect(thinking('gemini-2.5-pro', { enableReasoning: false })?.thinkingBudget).toBe(128)
    expect(() => thinking('gemini-2.5-pro', { enableReasoning: true, reasoningBudgetTokens: 0 })).toThrow(/thinkingBudget/)
    expect(() => thinking('gemini-2.5-flash', { geminiThinkingLevel: 'high' })).toThrow(/不支持 thinkingLevel/)
    expect(thinking('gemini-2.0-flash', { enableReasoning: true })).toBeUndefined()
  })
  test('system/developer messages and safety settings are formatted without mutating the preset', async () => {
    const options = SendMessageOption.create({ model: 'gemini-3.8-flash', systemOverride: 'override', safetySettings: [{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE, method: 'SEVERITY' } as unknown as NonNullable<SendMessageOption['safetySettings']>[number]] })
    const { request } = await buildGeminiRequest([{ role: 'developer', content: [{ type: 'text', text: 'instructions' } as TextContent] }, ...history], [], options)
    expect(request.config?.systemInstruction).toBe('override\n\ninstructions')
    expect(request.config?.safetySettings?.[0]).not.toHaveProperty('method')
    expect(options.safetySettings?.[0]).toHaveProperty('method', 'SEVERITY')
  })
  test('public remote images are downloaded and encoded, not used as base64 URLs', async () => {
    const original = global.fetch
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'base64')
    global.fetch = jest.fn(async () => new Response(png, { headers: { 'content-type': 'application/octet-stream' } })) as typeof fetch
    try {
      const { request } = await buildGeminiRequest([{ role: 'user', content: [{ type: 'image', image: 'https://example.com/image' }] } as unknown as IMessage], [], SendMessageOption.create({ model: 'gemini-3-flash-preview' }))
      expect(request.contents).toEqual([{ role: 'user', parts: [{ inlineData: { data: png.toString('base64'), mimeType: 'image/png' } }] }])
      expect(global.fetch).toHaveBeenCalledTimes(1)
    } finally { global.fetch = original }
  })
})
