export * from './types/index'
export * from './utils/index'
export * from './adapters/index'
export * from './rag/index'
export * from './channels/index'
export * from './const/index'
export * from './share/index'
export * from './storage/index'

// 把 chaite 的 getLogger 注入存储层。存储层只做类型引用以避免把 types 桶文件
// （以及它带来的 node-schedule / PdfParser）拉进自己的模块图，所以这里在包入口
// 补上真正的实现。
import { setStorageLoggerResolver } from './storage/logger'
import { getLogger as _getLogger } from './utils/logger'
setStorageLoggerResolver(_getLogger)
export * from './version'
export * from './core'
export * from './controllers'

// Agent subsystem — import from 'chaite/agent' or directly from this namespace
export * from './agent/index'
