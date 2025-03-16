// models.ts
// 模型相关
export type Feature = 'chat' | 'visual' | 'tool' | 'embedding'

/**
 * other roles like developer or function should be handled by different implementations
 */
export type Role = 'system' | 'user' | 'assistant' | 'tool' | 'developer'

export interface MessageContent {
  type: 'text' | 'image' | 'audio' | 'video' | 'tool' | 'reasoning'
}

export interface TextContent extends MessageContent {
  type: 'text'
  /**
   * Content of text
   */
  text: string
}

export interface ReasoningContent extends MessageContent {
  type: 'reasoning'
  /**
   * thinking text
   */
  text: string
}

export interface ImageContent extends MessageContent {
  type: 'image'
  /**
   * Either a URL of the image or the base64 encoded image data
   */
  image: string

  mimeType?: string
}

export interface AudioContent extends MessageContent {
  type: 'audio'
  /**
   * Base64 encoded audio data
   */
  data: string

  format: 'mp3' | 'wav'
}

export type History = {
  id: string
  parentId: string | null
}

export interface IMessage {
  role: Role
  content: MessageContent[]
  toolCalls?: ToolCall[]
}

/**
 * 模型返回的工具调用，role是assistant
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: FunctionCall
}

export type ArgumentValue = string | number | boolean | ArgumentValue[]
export type FunctionCall = {
  name: string
  /**
   * raw可能是JSON字符串，需要反序列化一次
   */
  arguments: Record<string, ArgumentValue | Record<string, ArgumentValue>>
}

/**
 * 用户发送的消息，可能有文本和多模态消息
 */
export interface UserMessage extends IMessage {
  role: 'user'
  content: Array<TextContent | ImageContent | AudioContent>
}


export interface SystemMessage extends IMessage {
  role: 'system'
  content: TextContent[]
}

export interface DeveloperMessage extends IMessage {
  role: 'developer'
  content: TextContent[]
}

/**
 * 模型返回的消息，包括文本以及可能的工具调用
 */
export interface AssistantMessage extends IMessage {
  role: 'assistant'
  content: Array<TextContent>
  toolCalls?: ToolCall[]
}

export interface ReasoningPart {
  reasoning_content?: string
  reasoning?: string
  thinking_content?: string
  thinking?: string
  think?: string
}

/**
 * 客户端执行工具调用的函数结果
 */
export interface ToolCallResultMessage extends IMessage {
  role: 'tool'
  content: ToolCallResult[]
}

export interface ToolCallResult extends MessageContent {
  type: 'tool'
  tool_call_id?: string
  content: string
  name?: string
}

export type HistoryMessage = History & IMessage

export interface ModelResponse {
  id?: string
  model?: string
  contents: MessageContent[]
  usage?: ModelUsage
}

export interface ModelUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cachedTokens?: number
  reasoningTokens?: number
}

export interface ModelResponseChunk {
  id?: string
  model?: string
  delta: MessageContent[]
  toolCall?: ToolCall[]
}

export interface EmbeddingResult {
  embeddings: Array<number>[]
}

