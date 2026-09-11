/**
 * SQL 存储层。
 *
 * chaite 一直只定义 ChaiteStorage 接口而不给具体实现，结果是每个宿主插件各写一
 * 套：chatgpt-plugin 和 karin-plugin-chatgpt 里各有一份逐行雷同的九个 storage，
 * 并且已经分叉——只有前者有 WAL、写入队列和 VACUUM。
 *
 * 这个模块把那份实现收进来，宿主只需要选方言：
 *
 * ```ts
 * import { drivers, SqlChannelStorage } from 'chaite'
 *
 * await drivers.init({ dialect: 'sqlite', dataDir: './data' })
 * const channels = new SqlChannelStorage(drivers.get('main'))
 * await channels.initialize()
 * ```
 *
 * sqlite3 与 pg 都是可选 peer 依赖，按选定的方言二选一安装即可。
 */

export * from './driver/types'
export * from './driver/dialect'
export * from './driver/placeholders'
export * from './driver/sqlite'
export * from './driver/postgres'
export * from './driver/registry'

export * from './sql_storage'

export * from './sql/shareable'
export * from './sql/base64_image'
export * from './sql/channel_storage'
export * from './sql/chat_preset_storage'
export * from './sql/executable_storage'
export * from './sql/processors_storage'
export * from './sql/tool_groups_storage'
export * from './sql/user_state_storage'
export * from './sql/mcp_server_storage'
export * from './sql/operation_log_storage'
export * from './sql/history_manager'
