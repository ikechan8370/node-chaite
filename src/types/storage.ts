import { ToolChoice } from './adapter'

/**
 * 基本存储接口
 */
export interface BasicStorage<T> {
  getItem(key: string): Promise<T | null>;
  setItem(key: string, value: T): Promise<string>;
  removeItem(key: string): Promise<void>;
  listItems(): Promise<T[]>;
  clear(): Promise<void>;
}

export abstract class ChaiteStorage<T> implements BasicStorage<T> {
  abstract getItem(key: string): Promise<T | null>;
  abstract setItem(key: string, value: T): Promise<string>;
  abstract removeItem(key: string): Promise<void>;
  abstract listItems(): Promise<T[]>;
  abstract clear(): Promise<void>;
}

export interface UserState {
  userId: number | string,
  nickname?: string,
  card?: string,
  conversations: Conversation[],
  settings: UserSettings,
  current: {
    conversationId?: string
    messageId?: string
  }
}

export interface Conversation {
  id: string,
  name: string,
  lastMessageId: string,
}

export interface UserSettings {
  preset: string,
  model: string,
  temperature: number,
  maxToken: number,
  systemOverride: string,
  enableReasoning: boolean,
  reasoningEffort: 'high' | 'medium' | 'low',
  reasoningBudgetTokens: number,
  toolChoice: ToolChoice,
}