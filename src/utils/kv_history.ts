import { HistoryManager, HistoryMessage } from '../types/index'

// 抽象的 KV 存储接口，可以基于redis或keyv等来实现该接口
export interface KVStore {
  get(key: string): Promise<string>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export class KVHistoryManager implements HistoryManager {
  constructor(private kvStore: KVStore, public name: string) {}

  private getConversationKey(conversationId: string): string {
    return `conversation:${conversationId}`
  }

  private getMessageKey(conversationId: string, messageId: string): string {
    return `${this.getConversationKey(conversationId)}:message:${messageId}`
  }

  async saveHistory(message: HistoryMessage, conversationId: string): Promise<void> {
    const messageKey = this.getMessageKey(conversationId, message.id)
    await this.kvStore.set(messageKey, JSON.stringify(message))

    const conversationKey = this.getConversationKey(conversationId)
    const messageList = JSON.parse(await this.kvStore.get(conversationKey) || '[]')
    messageList.push(message.id)
    await this.kvStore.set(conversationKey, JSON.stringify(messageList))
  }

  async getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]> {
    if (!conversationId) {
      return []
    }
    if (!messageId) {
      throw new Error('unspecified message id is not implemented yet')
    }

    let parentId: string | null = messageId
    const histories: HistoryMessage[] = []

    while (parentId) {
      const history = await this.getOneHistory(parentId, conversationId)
      if (history) {
        histories.push(history)
        parentId = history.parentId
      } else {
        parentId = null
      }
    }

    return histories.reverse()
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const conversationKey = this.getConversationKey(conversationId)
    const messageList = JSON.parse(await this.kvStore.get(conversationKey) || '[]')

    for (const messageId of messageList) {
      await this.kvStore.delete(this.getMessageKey(conversationId, messageId))
    }

    await this.kvStore.delete(conversationKey)
  }

  async removeHistory(messageId: string, conversationId: string): Promise<void> {
    const target = await this.getOneHistory(messageId, conversationId)
    if (!target) return
    const conversationKey = this.getConversationKey(conversationId)
    const messageList = JSON.parse(await this.kvStore.get(conversationKey) || '[]') as string[]
    for (const id of messageList) {
      const message = await this.getOneHistory(id, conversationId)
      if (message?.parentId === messageId) {
        message.parentId = target.parentId
        await this.kvStore.set(this.getMessageKey(conversationId, id), JSON.stringify(message))
      }
    }
    await this.kvStore.delete(this.getMessageKey(conversationId, messageId))
    await this.kvStore.set(conversationKey, JSON.stringify(messageList.filter(id => id !== messageId)))
  }

  async getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined> {
    const messageKey = this.getMessageKey(conversationId, messageId)
    const messageData = await this.kvStore.get(messageKey)
    return messageData ? JSON.parse(messageData) : undefined
  }
}
