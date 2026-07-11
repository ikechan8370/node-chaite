import { request } from '../http'
import ToolChoice = Shareable.ToolChoice

export interface Conversation {
  id: string
  name: string
  lastMessageId: string
}

export interface UserSettings {
  preset: string
  model: string
  temperature: number
  maxToken: number
  systemOverride: string
  enableReasoning: boolean
  reasoningEffort: 'high' | 'medium' | 'low'
  reasoningBudgetTokens: number
  toolChoice: ToolChoice
}

export interface UserState {
  userId: number | string
  nickname?: string
  card?: string
  conversations: Conversation[]
  settings: UserSettings
  current: {
    conversationId?: string
    messageId?: string
  }
}
export function listUserStates() {
  return request.Get<Service.ResponseResult<{ items: UserState[]; total: number; page: number; pageSize: number }>>('/api/state/list', { params: { pageSize: 100 } })
}

export function getUserState(userId: string) {
  return request.Get<Service.ResponseResult<UserState>>(`/api/state/${userId}`)
}

export function deleteUserState(userId: string) {
  return request.Delete<Service.ResponseResult<UserState>>(`/api/state/${userId}`)
}

export function getHistory(messageId: string, conversationId: string) {
  return request.Get<Service.ResponseResult<Model.HistoryMessage[]>>(`/api/state/history/${conversationId}`, {
    params: {
      messageId,
    },
  })
}
