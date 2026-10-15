import type OpenAI from 'openai'
import type { IMessage, SendMessageOption, Tool } from '../../../types'
import { getFromChaiteConverter, getFromChaiteToolConverter } from '../../../utils/converter'
import './converter'

export type OpenAIRequest = OpenAI.ChatCompletionCreateParamsNonStreaming & { thinking_budget_tokens?: number }

export function buildOpenAIRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption, baseUrl = ''): OpenAIRequest {
  const model = options.model || 'gpt-4.1'
  const name = model.replace(/^openai\//i, '').toLowerCase()
  const knownOpenAI = /^(?:gpt-|chatgpt-|o[134](?:-|$))/.test(name)
  const reasoningModel = /^(?:gpt-[5-9](?:[.-]|$)|o[134](?:-|$))/.test(name)
  const officialEndpoint = !baseUrl || /^https:\/\/api\.openai\.com(?:\/|$)/i.test(baseUrl)
  const reasoning = reasoningModel || (!knownOpenAI && Boolean(options.enableReasoning || options.isThinkingModel))
  let effort = options.openaiReasoningEffort || (reasoning ? options.reasoningEffort : undefined)
  const gpt = /^gpt-(\d+)(?:\.(\d+))?/.exec(name)
  const supportsNone = gpt && (Number(gpt[1]) > 5 || Number(gpt[2] || 0) >= 1) && !/^gpt-6(?:\.1-sol|-astra)/.test(name)
  if (knownOpenAI && effort === 'none' && !supportsNone) throw new Error(`${model} 不支持 reasoning effort=none`)
  if (knownOpenAI && supportsNone && effort === 'minimal') effort = 'low'
  const responsesTools = /^gpt-6(?:\.1-sol|-astra)/.test(name)
  if (tools.length && options.toolChoice?.type !== 'none' && responsesTools) throw new Error(`${model} 的工具调用需要 Responses API，当前适配器使用 Chat Completions`)
  const messages: OpenAI.ChatCompletionMessageParam[] = []
  if (options.systemOverride) messages.push({ role: reasoningModel ? 'developer' : 'system', content: options.systemOverride })
  const converter = getFromChaiteConverter('openai')
  for (const history of histories) {
    const converted = converter(history)
    for (const message of Array.isArray(converted) ? converted : [converted]) {
      if (Array.isArray(message.content) && message.content.length === 0) continue
      if (message.role === 'assistant' && !message.content && !message.tool_calls?.length) continue
      if (message.role === 'assistant' && knownOpenAI) {
        // reasoning_content is a compatible-server extension, not an OpenAI request field.
        const copy = { ...message } as typeof message & { reasoning_content?: string }
        delete copy.reasoning_content
        messages.push(copy)
      } else messages.push(message)
    }
  }
  if (!messages.length) throw new Error('OpenAI 请求没有可发送的消息')
  let toolChoice: OpenAI.ChatCompletionToolChoiceOption | undefined
  switch (options.toolChoice?.type) {
  case 'specified': {
    const name = options.toolChoice.tools?.[0]
    if (!name || !tools.some(tool => tool.function.name === name)) throw new Error('指定的 OpenAI 工具必须在当前 tools 中存在')
    toolChoice = { type: 'function', function: { name } }
    break
  }
  case 'any':
    if (!tools.length) throw new Error('toolChoice=any 至少需要一个可用工具')
    toolChoice = 'required'
    break
  case 'none': toolChoice = 'none'; break
  default: toolChoice = 'auto'
  }
  const budget = options.openaiThinkingBudgetTokens
  if (options.openaiThinkingBudgetTokens !== undefined && officialEndpoint) throw new Error('OpenAI 官方接口不支持 thinking_budget_tokens')
  return {
    model,
    messages,
    ...(options.maxToken !== undefined ? { [options.openaiMaxTokenField || (knownOpenAI || officialEndpoint ? 'max_completion_tokens' : 'max_tokens')]: options.maxToken } : {}),
    ...(!reasoningModel || effort === 'none' ? (options.temperature !== undefined ? { temperature: options.temperature } : {}) : {}),
    ...(reasoning || options.openaiReasoningEffort ? (effort ? { reasoning_effort: effort } : {}) : {}),
    ...(budget !== undefined ? { thinking_budget_tokens: budget } : {}),
    ...(tools.length && !(responsesTools && toolChoice === 'none') ? { tools: tools.map(getFromChaiteToolConverter('openai')), tool_choice: toolChoice } : {}),
  }
}
