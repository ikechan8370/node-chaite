import { ThinkingLevel } from '@google/genai'
import type { GenerateContentParameters, ThinkingConfig } from '@google/genai'
import type { ImageContent, IMessage, SendMessageOption, TextContent, Tool } from '../../../types'
import { getFromChaiteConverter, getFromChaiteToolConverter } from '../../../utils/converter'
import { parseInlineImage } from '../../../utils/imageData'
import { buildGeminiTooling } from './tooling'
import './converter'

export function geminiApiVersion(baseUrl: string, builtinTools = false): string | undefined {
  const url = baseUrl.replace(/\/+$/, '')
  if (/\/v1(?:alpha|beta)?$/i.test(url)) return ''
  if (builtinTools && url && !/:\/\/(?:generativelanguage|[a-z0-9-]+-aiplatform)\.googleapis\.com(?:\/|$)/i.test(url)) return 'v1'
  return undefined
}

export function buildGeminiThinking(model: string, options: SendMessageOption): ThinkingConfig | undefined {
  const match = /gemini-(\d+)(?:[.-](\d+))?/i.exec(model)
  const major = Number(match?.[1] || 0)
  const minor = Number(match?.[2] || 0)
  const reasoning = options.enableReasoning || options.isThinkingModel

  if (major >= 3 || (!match && options.geminiThinkingLevel)) {
    const onlyMinimalHigh = /flash-lite-image/i.test(model)
    const oldPro = major === 3 && minor === 0 && /pro/i.test(model)
    const noMinimal = major >= 4 || (major === 3 && minor >= 7 && !/lite/i.test(model)) || /pro/i.test(model)
    const allowed = onlyMinimalHigh ? ['minimal', 'high'] : oldPro ? ['low', 'high'] : noMinimal ? ['low', 'medium', 'high'] : ['minimal', 'low', 'medium', 'high']
    let level = options.geminiThinkingLevel || (reasoning ? options.reasoningEffort : options.enableReasoning === false ? allowed[0] : undefined)
    if (!level && major >= 4) level = 'medium'
    if (level && !allowed.includes(level)) {
      if (options.geminiThinkingLevel) throw new Error(`${model} 不支持 thinkingLevel=${level}，可用值：${allowed.join('/')}`)
      level = level === 'minimal' || level === 'low' ? allowed[0] : 'high'
    }
    return level || reasoning ? { ...(level ? { thinkingLevel: level.toUpperCase() as ThinkingLevel } : {}), includeThoughts: Boolean(reasoning) } : undefined
  }
  if (options.geminiThinkingLevel) throw new Error(`${model} 不支持 thinkingLevel，请使用 reasoningBudgetTokens`)
  if ((major && major < 2) || (major === 2 && minor < 5)) return undefined
  if (!reasoning && options.enableReasoning !== false) return undefined
  const pro = /pro/i.test(model)
  const lite = /lite/i.test(model)
  const budget = reasoning ? options.reasoningBudgetTokens ?? -1 : pro ? 128 : 0
  const minimum = pro ? 128 : lite ? 512 : 0
  const maximum = pro ? 32768 : 24576
  if (!Number.isInteger(budget) || (budget !== -1 && budget !== 0 && (budget < minimum || budget > maximum)) || (pro && budget === 0)) {
    throw new Error(`${model} 的 thinkingBudget 无效，请使用 -1（动态）或模型支持的预算范围`)
  }
  return { includeThoughts: Boolean(reasoning), thinkingBudget: budget }
}

/** Remote public images must be downloaded, not passed as base64 strings. */
async function prepareImages(message: IMessage): Promise<IMessage> {
  if (!message.content.some(part => part.type === 'image' && /^https?:\/\//i.test((part as ImageContent).image))) return message
  const content = []
  for (const part of message.content) {
    if (part.type === 'image' && /^https?:\/\//i.test((part as ImageContent).image) && !/^https:\/\/generativelanguage\.googleapis\.com\/.*files\//i.test((part as ImageContent).image)) {
      const response = await fetch((part as ImageContent).image, { signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`获取 Gemini 图片失败：${response.status}`)
      const parsed = parseInlineImage(Buffer.from(await response.arrayBuffer()).toString('base64'), response.headers.get('content-type') || (part as ImageContent).mimeType)
      content.push({ ...part, image: parsed.data, mimeType: parsed.mimeType } as ImageContent)
    } else content.push(part)
  }
  return { ...message, content }
}

export async function buildGeminiRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption) {
  const model = options.model || 'gemini-2.0-flash-001'
  const converter = getFromChaiteConverter('gemini')
  const contents = []
  const system = options.systemOverride ? [options.systemOverride] : []
  for (const history of histories) {
    if (history.role === 'system' || history.role === 'developer') {
      system.push(...history.content.filter((part): part is TextContent => part.type === 'text').map(part => part.text))
    } else {
      const converted = converter(await prepareImages(history))
      if (converted.parts?.length) contents.push(converted)
    }
  }
  if (!contents.length) throw new Error('Gemini 请求没有可发送的消息')
  const tooling = buildGeminiTooling(tools.map(getFromChaiteToolConverter('gemini')), options.geminiBuiltinTools || [], options.toolChoice, model)
  const request: GenerateContentParameters = {
    model, contents,
    config: {
      temperature: options.temperature, maxOutputTokens: options.maxToken,
      thinkingConfig: buildGeminiThinking(model, options),
      tools: tooling.tools, ...(tooling.toolConfig ? { toolConfig: tooling.toolConfig } : {}),
      responseModalities: options.responseModalities,
      safetySettings: options.safetySettings?.map(setting => { const copy = { ...setting }; delete copy.method; return copy }),
      ...(system.length ? { systemInstruction: system.join('\n\n') } : {}),
    },
  }
  return { request, ...tooling }
}
