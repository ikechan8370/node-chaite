import { Content, GenerateContentResponse } from '@google/genai'
import { AssistantMessage, ProviderContextContent, ToolCallResultMessage } from '../../../types'
import { getFromChaiteConverter, getIntoChaiteConverter } from '../../../utils/converter'
import './converter'

describe('Gemini tool context conversion', () => {
  test('preserves server tool parts and function call ids across history', () => {
    const serverParts = [
      {
        toolCall: { id: 'server-call-1', toolType: 'GOOGLE_SEARCH', args: { query: 'weather' } },
        thoughtSignature: 'server-call-signature',
      },
      {
        toolResponse: { id: 'server-call-1', toolType: 'GOOGLE_SEARCH', response: { result: 'sunny' } },
      },
      { executableCode: { language: 'PYTHON', code: 'print(1)' } },
      { codeExecutionResult: { outcome: 'OUTCOME_OK', output: '1' } },
    ]
    const response = {
      candidates: [{
        content: {
          role: 'model',
          parts: [
            ...serverParts,
            {
              functionCall: { id: 'function-call-1', name: 'get_weather', args: { city: 'Beijing' } },
              thoughtSignature: 'function-call-signature',
            },
          ],
        },
      }],
    } as unknown as GenerateContentResponse

    const converted = getIntoChaiteConverter('gemini')(response) as AssistantMessage
    const contexts = converted.content.filter(part => part.type === 'provider_context') as ProviderContextContent[]

    expect(contexts.map(context => context.data)).toEqual(serverParts)
    expect(converted.toolCalls).toEqual([expect.objectContaining({
      id: 'function-call-1',
      thoughtSignature: 'function-call-signature',
      function: {
        name: 'get_weather',
        arguments: { city: 'Beijing' },
      },
    })])

    const roundTripped = getFromChaiteConverter('gemini')(converted) as Content
    expect(roundTripped.parts?.slice(0, serverParts.length)).toEqual(serverParts)
    expect(roundTripped.parts?.at(-1)).toEqual({
      functionCall: {
        id: 'function-call-1',
        name: 'get_weather',
        args: { city: 'Beijing' },
      },
      thoughtSignature: 'function-call-signature',
    })
  })

  test('echoes the matching function call id in tool results', () => {
    const toolResult: ToolCallResultMessage = {
      role: 'tool',
      content: [{
        type: 'tool',
        tool_call_id: 'function-call-1',
        name: 'get_weather',
        content: 'sunny',
      }],
    }

    expect(getFromChaiteConverter('gemini')(toolResult)).toEqual({
      role: 'user',
      parts: [{
        functionResponse: {
          id: 'function-call-1',
          name: 'get_weather',
          response: {
            name: 'get_weather',
            content: 'sunny',
          },
        },
      }],
    })
  })
})
