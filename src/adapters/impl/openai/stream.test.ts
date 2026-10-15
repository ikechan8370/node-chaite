import type OpenAI from 'openai'
import { OpenAIStreamAccumulator } from './stream'
import type { ReasoningPart } from '../../../types'
const chunk = (delta: unknown) => ({ id: 'stream', model: 'test', choices: [{ index: 0, delta }] }) as OpenAI.ChatCompletionChunk

describe('OpenAI streaming assembly', () => {
  test('interleaved parallel calls retain separate arguments, names and initial IDs', () => {
    const accumulator = new OpenAIStreamAccumulator()
    expect(accumulator.push(chunk({ tool_calls: [
      { index: 0, id: 'call-a', function: { name: 'search', arguments: '{"q":' } },
      { index: 1, id: 'call-b', function: { name: 'weather', arguments: '{"city":' } },
    ] }))).toBeUndefined()
    const b = accumulator.push(chunk({ tool_calls: [{ index: 1, function: { arguments: '"Shanghai"}' } }] }))
    const a = accumulator.push(chunk({ tool_calls: [{ index: 0, function: { arguments: '"Beijing"}' } }] }))
    expect(b?.toolCall).toEqual([{ id: 'call-b', type: 'function', function: { name: 'weather', arguments: { city: 'Shanghai' } } }])
    expect(a?.toolCall).toEqual([{ id: 'call-a', type: 'function', function: { name: 'search', arguments: { q: 'Beijing' } } }])
    expect(accumulator.push(chunk({ tool_calls: [{ index: 0 }] }))).toBeUndefined()
    expect(accumulator.push(chunk({ tool_calls: [{ index: 0, function: { arguments: ' \n' } }] }))).toBeUndefined()
  })
  test('reasoning deltas accumulate for both callbacks and persisted final history', () => {
    const accumulator = new OpenAIStreamAccumulator()
    expect(accumulator.push(chunk({ reasoning_content: 'think ' }))?.delta).toEqual([{ type: 'reasoning', text: 'think ' }])
    accumulator.push(chunk({ reasoning_content: 'more' }))
    const completion = { choices: [{ index: 0, message: { role: 'assistant', content: 'answer' } }] } as OpenAI.ChatCompletion
    accumulator.applyReasoning(completion)
    expect((completion.choices[0].message as ReasoningPart).reasoning_content).toBe('think more')
    expect(accumulator.push({ choices: [] } as unknown as OpenAI.ChatCompletionChunk)).toBeUndefined()
  })
})
