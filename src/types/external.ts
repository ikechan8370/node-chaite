import { ChatPreset } from '../channels/index.js'

export interface MessageEvent {
  sender: {
    user_id: string,
    nickname?: string
    card?: string
  },
  group: {
    group_id: number
  }
}

export interface UserModeSelector {
  getChatPreset(e: MessageEvent): Promise<ChatPreset>
}

export abstract class AbstractUserModeSelector implements UserModeSelector {
  abstract getChatPreset(e: MessageEvent): Promise<ChatPreset>
}