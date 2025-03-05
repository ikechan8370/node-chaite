import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { DeSerializable, ToolSettings, ToolSettingsStorage, Serializable, Tool } from '../types'
import { CloudSharingService, User } from '../types'

export class ToolManager {
  private static instance: ToolManager
  private watcher: fs.FSWatcher | null = null
  private toolMap: Map<string, string> = new Map()

  private constructor(private toolsDirectory: string, public storage: ToolSettingsStorage, private cloudService?: CloudSharingService<SerializedTool>) {
  }

  public setCloudService (cloudService: CloudSharingService<SerializedTool>) {
    this.cloudService = cloudService
  }

  public static async getInstance(toolsDirectory: string, storage: ToolSettingsStorage, cloudService?: CloudSharingService<SerializedTool>): Promise<ToolManager> {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager(toolsDirectory, storage, cloudService)
      await ToolManager.instance.initialize()
    }
    return ToolManager.instance
  }

  private async initialize(): Promise<void> {
    // 初始扫描加载所有工具
    await this.scanTools()

    // 设置文件监听
    this.setupFileWatcher()
  }

  private setupFileWatcher(): void {
    if (this.watcher) {
      this.watcher.close()
    }

    this.watcher = fs.watch(this.toolsDirectory, { recursive: true }, async (eventType, filename) => {
      if (!filename) return
      if (path.extname(filename) !== '.js') return

      console.log(`File ${filename} ${eventType}`)

      // 文件变化时重新扫描工具目录
      await this.scanTools()
    })

    console.log(`File watcher set up for directory: ${this.toolsDirectory}`)
  }

  private async scanTools(): Promise<void> {
    try {
      const files = await fsPromises.readdir(this.toolsDirectory)
      const newToolMap = new Map<string, string>()

      for (const file of files) {
        if (path.extname(file) === '.js') {
          try {
            const filePath = path.join(this.toolsDirectory, file)
            // 清除模块缓存以确保获取最新版本
            delete require.cache[require.resolve(filePath)]
            const module = await import(filePath)

            if (module.default && typeof module.default === 'object' && module.default.name) {
              // 使用工具自己的name作为键，文件名作为值
              newToolMap.set(module.default.name, file)
            }
          } catch (error) {
            console.error(`Error loading tool from file '${file}':`, error)
            // 跳过无法加载的文件
          }
        }
      }

      this.toolMap = newToolMap
      console.log(`Scanned ${this.toolMap.size} tools`)
    } catch (error) {
      console.error('Error scanning tools directory:', error)
    }
  }

  public async listTools(): Promise<string[]> {
    return Array.from(this.toolMap.keys())
  }

  public async getTool(name: string): Promise<Tool | undefined> {
    const filename = this.toolMap.get(name)

    if (!filename) return undefined

    const filePath = path.join(this.toolsDirectory, filename)
    try {
      // 清除模块缓存，确保获取最新版本
      delete require.cache[require.resolve(filePath)]
      const module = await import(filePath)
      return module.default as Tool
    } catch (error) {
      console.error(`Error loading tool '${name}':`, error)
      return undefined
    }
  }

  public async addTool(name: string, code: string): Promise<void> {
    const filename = `${Date.now()}_${name.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
    const filePath = path.join(this.toolsDirectory, filename)

    await fsPromises.writeFile(filePath, code)
    // 文件监听器会自动触发扫描
  }

  public async updateTool(name: string, code: string): Promise<void> {
    const filename = this.toolMap.get(name)

    if (!filename) {
      // 如果工具不存在，创建一个新的
      return this.addTool(name, code)
    }

    const filePath = path.join(this.toolsDirectory, filename)
    await fsPromises.writeFile(filePath, code)
    // 文件监听器会自动触发扫描
  }

  public async deleteTool(name: string): Promise<void> {
    const filename = this.toolMap.get(name)

    if (filename) {
      const filePath = path.join(this.toolsDirectory, filename)
      await fsPromises.unlink(filePath)
      // 文件监听器会自动触发扫描
    }
  }

  public async createPreset(name: string, toolNames: string[]): Promise<void> {
    const preset: ToolSettings = { name, tools: toolNames }
    await this.storage.saveToolSettings(preset)
  }

  public async updatePreset(name: string, toolNames: string[]): Promise<void> {
    const preset: ToolSettings = { name, tools: toolNames }
    await this.storage.saveToolSettings(preset)
  }

  public async deletePreset(name: string): Promise<void> {
    await this.storage.deleteToolSettings(name)
  }

  public async getPresets(): Promise<ToolSettings[]> {
    return this.storage.getAllToolSettings()
  }

  public async getPresetTools(presetName: string): Promise<string[]> {
    const preset = await this.storage.getToolSettings(presetName)
    if (preset) {
      const allTools = await this.listTools()
      return preset.tools.filter(toolName => allTools.includes(toolName))
    }
    return []
  }

  // Sharing methods
  public async serializeTool(name: string): Promise<SerializedTool | null> {
    const filename = this.toolMap.get(name)
    if (!filename) return null

    const filePath = path.join(this.toolsDirectory, filename)
    try {
      const code = await fsPromises.readFile(filePath, 'utf-8')
      return new SerializedTool(name, code)
    } catch (error) {
      console.error(`Error serializing tool '${name}':`, error)
      return null
    }
  }

  public async deserializeTool(serialized: SerializedTool): Promise<Tool> {
    await this.addTool(serialized.name, serialized.code)
    const tool = await this.getTool(serialized.name)
    if (!tool) throw new Error(`Failed to deserialize tool '${serialized.name}'`)
    return tool
  }

  // Cloud sharing methods

  private checkCloudService(): CloudSharingService<SerializedTool> {
    if (!this.cloudService) {
      throw new Error('Cloud service is not initialized')
    }
    return this.cloudService as CloudSharingService<SerializedTool>
  }
  public async shareToolToCloud(name: string): Promise<string | undefined> {
    const service = this.checkCloudService()
    const serialized = await this.serializeTool(name)
    if (!serialized) throw new Error('Tool not found')
    const tool = await service.upload(serialized)
    return tool?.id
  }

  public async getToolFromCloud(shareId: string): Promise<Tool | null> {
    const service = this.checkCloudService()
    const serialized = await service.download(shareId)
    return serialized ? this.deserializeTool(serialized) : null
  }

  public async shareToolP2P(name: string): Promise<string | null> {
    const service = this.checkCloudService()
    const serialized = await this.serializeTool(name)
    if (!serialized) throw new Error('Tool not found')
    return service.initializeTransfer(serialized)
  }

  public async dispose(): Promise<void> {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}


export class SerializedTool implements Serializable, DeSerializable<SerializedTool> {
  constructor(public name: string, public code: string) {}

  public id: string
  public ctime: number
  public utime: number
  public uploader: User
  public permission: 'public' | 'private' | 'onetime'
  public description: string

  toString(): string {
    return JSON.stringify({ name: this.name, code: this.code })
  }

  fromString(str: string): SerializedTool {
    const obj = JSON.parse(str)
    this.name = obj.name
    this.code = obj.code
    return this
  }
}