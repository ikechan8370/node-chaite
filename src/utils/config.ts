
export class GlobalConfig {
  static instance: GlobalConfig
  constructor() {
    GlobalConfig.instance = this
  }
  static getInstance(): GlobalConfig {
    if (!GlobalConfig.instance) {
      GlobalConfig.instance = new GlobalConfig()
    }
    return GlobalConfig.instance
  }
  
  processorsDirPath: string = './processors'
  dataDir: string = './data'
  toolsDirPath: string = './tools'
}