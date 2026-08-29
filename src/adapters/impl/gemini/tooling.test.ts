import { FunctionCallingConfigMode, FunctionDeclaration } from '@google/genai'
import { buildGeminiTooling, isGemini3Model } from './tooling'

const functionDeclarations: FunctionDeclaration[] = [{
  name: 'get_weather',
  description: 'Get weather',
}]

describe('Gemini tooling configuration', () => {
  test('detects Gemini 3 model names', () => {
    expect(isGemini3Model('gemini-3.7-flash')).toBe(true)
    expect(isGemini3Model('models/gemini-3-pro-preview')).toBe(true)
    expect(isGemini3Model('gemini-2.5-pro')).toBe(false)
  })

  test('keeps existing function tool behavior when built-in tools are disabled', () => {
    const result = buildGeminiTooling(functionDeclarations, [], undefined, 'gemini-2.5-pro')

    expect(result.suppressedBuiltinTools).toBe(false)
    expect(result.hasEffectiveBuiltinTools).toBe(false)
    expect(result.tools).toEqual([{ functionDeclarations }])
    expect(result.toolConfig).toEqual({
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    })
  })

  test('enables Gemini 3 context circulation and uses validated function calling', () => {
    const result = buildGeminiTooling(
      functionDeclarations,
      ['googleSearch', 'codeExecution'],
      undefined,
      'gemini-3.7-flash',
    )

    expect(result.suppressedBuiltinTools).toBe(false)
    expect(result.hasEffectiveBuiltinTools).toBe(true)
    expect(result.tools).toEqual([
      { functionDeclarations },
      { googleSearch: {} },
      { codeExecution: {} },
    ])
    expect(result.toolConfig).toEqual({
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.VALIDATED,
      },
      includeServerSideToolInvocations: true,
    })
  })

  test('keeps standalone built-in tools available to earlier Gemini models', () => {
    const result = buildGeminiTooling([], ['googleSearch'], undefined, 'gemini-2.5-pro')

    expect(result.suppressedBuiltinTools).toBe(false)
    expect(result.hasEffectiveBuiltinTools).toBe(true)
    expect(result.tools).toEqual([{ googleSearch: {} }])
    expect(result.toolConfig).toBeUndefined()
  })

  test('preserves existing function tools on models that cannot combine tools', () => {
    const result = buildGeminiTooling(
      functionDeclarations,
      ['googleSearch'],
      undefined,
      'gemini-2.5-pro',
    )

    expect(result.suppressedBuiltinTools).toBe(true)
    expect(result.hasEffectiveBuiltinTools).toBe(false)
    expect(result.tools).toEqual([{ functionDeclarations }])
    expect(result.toolConfig).toEqual({
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      },
    })
  })
})
