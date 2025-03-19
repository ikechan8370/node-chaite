import { ChatPreset } from '../channels/index'

export interface EventMessage {
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
  getChatPreset(e: EventMessage): Promise<ChatPreset>
}

export abstract class AbstractUserModeSelector implements UserModeSelector {
  abstract getChatPreset(e: EventMessage): Promise<ChatPreset>
}