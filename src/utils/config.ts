import { ILogger } from '../types'

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
}