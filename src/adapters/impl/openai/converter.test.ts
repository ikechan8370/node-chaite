import { getFromChaiteConverter, getIntoChaiteConverter } from '../../../utils/converter'
import type { OpenAICompatibleMessageParam } from '../../../utils/converter'
import type { AssistantMessage, IMessage, ProviderContextContent, ReasoningContent, TextContent, ToolCallResultMessage, UserMessage } from '../../../types'
import './converter'
const toOpenAI = getFromChaiteConverter('openai')
const fromOpenAI = getIntoChaiteConverter('openai')

describe('OpenAI message conversion', () => {
  test('reasoning does not leak into assistant content and null-content reasoning/tool turns survive', () => {
    const source = fromOpenAI({ role: 'assistant', content: null, reasoning_content: 'think', tool_calls: [{ id: 'call', type: 'function', function: { name: 'search', arguments: '{"q":"test"}' } }] } as OpenAICompatibleMessageParam) as AssistantMessage
    expect(source.content.find(part => part.type === 'reasoning')).toEqual({ type: 'reasoning', text: 'think' })
    expect(toOpenAI(source)).toMatchObject({ role: 'assistant', content: null, reasoning_content: 'think' })
    source.content.push({ type: 'text', text: 'answer' } as TextContent)
    expect(toOpenAI(source)).toMatchObject({ content: 'answer' })
    const legacy: AssistantMessage = { role: 'assistant', content: [{ type: 'reasoning', text: 'secret' } as ReasoningContent, { type: 'text', text: 'visible' } as TextContent] }
    expect(toOpenAI(legacy)).toMatchObject({ content: 'visible' })
  })
  test('image MIME and data URL prefixes are preserved correctly', () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'
    const source: UserMessage = { role: 'user', content: [{ type: 'image', image: png, mimeType: 'image/png' }, { type: 'image', image: `data:image/png;base64,${png}` }, { type: 'image', image: `base64://${png}` }] }
    const output = toOpenAI(source)
    expect(Array.isArray(output)).toBe(false)
    expect((output as { content: unknown }).content).toEqual(Array.from({ length: 3 }, () => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${png}` } })))
  })
  test('system and developer messages are accepted', () => {
    for (const role of ['system', 'developer'] as const) expect(toOpenAI({ role, content: [{ type: 'text', text: 'instructions' } as TextContent] })).toEqual({ role, content: 'instructions' })
  })
  test('refusals and empty tool arguments return meaningful content', () => {
    const response = fromOpenAI({ role: 'assistant', content: null, refusal: 'Cannot do that', tool_calls: [{ id: 'call', type: 'function', function: { name: 'search', arguments: '' } }] } as OpenAICompatibleMessageParam) as AssistantMessage
    expect(response.content[0]).toEqual({ type: 'text', text: 'Cannot do that' })
    expect(response.toolCalls?.[0].function.arguments).toEqual({})
    const call = response.toolCalls![0]
    call.function.arguments = '{"q":"test"}' as unknown as typeof call.function.arguments
    expect((toOpenAI(response) as { tool_calls: Array<{ function: { arguments: string } }> }).tool_calls[0].function.arguments).toBe('{"q":"test"}')
  })
  test('tool messages converted from multipart content keep their type and correlation ID', () => {
    const converted = fromOpenAI({ role: 'tool', tool_call_id: 'call', content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] } as OpenAICompatibleMessageParam) as ToolCallResultMessage
    expect(converted.content).toEqual([{ type: 'tool', tool_call_id: 'call', content: 'ab' }])
    expect(toOpenAI(converted)).toEqual([{ role: 'tool', tool_call_id: 'call', content: 'ab' }])
  })
  test('foreign opaque context is not sent to OpenAI', () => {
    const source: AssistantMessage = { role: 'assistant', content: [{ type: 'provider_context', provider: 'claude', data: { content: [] } } as ProviderContextContent, { type: 'text', text: 'answer' } as TextContent] }
    expect(toOpenAI(source)).toEqual({ role: 'assistant', content: 'answer' })
  })
})
