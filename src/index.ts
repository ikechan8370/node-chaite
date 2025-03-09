import { ChannelsManager, ChatPresetManager, ProcessorsManager, ToolManager } from './share'
import { HistoryManager, ILogger, ModelResponse, SendMessageOption, UserMessage } from './types'
import { MessageEvent, UserModeSelector } from './types/external'
import { AbstractClass } from './adapters'
import { BasicStorage, UserState } from './types/storage'
import { InMemoryHistoryManager } from './utils'
import { ChatPreset } from './channels'

export * from './types'
export * from './utils'
export * from './adapters'
export * from './rag'
export * from './channels'
export * from './const'
export * from './share'

/**
 * 入口
 */
export class Chaite {
  constructor(private channelsManager: ChannelsManager, private toolsManager: ToolManager,
              private processorsManager: ProcessorsManager, private chatPresetManager: ChatPresetManager,
              private userModeSelector: UserModeSelector, private userStateStorage: BasicStorage<UserState>,
              private historyManager: HistoryManager = new InMemoryHistoryManager(), private logger: ILogger) {
  }
  
  /**
   * 对话
   * @param message
   * @param e
   * @param options 包含对话id和消息id
   */
  async sendMessage (message: UserMessage, e: MessageEvent, options: SendMessageOption & { chatPreset?: ChatPreset }): Promise<ModelResponse> {
    if (!options.chatPreset) {
      options.chatPreset = await this.userModeSelector.getChatPreset(e)
    }
    const channels = await this.channelsManager.getChannelByModel(options.chatPreset.sendMessageOption.model || '')
    if (channels.length > 0) {
      const channel = channels[0]
      await channel.options.ready()
      channel.options.setHistoryManager(this.historyManager)
      channel.options.setLogger(this.logger)
      const client = AbstractClass.createClient(channel.adapterType, channel.options)
      const userState = await this.userStateStorage.getItem(e.sender.user_id)
      const newOptions = Object.assign(options.chatPreset.sendMessageOption, options)
      newOptions.conversationId = userState?.current?.conversationId
      newOptions.parentMessageId = userState?.current?.messageId || userState?.conversations.find(c => c.id === newOptions.conversationId)?.lastMessageId
      
      return  await client.sendMessage(message, newOptions)
    } else {
      throw new Error('No available channels')
    }
  }
  
  getChannelsManager () {
    return this.channelsManager
  }
  
  setChannelsManager (channelsManager: ChannelsManager) {
    this.channelsManager = channelsManager
  }
  
  getToolsManager () {
    return this.toolsManager
  }
  
  setToolsManager (toolsManager: ToolManager) {
    this.toolsManager = toolsManager
  }
  
  getProcessorsManager () {
    return this.processorsManager
  }
  
  setProcessorsManager (processorsManager: ProcessorsManager) {
    this.processorsManager = processorsManager
  }
  
  getChatPresetManager () {
    return this.chatPresetManager
  }
  
  setChatPresetManager (chatPresetManager: ChatPresetManager) {
    this.chatPresetManager = chatPresetManager
  }
  
  getUserModeSelector () {
    return this.userModeSelector
  }
  
  setUserModeSelector (userModeSelector: UserModeSelector) {
    this.userModeSelector = userModeSelector
  } 
  
  getUserStateStorage () {
    return this.userStateStorage
  }
  
  setUserStateStorage (userStateStorage: BasicStorage<UserState>) {
    this.userStateStorage = userStateStorage
  }
  
  getHistoryManager () {
    return this.historyManager
  }
  
  setHistoryManager (historyManager: HistoryManager) {
    this.historyManager = historyManager
  }
  
  getLogger () {
    return this.logger
  }
  
  setLogger (logger: ILogger) {
    this.logger = logger
  }
  
}