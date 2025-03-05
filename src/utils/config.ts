import { ILogger } from '../types/common'
import { ChannelsLoadBalancer, ChannelsStorage, ChatPresetsStorage, ToolSettingsStorage } from '../types'
// import { ChannelsManager } from "../channels";
// import { ToolManager } from '../share'

export class GlobalConfig {
  private static instance: GlobalConfig | null = null

  static getInstance(): GlobalConfig {
    if (!GlobalConfig.instance) {
      GlobalConfig.instance = new GlobalConfig()
    }

    return GlobalConfig.instance
  }

  private constructor() {}

  processorsDirPath: string = './processors'
  dataDir: string = './data'
  toolsDirPath: string = './tools'
  cloudBaseUrl?: string
  cloudApiKey?: string
  logger?: ILogger
  /**********************************************
   *                     渠道                   *
   *********************************************/
  // 渠道存储器
  channelStorage?: ChannelsStorage
  // 渠道均衡器
  channelsLoadBalancer?: ChannelsLoadBalancer
  // 渠道管理器。单例，不放入Config
  // channelsManager?: ChannelsManager
  /**********************************************
   *                     工具                   *
   *********************************************/
  // 工具管理器。单例，不放入Config
  // toolManager?: ToolManager
  // 工具设置存储器
  presetStorage?: ToolSettingsStorage

  /**********************************************
   *                     对话                   *
   *********************************************/
  // 对话配置存储器
  chatPresetStorage?: ChatPresetsStorage


}