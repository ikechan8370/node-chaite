import { HistoryMessage, HistoryManager } from '../types'

type HistoryCache = Map<string, Map<string, HistoryMessage>>

class InMemoryHistoryManager implements HistoryManager {
  cache: HistoryCache
  constructor(public name: string) {
    this.cache = new Map<string, Map<string, HistoryMessage>>()
  }
  async saveHistory(message: HistoryMessage, conversationId: string): Promise<void> {
    if (!this.cache.has(conversationId)) {
      this.cache.set(conversationId, new Map<string, HistoryMessage>())
    }
    this.cache.get(conversationId)?.set(message.id, message)
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
    this.cache.delete(conversationId)
  }
  async getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined> {
    return this.cache.get(conversationId)?.get(messageId)
  }
  
}

export default new InMemoryHistoryManager('default')