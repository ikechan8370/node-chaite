import {promises as fsPromises} from 'fs'
import path from 'path'
import chokidar, {FSWatcher} from 'chokidar'
import {BasicStorage, CloudSharingService, Filter, PaginationResult, SearchOption, Shareable} from '../types'
import {getLogger} from '../index'
import {getMd5} from "../utils/hash";

// todo
export type ExecutableSShareableType = 'tool' | 'processor'

/**
 * T是DTO
 * C是T对应的可执行的实例类型
 * @interface ExecutableShareableManager
 */
export abstract class ExecutableShareableManager<T extends Shareable<T>, C> {
  private watcher: FSWatcher | null = null
  /**
   * 存储示例名称和文件名的映射
   * @private
   */
  protected instanceMap: Map<string, string> = new Map()
  /**
   * codeDirectory是存放实际代码的目录
   * @private
   */
  protected codeDirectory: string
  cloudService?: CloudSharingService<T>

  protected constructor(private type: ExecutableSShareableType, codeDirectory: string, private storage: BasicStorage<T>) {
    this.codeDirectory = codeDirectory
  }
  public setCloudService (cloudService: CloudSharingService<T>) {
    this.cloudService = cloudService
  }

  /**
   * 只有可执行类型的实例才需要，如工具、处理器等。设置类不需要
   * @private
   */
  async initialize(): Promise<void> {
    // 初始扫描加载所有实例
    await this.scanInstances()

    // 设置文件监听
    await this.setupFileWatcher()
  }

