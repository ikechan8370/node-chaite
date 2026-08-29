import {
  FunctionCallingConfig,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  Tool,
  ToolConfig,
} from '@google/genai'
import { SendMessageOption } from '../../../types'

export type GeminiBuiltinToolName = 'googleSearch' | 'googleMaps' | 'codeExecution' | 'urlContext'

export function isGemini3Model(model: string): boolean {
  return /(?:^|\/)gemini-3(?:[.-]|$)/i.test(model)
}

export function buildGeminiTooling(
  functionDeclarations: FunctionDeclaration[],
  builtinToolNames: GeminiBuiltinToolName[],
  toolChoice: SendMessageOption['toolChoice'],
  model: string,
): { tools?: Tool[], toolConfig?: ToolConfig, suppressedBuiltinTools: boolean, hasEffectiveBuiltinTools: boolean } {
  const functionTools: Tool[] = functionDeclarations.length > 0 ? [{ functionDeclarations }] : []
  const builtinTools: Tool[] = []
  for (const builtinTool of builtinToolNames) {
    switch (builtinTool) {
    case 'googleSearch':
      builtinTools.push({ googleSearch: {} })
      break
    case 'googleMaps':
      builtinTools.push({ googleMaps: {} })
      break
    case 'codeExecution':
      builtinTools.push({ codeExecution: {} })
      break
    case 'urlContext':
      builtinTools.push({ urlContext: {} })
      break
    }
  }

  const hasToolCombination = functionTools.length > 0 && builtinTools.length > 0
  const supportsToolCombination = isGemini3Model(model)
  const suppressedBuiltinTools = hasToolCombination && !supportsToolCombination
  const effectiveBuiltinTools = suppressedBuiltinTools ? [] : builtinTools
  const tools = functionTools.length > 0 || effectiveBuiltinTools.length > 0
    ? [...functionTools, ...effectiveBuiltinTools]
    : undefined

  const includeServerSideToolInvocations = supportsToolCombination && effectiveBuiltinTools.length > 0
  const modeMap = {
    'none': FunctionCallingConfigMode.NONE,
    'any': FunctionCallingConfigMode.ANY,
    'auto': includeServerSideToolInvocations ? FunctionCallingConfigMode.VALIDATED : FunctionCallingConfigMode.AUTO,
    'specified': FunctionCallingConfigMode.ANY,
  }
  const functionCallingConfig = functionDeclarations.length > 0 ? {
    mode: modeMap[toolChoice?.type || 'auto'],
    allowedFunctionNames: toolChoice?.type === 'specified' ? toolChoice.tools : undefined,
  } as FunctionCallingConfig : undefined
  const toolConfig = functionCallingConfig || includeServerSideToolInvocations ? {
    ...(functionCallingConfig ? { functionCallingConfig } : {}),
    ...(includeServerSideToolInvocations ? { includeServerSideToolInvocations: true } : {}),
  } as ToolConfig : undefined

  return {
    tools,
    toolConfig,
    suppressedBuiltinTools,
    hasEffectiveBuiltinTools: effectiveBuiltinTools.length > 0,
  }
}
