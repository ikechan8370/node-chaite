import type Anthropic from '@anthropic-ai/sdk'
import type { IMessage, SendMessageOption, Tool } from '../../../types'
import { getFromChaiteConverter, getFromChaiteToolConverter } from '../../../utils/converter'
import './converter'

function modelProfile(model: string) {
  // Accept native IDs, provider prefixes, and common dotted gateway aliases.
  const match = model.toLowerCase().match(/(opus|sonnet|haiku|fable|mythos)[-_.](\d{1,2})(?=$|[-_.:/@])(?:[-_.](\d{1,2})(?=$|[-_.:/@]))?/)
  const family = match?.[1]
  const major = Number(match?.[2] || 0)
  // A date suffix after a whole major (sonnet-4-20250514) is not a minor version.
  const minor = match?.[3] && match[3].length <= 2 ? Number(match[3]) : 0
  const atLeast = (a: number, b: number) => major > a || (major === a && minor >= b)
  const adaptive = Boolean(family && (major >= 5 || ((family === 'opus' || family === 'sonnet') && atLeast(4, 6)))) || /mythos-preview/i.test(model)
  return {
    adaptive,
    alwaysThinking: family === 'fable' || family === 'mythos' || (family === 'opus' && atLeast(5, 5)) || /mythos-preview/i.test(model),
    betweenTools: family === 'sonnet' && atLeast(5, 5),
    restrictedOff: (family === 'haiku' && atLeast(5, 5)) || (family === 'opus' && atLeast(5, 0)) || (family === 'sonnet' && atLeast(5, 5)),
    xhigh: major >= 5 || (family === 'opus' && atLeast(4, 7)) || /mythos-preview/i.test(model),
    effort: adaptive || (family === 'opus' && atLeast(4, 5)),
  }
}

/** Build the actual SDK payload in one place, shared by tests and the adapter. */
export function buildClaudeRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption): Anthropic.MessageCreateParamsNonStreaming {
  const model = options.model || 'claude-3-7-sonnet-20250219'
  const profile = modelProfile(model)
  const reasoning = options.enableReasoning || options.isThinkingModel
  const explicitThinking = options.enableReasoning !== undefined || options.isThinkingModel !== undefined
  const override = options.claudeThinkingMode
  const adaptive = override === 'adaptive' || (override !== 'enabled' && profile.adaptive)
  let mode: Anthropic.ThinkingConfigParam['type'] | undefined
  if (override && override !== 'auto') mode = override
  else if (reasoning || profile.alwaysThinking) mode = adaptive ? 'adaptive' : 'enabled'
  else if (explicitThinking || !profile.adaptive) mode = profile.betweenTools ? 'between_tools' : 'disabled'

  const effort = options.claudeEffort || (options.reasoningEffort === 'minimal' ? 'low' : options.reasoningEffort)
  if (effort === 'xhigh' && profile.adaptive && !profile.xhigh) {
    throw new Error(`${model} 不支持 xhigh effort，请使用 low/medium/high/max`)
  }
  if (profile.alwaysThinking && mode === 'disabled') throw new Error(`${model} 不支持关闭 thinking，请使用 adaptive 和较低 effort`)
  if (profile.betweenTools && mode === 'disabled') throw new Error(`${model} 请使用 between_tools 关闭前置 thinking，或使用 adaptive`)
  if (profile.restrictedOff && (mode === 'disabled' || mode === 'between_tools') && (effort === 'xhigh' || effort === 'max')) {
    throw new Error(`${model} 在 ${effort} effort 下需要启用 adaptive thinking`)
  }

  const maxTokens = options.maxToken ?? (reasoning || mode === 'adaptive' || (mode === undefined && profile.adaptive) ? 8192 : 1024)
  if (!Number.isInteger(maxTokens) || maxTokens < 1) throw new Error('maxToken 必须为正整数')
  let thinking: Anthropic.ThinkingConfigParam | undefined
  if (mode === 'enabled') {
    const budget = options.reasoningBudgetTokens ?? 1024
    if (!Number.isInteger(budget) || budget < 1024 || budget >= maxTokens) {
      throw new Error('Claude 手动 thinking 的 reasoningBudgetTokens 必须至少为 1024，且小于 maxToken')
    }
    thinking = { type: 'enabled', budget_tokens: budget }
  } else if (mode === 'adaptive') {
    thinking = { type: 'adaptive', display: 'summarized' }
  } else if (mode) {
    thinking = { type: mode }
  }

  const system = options.systemOverride ? [options.systemOverride] : []
  const messages: Anthropic.MessageParam[] = []
  const converter = getFromChaiteConverter('claude')
  for (const history of histories) {
    if (history.role === 'system' || history.role === 'developer') {
      for (const content of history.content) if (content.type === 'text' && 'text' in content && typeof content.text === 'string' && content.text.trim()) system.push(content.text)
      continue
    }
    const converted = converter(history)
    if (Array.isArray(converted.content) ? converted.content.length > 0 : converted.content.trim()) messages.push(converted)
  }
  if (messages.length === 0) throw new Error('Claude 请求没有可发送的消息')
  if (profile.adaptive && messages.at(-1)?.role === 'assistant') {
    throw new Error(`${model} 不支持 assistant prefill，请以 user 消息或工具结果结束请求`)
  }

  let toolChoice: Anthropic.ToolChoice | undefined
  if (options.toolChoice?.type === 'specified') {
    const name = options.toolChoice.tools?.[0]
    if (!name || !tools.some(tool => tool.function.name === name)) throw new Error('指定的 Claude 工具必须在当前 tools 中存在')
    toolChoice = { type: 'tool', name }
  } else if (options.toolChoice?.type === 'any') {
    if (tools.length === 0) throw new Error('toolChoice=any 至少需要一个可用工具')
    toolChoice = { type: 'any' }
  } else if (tools.length > 0 && options.toolChoice?.type) {
    toolChoice = { type: options.toolChoice.type }
  }
  if (mode === 'enabled' && (toolChoice?.type === 'any' || toolChoice?.type === 'tool')) {
    throw new Error('Claude 手动 thinking 不支持强制工具调用，请使用 toolChoice=auto 或关闭 thinking')
  }
  return {
    model,
    max_tokens: maxTokens,
    messages,
    ...(system.length ? { system: system.join('\n\n') } : {}),
    ...(tools.length ? { tools: tools.map(getFromChaiteToolConverter('claude')) } : {}),
    ...(thinking ? { thinking } : {}),
    ...((profile.effort || adaptive) && effort ? { output_config: { effort } } : {}),
    // New Claude models reject sampling overrides; manual thinking requires the default too.
    ...(!profile.adaptive && mode !== 'adaptive' && mode !== 'enabled' && options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(toolChoice ? { tool_choice: toolChoice } : {}),
  }
}
