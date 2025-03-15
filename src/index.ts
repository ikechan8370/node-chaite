import { ChannelsManager, ChatPresetManager, DefaultCloudService, ProcessorsManager, ToolManager } from './share/index.js'
import {
  ChaiteContext,
  CustomConfig,
  HistoryManager,
  ILogger,
  ModelResponse, ProcessorDTO,
  SendMessageOption,
  ToolDTO,
  UserMessage,
} from './types/index.js'
import { MessageEvent, UserModeSelector } from './types/external.js'
import { createClient } from './adapters/index.js'
import { BasicStorage, UserState } from './types/index.js'
import {
  asyncLocalStorage,
  DEFAULT_HOST,
  DEFAULT_PORT,
  FrontEndAuthHandler,
  GlobalConfig,
  InMemoryHistoryManager,
} from './utils/index.js'
import { Channel, ChatPreset } from './channels/index.js'
import { RAGManager } from './rag/index.js'
import EventEmitter from 'node:events'
import { runServer } from './controllers/index.js'

export * from './types/index.js'
export * from './utils/index.js'
export * from './adapters/index.js'
export * from './rag/index.js'
export * from './channels/index.js'
export * from './const/index.js'
export * from './share/index.js'


/**
 * 入口
 */
export class Chaite extends EventEmitter {
  private static instance: Chaite

  private ragManager?: RAGManager

  private frontendAuthHandler: FrontEndAuthHandler

  private globalConfig?: GlobalConfig

  private constructor(private channelsManager: ChannelsManager, private toolsManager: ToolManager,
              private processorsManager: ProcessorsManager, private chatPresetManager: ChatPresetManager,
              private userModeSelector: UserModeSelector, private userStateStorage: BasicStorage<UserState>,
              private historyManager: HistoryManager = new InMemoryHistoryManager(), private logger: ILogger) {
    super()
  }
  
  public static init (channelsManager: ChannelsManager, toolsManager: ToolManager,
    processorsManager: ProcessorsManager, chatPresetManager: ChatPresetManager,
    userModeSelector: UserModeSelector, userStateStorage: BasicStorage<UserState>,
    historyManager: HistoryManager = new InMemoryHistoryManager(), logger: ILogger): Chaite {
    if (Chaite.instance) {
      return Chaite.instance
    }
    Chaite.instance = new Chaite(channelsManager, toolsManager, processorsManager, chatPresetManager, userModeSelector, userStateStorage, historyManager, logger)
    Chaite.instance.setFrontendAuthHandler(new FrontEndAuthHandler())
    return Chaite.instance
  }

  public static getInstance(): Chaite {
    return Chaite.instance
  }

  onUpdateCustomConfig: (config: CustomConfig) => Promise<CustomConfig>

  setUpdateConfigCallback (callback: (config: CustomConfig) => Promise<CustomConfig>) {
    this.onUpdateCustomConfig = callback
  }
  
  getCustomConfig: () => Promise<CustomConfig>
  
  setGetConfig (callback: () => Promise<CustomConfig>) {
    this.getCustomConfig = callback
  }

  setRAGManager(ragManager: RAGManager) {
    this.ragManager = ragManager
  }
  
  getRAGManager() {
    return this.ragManager
  }

  setGlobalConfig(globalConfig: GlobalConfig) {
    this.globalConfig = globalConfig
    this.globalConfig.on('change', obj => {
      const { key, newVal, oldVal } = obj
      this.emit('config-change', { key, newVal, oldVal })
    })
  }

  getGlobalConfig() {
    return this.globalConfig
  }

  setFrontendAuthHandler(frontendAuthHandler: FrontEndAuthHandler) {
    this.frontendAuthHandler = frontendAuthHandler
  }

  getFrontendAuthHandler() {
    return this.frontendAuthHandler
  }

  /**
   * 对话
   * @param message
   * @param e
   * @param options 包含对话id和消息id
   */
  async sendMessage (message: UserMessage, e: MessageEvent, options: SendMessageOption & { chatPreset?: ChatPreset }): Promise<ModelResponse> {
    const context = new ChaiteContext(this.logger)
    context.setEvent(e)
    return asyncLocalStorage.run(context, async () => {
      if (!options.chatPreset) {
        options.chatPreset = await this.userModeSelector.getChatPreset(e)
      }
      const channels = await this.channelsManager.getChannelByModel(options.chatPreset.sendMessageOption.model || '')
      if (channels.length > 0) {
        const channel = channels[0]
        await channel.options.ready()
        channel.options.setHistoryManager(this.historyManager)
        channel.options.setLogger(this.logger)
        const client = createClient(channel.adapterType, channel.options, context)
        const userState = await this.userStateStorage.getItem(e.sender.user_id)
        const newOptions = Object.assign(options.chatPreset.sendMessageOption, options)
        newOptions.conversationId = userState?.current?.conversationId
        newOptions.parentMessageId = userState?.current?.messageId || userState?.conversations.find(c => c.id === newOptions.conversationId)?.lastMessageId

        return  await client.sendMessage(message, newOptions)
      } else {
        throw new Error('No available channels')
      }
    })

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

  setCloudService (cloudServiceBaseUrl: string) {
    this.channelsManager.setCloudService(new DefaultCloudService<Channel>(cloudServiceBaseUrl))
    this.toolsManager.setCloudService(new DefaultCloudService<ToolDTO>(cloudServiceBaseUrl))
    this.processorsManager.setCloudService(new DefaultCloudService<ProcessorDTO>(cloudServiceBaseUrl))
    this.chatPresetManager.setCloudService(new DefaultCloudService<ChatPreset>(cloudServiceBaseUrl))
  }
  async auth (apiKey: string) {
    if (!this.toolsManager.cloudService) {
      throw new Error('Cloud service is not initialized')
    }
    const user = await this.toolsManager.cloudService.authenticate(apiKey)
    if (user) {
      this.channelsManager.cloudService?.setUser(user)
      this.toolsManager.cloudService?.setUser(user)
      this.processorsManager.cloudService?.setUser(user)
    }
  }
  
  runApiServer() {
    runServer(this.globalConfig?.getHost() || DEFAULT_HOST, this.globalConfig?.getPort() || DEFAULT_PORT)
  }
  
}
