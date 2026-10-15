import type Anthropic from '@anthropic-ai/sdk'
import { getFromChaiteConverter, getIntoChaiteConverter } from '../../../utils/converter'
import type { AssistantMessage, IMessage, ReasoningContent, TextContent, ToolCall, ToolCallResultMessage } from '../../../types'
import './converter'

const fromClaude = getIntoChaiteConverter('claude')
const toClaude = getFromChaiteConverter('claude')
const response = (content: unknown[]) => ({ role: 'assistant', content }) as unknown as Anthropic.Message

describe('Claude message conversion', () => {
  test('preserves empty thinking, signatures, redacted blocks, citations, and tool block order through JSON history', () => {
    const blocks = [
      { type: 'thinking', thinking: '', signature: 'encrypted-a' },
      { type: 'text', text: 'first', citations: null },
      { type: 'tool_use', id: 'call-a', name: 'search', input: { query: 'a' } },
      { type: 'thinking', thinking: 'summary', signature: 'encrypted-b' },
      { type: 'redacted_thinking', data: 'encrypted-redacted' },
      { type: 'text', text: 'second' },
      { type: 'tool_use', id: 'call-b', name: 'search', input: { query: 'b' } },
    ]
    const converted = fromClaude(response(blocks)) as AssistantMessage
    expect(converted.content.filter(part => part.type === 'reasoning')).toEqual([{ type: 'reasoning', text: 'summary' }])
    expect(converted.toolCalls?.map(call => call.id)).toEqual(['call-a', 'call-b'])
    expect(toClaude(JSON.parse(JSON.stringify(converted))).content).toEqual(blocks)
  })

  test('postprocessor text/tool changes are respected without altering signed thinking', () => {
    const converted = fromClaude(response([
      { type: 'thinking', thinking: '', signature: 'signature' },
      { type: 'text', text: 'old' },
      { type: 'tool_use', id: 'call', name: 'search', input: { query: 'old' } },
    ])) as AssistantMessage
    ;(converted.content.find(part => part.type === 'text') as TextContent).text = 'filtered'
    converted.toolCalls![0].function.arguments = { query: 'new' }
    const blocks = toClaude(converted).content
    expect(blocks).toEqual([
      { type: 'thinking', thinking: '', signature: 'signature' },
      { type: 'text', text: 'filtered' },
      { type: 'tool_use', id: 'call', name: 'search', input: { query: 'new' } },
    ])
    converted.toolCalls = []
    expect(toClaude(converted).content).toHaveLength(2)
  })

  test('opaque Claude context does not cause signatureless legacy reasoning to be sent', () => {
    const legacy: AssistantMessage = { role: 'assistant', content: [{ type: 'reasoning', text: 'old summary without a signature' } as ReasoningContent, { type: 'text', text: 'answer' } as TextContent] }
    expect(toClaude(legacy).content).toEqual([{ type: 'text', text: 'answer' }])
  })

  test('supports data URLs, base64 prefixes, remote images, and removes null/empty unsupported blocks', () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'
    const converted = toClaude({ role: 'user', content: [
      { type: 'audio' }, { type: 'text', text: '' }, { type: 'text', text: 'question' },
      { type: 'image', image: `data:image/png;base64,${png}` },
      { type: 'image', image: `base64://${png}`, mimeType: 'image/jpeg' },
      { type: 'image', image: 'https://example.com/a.png' },
    ] } as IMessage)
    expect(converted.content).toEqual([
      { type: 'text', text: 'question' },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png } },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: png } },
      { type: 'image', source: { type: 'url', url: 'https://example.com/a.png' } },
    ])
  })

  test('stringified tool input is parsed and invalid arrays fail locally', () => {
    const call = { id: 'call', type: 'function', function: { name: 'search', arguments: '{"query":"test"}' } } as unknown as ToolCall
    const source: AssistantMessage = { role: 'assistant', content: [], toolCalls: [call] }
    expect(toClaude(source).content).toEqual([{ type: 'tool_use', id: 'call', name: 'search', input: { query: 'test' } }])
    call.function.arguments = [] as unknown as ToolCall['function']['arguments']
    expect(() => toClaude(source)).toThrow(/JSON 对象/)
  })

  test('tool results keep IDs and empty results while rejecting missing IDs', () => {
    expect(toClaude({ role: 'tool', content: [{ type: 'tool', tool_call_id: 'call', content: '' }] } as ToolCallResultMessage).content).toEqual([{ type: 'tool_result', tool_use_id: 'call', content: '' }])
    expect(() => toClaude({ role: 'tool', content: [{ type: 'tool', content: 'missing id' }] } as ToolCallResultMessage)).toThrow(/tool_call_id/)
  })
})