  private async setupFileWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
    }

    this.watcher = chokidar.watch(this.codeDirectory, {
      persistent: true,
      ignoreInitial: true,
      ignorePermissionErrors: true,
      depth: 1,
    }).on('all', async (event, filepath) => {
      // Only react to add/change/unlink events
      if (!['add', 'change', 'unlink'].includes(event)) return

      // Only react to JS files
      if (path.extname(filepath) !== '.js') return

      // Re-scan instances when files change
      await this.scanInstances()
      getLogger().debug(`File ${filepath} ${event}, rescanned instances`)
    })

    getLogger().debug(`File watcher set up for directory: ${this.codeDirectory}`)
  }

  private async scanInstances(): Promise<void> {
    try {
      const files = await fsPromises.readdir(this.codeDirectory)
      const newInstanceMap = new Map<string, string>()

      for (const file of files) {
        if (path.extname(file) === '.js') {
          try {
            const filePath = path.join(this.codeDirectory, file)
            const fileURL = `file://${path.resolve(filePath).replace(/\\/g, '/')}`
            // 清除模块缓存以确保获取最新版本
            const module = await import(fileURL + `?t=${Date.now()}`)
            if (module.default && typeof module.default === 'object' && module.default.name) {
              // 使用示例自己的name作为键，文件名作为值
              getLogger().debug(`Loaded ${this.type} '${module.default.name}' from file '${file}'`)
              newInstanceMap.set(module.default.name, file)
            }
          } catch (error) {
            getLogger().error(`Error loading ${this.type} from file '${file}':`, error as never)
          }
        }
      }
      this.instanceMap = newInstanceMap
      getLogger().info(`Scanned ${this.instanceMap.size} ${this.type}: [${[...this.instanceMap.keys()].join(', ')}]`)
    } catch (error) {
      getLogger().error(`Error scanning ${this.type} directory:`, error as never)
    }
  }

  /**
   * 返回实例名字们
   * @returns 实例名字列表
   */
  public async listInstanceNames(): Promise<string[]> {
    return Array.from(this.instanceMap.keys())
  }

  public async listInstances(): Promise<T[]> {
    return this.storage.listItems()
  }

  public async getInstanceT(id: string): Promise<T | null> {
    return this.storage.getItem(id)
  }


  /**
   * 获取实例对象而非Shareable DTO
   * @param name
   */
  public async getInstance(name: string): Promise<C | undefined> {
    const filename = this.instanceMap.get(name)

    if (!filename) return undefined

    const filePath = path.join(this.codeDirectory, filename)
    const fileURL = `file://${path.resolve(filePath).replace(/\\/g, '/')}`
    try {
      // 清除模块缓存，确保获取最新版本
      const module = await import(fileURL + `?t=${Date.now()}`)
      return module.default as C
    } catch (error) {
      console.error(`Error loading tool '${name}':`, error)
      return undefined
    }
  }

  /**
   * 新增或更新
   * 有id就是更新，靠storage实现去控制，这里不管
   * @param instance
   * @return id
   */
  public async addInstance(instance: T): Promise<string> {
    const cleanObj = JSON.parse(JSON.stringify(instance))
    cleanObj.md5 = ''
    instance.md5 = getMd5(JSON.stringify(cleanObj))
    const id = await this.storage.setItem(instance.id, instance)
    await this.addInstanceCode(instance.name, instance.code as string)
    return id
  }

  public async addInstanceCode(name: string, code: string): Promise<void> {
    const filename = `${name.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
    const filePath = path.join(this.codeDirectory, filename)

    await fsPromises.writeFile(filePath, code)
    // 文件监听器会自动触发扫描
  }

  public async upsertInstanceT(t: T): Promise<string> {
    const { name, code } = t
    if (!name || !code) {
      throw new Error('name and code are required')
    }
    const existInstance = await this.storage.getItem(t.id)
    if (existInstance) {
      const existName = existInstance.name
      if (existName !== name) {
        const oldFilename = this.instanceMap.get(existName)
        if (oldFilename) {
          getLogger().debug(`Removing old file for instance '${existName}'`)
          await fsPromises.unlink(path.join(this.codeDirectory, oldFilename))
        }
      }
    }
    return this.addInstance(t)
  }

  public async getInstanceTByCloudId (cloudId: string): Promise<T[]> {
    return this.storage.listItemsByEqFilter({ cloudId })
  }

  public async renameFile (id: string, oldName: string, newName: string) {
    const filename = `${oldName.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
    if (filename) {
      const filePath = path.join(this.codeDirectory, filename)
      const newFilename = `${newName.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
      const newFilePath = path.join(this.codeDirectory, newFilename)
      await fsPromises.rename(filePath, newFilePath)
      // 文件监听器会自动触发扫描
    }
  }

  public async deleteInstance(id: string): Promise<void> {
    const t = await this.storage.getItem(id)
    if (!t) {
      return
    }

    const filename = this.instanceMap.get(t.name)

    if (filename) {
      const filePath = path.join(this.codeDirectory, filename)
      await fsPromises.unlink(filePath)
      // 文件监听器会自动触发扫描
    }

    await this.storage.removeItem(id)
    // todo transactional?
  }
  
  // Sharing methods
  /**
   * 序列化实例，返回DTO
   * @param name
   */
  abstract serializeInstance(name: string): Promise<T | null>

  // Cloud sharing methods

  private checkCloudService(): CloudSharingService<T> {
    if (!this.cloudService) {
      throw new Error('Cloud service is not initialized')
    }
    return this.cloudService as CloudSharingService<T>
  }
  
  public async shareToCloud(id: string): Promise<string | undefined> {
    const service = this.checkCloudService()
    const t = await this.getInstanceT(id)
    if (!t) throw new Error(`${this.type} not found`)
    const instance = await service.upload(t)
    if (instance) {
      instance.cloudId = instance.id
      instance.id = t.id
      await this.storage.setItem(id, instance)
    }
    return instance?.id
  }

  public async listFromCloud(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T & { downloaded: string }>> {
    const service = this.checkCloudService()
    const result = await service.list(filter, query, searchOption) as PaginationResult<T & { downloaded: string }>
    const downloaded = await this.storage.listItemsByInQuery([{ field: 'cloudId', values: result.items.map(item => item.id)}])
    result.items.forEach(item => {
      const local = downloaded.find(d => d.cloudId === item.id)
      if (local) {
        item.downloaded = local.id
      }
    })
    return result
  }

  public async getFromCloud(shareId: string): Promise<T | null> {
    const service = this.checkCloudService()
    return await service.download(shareId)
  }

  public async shareP2P(name: string): Promise<string | null> {
    const service = this.checkCloudService()
    const serialized = await this.serializeInstance(name)
    if (!serialized) throw new Error(`${this.type} not found`)
    return service.initializeTransfer(serialized)
  }

  public async dispose(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
  }
}

export type NonExecutableSShareableType = 'chat-preset' | 'tool-settings' | 'channel' | 'tools-group'

export abstract class NonExecutableShareableManager<T extends Shareable<T>> {
  cloudService?: CloudSharingService<T>

  protected constructor(protected type: NonExecutableSShareableType, protected storage: BasicStorage<T>) {
  }

  public setCloudService (cloudService: CloudSharingService<T>) {
    this.cloudService = cloudService
  }

  async addInstance(instance: T): Promise<string> {
    return await this.storage.setItem(instance.id, instance)
  }

  async deleteInstance(key: string) {
    await this.storage.removeItem(key)
  }

  async listInstances(): Promise<T[]> {
    return await this.storage.listItems()
  }

  async getInstance(key: string): Promise<T | null> {
    return await this.storage.getItem(key)
  }

  public async upsertInstance(t: T): Promise<string> {
    const { name } = t
    if (!name ) {
      throw new Error('name is required')
    }
    return this.addInstance(t)
  }

  async getInstanceByCloudId(cloudId: string): Promise<T[]> {
    return this.storage.listItemsByEqFilter({ cloudId })
  }

  private checkCloudService(): CloudSharingService<T> {
    if (!this.cloudService) {
      throw new Error('Cloud service is not initialized')
    }
    return this.cloudService as CloudSharingService<T>
  }

  public async shareToCloud(key: string): Promise<string | undefined> {
    const service = this.checkCloudService()
    const item = await this.storage.getItem(key)
    if (!item) throw new Error(`${this.type} not found`)
    const instance = await service.upload(item)
    return instance?.id
  }

  public async shareP2P(key: string): Promise<string | null> {
    const service = this.checkCloudService()
    const item = await this.storage.getItem(key)
    if (!item) throw new Error(`${this.type} not found`)
    return service.initializeTransfer(item)
  }

  public async getFromCloud(shareId: string): Promise<T | null> {
    const service = this.checkCloudService()
    return await service.download(shareId)
  }

  public async listFromCloud(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T & { id: string }>> {
    const service = this.checkCloudService()
    return await service.list(filter, query, searchOption)
  }

  public async deleteFromCloud(key: string): Promise<void> {
    const service = this.checkCloudService()
    await service.delete(key)
  }
}
