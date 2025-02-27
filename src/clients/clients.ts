import {Feature, Message, ModelResponse, ModelResponseChunk, Tool, ToolCallResultMessage, UserMessage} from '../types'

export interface SendMessageOption {
    temperature?: number
    maxToken?: number
    /**
     * 将系统提示词覆盖
     */
    systemOverride?: string
    /**
     * 本轮对话禁用历史
     */
    disableHistoryRead?: boolean
    /**
     * 禁用本轮对话存储到历史
     */
    disableHistorySave?: boolean
    /**
     * 对话ID。如果不传则默认为第一次对话
     */
    conversationId?: string
    /**
     * 上一条消息的ID，如果不传则默认为第一次对话
     */
    parentMessageId?: string

    /**
     * 流模式
     */
    stream?: boolean
    onChunk(chunk: ModelResponseChunk): Promise<void>
}

export interface IClient {
    name: string
    features: Feature[]
    tools: Tool[]
    getHistory(messageId: string, conversationId?: string, channelId?: string | number): Promise<Message[]>
    sendMessage(message: UserMessage | ToolCallResultMessage, options: SendMessageOption): Promise<ModelResponse>
}