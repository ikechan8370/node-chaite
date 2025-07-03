import { promises as fsPromises } from 'fs'
import path from 'path'
import chokidar, { FSWatcher } from 'chokidar'
import { BasicStorage, ChaiteContext, CloudSharingService, Filter, PaginationResult, SearchOption } from '../types'
import { getLogger } from '../utils'
import { getMd5 } from '../utils/hash'
import { Trigger, TriggerDTO } from '../types'

/**
 * 专门用于管理触发器的管理器
 * 由于触发器需要注册并保持状态运行，因此管理方式不同于普通的可执行代码
 */
export class TriggerManager<T extends TriggerDTO> {
  /**
   * 存储触发器名称到 DTO ID 的映射
   * 这样通过实例的 name 就可以找到对应的 DTO id
   */
  protected nameToIdMap: Map<string, string> = new Map()

  private watcher: FSWatcher | null = null
  /**
   * 存储示例名称和文件名的映射
   */
  protected instanceMap: Map<string, string> = new Map()
  /**
   * 已注册的触发器实例
   */
  protected activeInstances: Map<string, Trigger> = new Map()
  /**
   * 全局上下文，用于传递给触发器
   */
  protected context: ChaiteContext
  /**
   * codeDirectory是存放实际代码的目录
   */
  protected codeDirectory: string
  cloudService?: CloudSharingService<T>

  constructor(codeDirectory: string, private storage: BasicStorage<T>) {
    this.codeDirectory = codeDirectory
    this.context = new ChaiteContext()
  }

  public setCloudService(cloudService: CloudSharingService<T>) {
    this.cloudService = cloudService
  }

  /**
   * 初始化管理器，加载所有触发器并注册
   */
  async initialize(): Promise<void> {
    // 初始扫描加载所有实例
    await this.scanInstances()

    // 注册所有启用的触发器
    await this.registerAllEnabledTriggers()

    // 设置文件监听
    await this.setupFileWatcher()
  }

  /**
   * 设置文件监听器，监控触发器文件的变化
   */
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

      const filename = path.basename(filepath)

      // 如果是删除文件，需要停止相关触发器
      if (event === 'unlink') {
        for (const [name, file] of this.instanceMap.entries()) {
          if (file === filename) {
            await this.unregisterTrigger(name)
            break
          }
        }
      }

      // Re-scan instances when files change
      await this.scanInstances()

      // 如果是新增或修改文件，可能需要重新注册触发器
      if (['add', 'change'].includes(event)) {
        try {
          const filePath = path.join(this.codeDirectory, filename)
          const fileURL = `file://${path.resolve(filePath).replace(/\\/g, '/')}`
          const module = await import(fileURL + `?t=${Date.now()}`)

          if (module.default && typeof module.default === 'object' && module.default.name) {
            const name = module.default.name
            const trigger = await this.getInstanceT(name)

            // 如果触发器存在且启用状态，重新注册
            if (trigger && trigger.status === 'enabled') {
              await this.unregisterTrigger(name)
              await this.registerTrigger(name)
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            getLogger().error(`Error processing trigger file '${filename}':`, error.message as never)
          }
        }
      }

      getLogger().debug(`File ${filepath} ${event}, rescanned trigger instances`)
    })

    getLogger().debug(`File watcher set up for trigger directory: ${this.codeDirectory}`)
  }

  /**
   * 扫描触发器实例
   */
  private async scanInstances(): Promise<void> {
    try {
      const files = await fsPromises.readdir(this.codeDirectory)
      const newInstanceMap = new Map<string, string>()

      this.nameToIdMap.clear()

      // 构建文件名到DTO映射的临时表
      const filenameToDtoMap = new Map<string, T>()
      const triggers = await this.storage.listItems()
      for (const trigger of triggers) {
        const filename = `${trigger.name.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
        filenameToDtoMap.set(filename, trigger)
      }

      for (const file of files) {
        if (path.extname(file) === '.js') {
          try {
            const filePath = path.join(this.codeDirectory, file)
            const fileURL = `file://${path.resolve(filePath).replace(/\\/g, '/')}`
            // 清除模块缓存以确保获取最新版本
            const module = await import(fileURL + `?t=${Date.now()}`)
            if (module.default && typeof module.default === 'object' && module.default.name) {
              // 实例 name 到文件名映射
              const instanceName = module.default.name
              newInstanceMap.set(instanceName, file)

              // 从文件名找到对应的 DTO
              const dto = filenameToDtoMap.get(file)
              if (dto) {
                // 建立实例 name 到 DTO id 的映射
                this.nameToIdMap.set(instanceName, dto.id)
                getLogger().debug(`建立映射: 实例 '${instanceName}' -> DTO id '${dto.id}'`)
              }
            }
          } catch (error) {
            if (error instanceof Error) {
              getLogger().error(`Error loading trigger from file '${file}':`, error.message as never)
            }
          }
        }
      }
      this.instanceMap = newInstanceMap
      getLogger().info(`Scanned ${this.instanceMap.size} triggers: [${[...this.instanceMap.keys()].join(', ')}]`)
    } catch (error) {
      // 处理错误
      if (error instanceof Error) {
        getLogger().error('Error scanning trigger directory:', error.message as never)
      } else {
        getLogger().error('Error scanning trigger directory:', error as never)
      }
    }
  }

  /**
   * 注册所有启用状态的触发器
   */
  private async registerAllEnabledTriggers(): Promise<void> {
    const triggers = await this.storage.listItems()
    for (const trigger of triggers) {
      if (trigger.status === 'enabled') {
        await this.registerTrigger(trigger.name)
      }
    }
  }

  /**
   * 注册单个触发器
   */
  public async registerTrigger(dtoName: string): Promise<void> {
    // 获取 DTO
    const triggerDTO = await this.getInstanceTByName(dtoName)
    if (!triggerDTO) {
      getLogger().warn(`Cannot register trigger '${dtoName}': DTO not found`)
      return
    }

    // 添加代码文件（如果需要）
    if (triggerDTO.code && !this.instanceMap.has(dtoName)) {
      await this.addInstanceCode(dtoName, triggerDTO.code)
      await this.scanInstances() // 重新扫描以更新instanceMap
    }

    // 尝试加载实例
    const filename = `${dtoName.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
    const filePath = path.join(this.codeDirectory, filename)
    const fileURL = `file://${path.resolve(filePath).replace(/\\/g, '/')}`

    try {
      // 导入模块
      const module = await import(fileURL + `?t=${Date.now()}`)
      const instance = module.default as Trigger

      // 获取实例的实际 name
      const instanceName = instance.name

      // 如果实例已注册，先取消注册
      if (this.activeInstances.has(instanceName)) {
        await this.unregisterTrigger(instanceName)
      }

      // 注册触发器并添加到活跃实例
      await instance.register(this.context)
      this.activeInstances.set(instanceName, instance)

      // 更新实例名到 DTO ID 的映射
      this.nameToIdMap.set(instanceName, triggerDTO.id)

      getLogger().info(`Trigger '${instanceName}' registered successfully (from DTO '${dtoName}')`)
    } catch (error) {
      if (error instanceof Error) {
        getLogger().error(`Error registering trigger '${dtoName}':`, error.message as never)
      } else {
        getLogger().error(`Error registering trigger '${dtoName}':`, error as never)
      }
    }
  }

  /**
 * 通过触发器实例的 name 删除触发器
 * 注意：这里的 name 是触发器实例的 name，而不是 DTO 中的 name
 */
  public async deleteInstanceByName(triggerName: string): Promise<void> {
    // 先从已激活的实例中查找
    if (this.activeInstances.has(triggerName)) {
      await this.unregisterTrigger(triggerName)
    }

    // 从映射表中找到对应的 DTO id
    const dtoId = this.nameToIdMap.get(triggerName)
    if (dtoId) {
      // 如果找到了 id，直接删除
      await this.deleteInstance(dtoId)
      getLogger().info(`已删除触发器实例 '${triggerName}' 及其 DTO (id: ${dtoId})`)
      return
    }

    // 如果没找到 id 但有文件，只删除文件
    const filename = this.instanceMap.get(triggerName)
    if (filename) {
      const filePath = path.join(this.codeDirectory, filename)
      try {
        await fsPromises.unlink(filePath)
        this.instanceMap.delete(triggerName)
        getLogger().info(`已删除触发器实例文件 '${triggerName}'，但未找到对应的 DTO`)
      } catch (error) {
        getLogger().error(`删除触发器实例文件 '${triggerName}' 失败:`, error as never)
      }
    } else {
      getLogger().warn(`找不到名为 '${triggerName}' 的触发器实例`)
    }
  }

  /**
   * 取消注册触发器
   */
  public async unregisterTrigger(name: string): Promise<void> {
    const trigger = this.activeInstances.get(name)
    if (!trigger) return

    try {
      await trigger.unregister()
      this.activeInstances.delete(name)
      getLogger().info(`Trigger '${name}' unregistered successfully`)
    } catch (error) {
      if (error instanceof Error) {
        getLogger().error(`Error unregistering trigger '${name}':`, error.message as never)
      } else {
        getLogger().error(`Error unregistering trigger '${name}':`, error as never)
      }
    }
  }

  /**
   * 返回实例名字们
   */
  public async listInstanceNames(): Promise<string[]> {
    return Array.from(this.instanceMap.keys())
  }

  /**
   * 获取所有触发器DTO
   */
  public async listInstances(): Promise<T[]> {
    return this.storage.listItems()
  }

  /**
   * 获取触发器DTO
   */
  public async getInstanceT(id: string): Promise<T | null> {
    return this.storage.getItem(id)
  }

  /**
   * 通过名称获取触发器DTO
   */
  public async getInstanceTByName(name: string): Promise<T | null> {
    const items = await this.storage.listItemsByEqFilter({ name })
    return items.length > 0 ? items[0] : null
  }

  /**
   * 获取触发器实例对象
   */
  public async getInstance(name: string): Promise<Trigger | undefined> {
    // 首先检查是否已经有激活的实例
    if (this.activeInstances.has(name)) {
      return this.activeInstances.get(name)
    }

    // 如果没有激活的实例，则从文件中加载
    const filename = this.instanceMap.get(name)

    if (!filename) return undefined

    const filePath = path.join(this.codeDirectory, filename)
    const fileURL = `file://${path.resolve(filePath).replace(/\\/g, '/')}`
    try {
      // 导入模块
      const module = await import(fileURL + `?t=${Date.now()}`)
      const instance = module.default as Trigger

      // 记录未注册的实例（因为在registerTrigger时会再次加入activeInstances）
      if (!this.activeInstances.has(name)) {
        this.activeInstances.set(name, instance)
      }

      return instance
    } catch (error) {
      console.error(`Error loading trigger '${name}':`, error)
      return undefined
    }
  }

  /**
   * 新增或更新触发器
   */
  public async addInstance(instance: T): Promise<string> {
    const cleanObj = JSON.parse(JSON.stringify(instance))
    cleanObj.md5 = ''
    instance.md5 = getMd5(JSON.stringify(cleanObj))
    const id = await this.storage.setItem(instance.id, instance)
    await this.addInstanceCode(instance.name, instance.code as string)
    return id
  }

  /**
   * 添加触发器代码
   */
  public async addInstanceCode(name: string, code: string): Promise<void> {
    const filename = `${name.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
    const filePath = path.join(this.codeDirectory, filename)

    await fsPromises.writeFile(filePath, code)
    // 文件监听器会自动触发扫描
  }

  /**
   * 更新或新增触发器
   */
  public async upsertInstanceT(t: T): Promise<string> {
    const { name, code } = t
    if (!name || !code) {
      throw new Error('name and code are required')
    }

    const existInstance = await this.storage.getItem(t.id)

    // 如果存在且之前已注册，需要先取消注册
    if (existInstance && existInstance.status === 'enabled') {
      await this.unregisterTrigger(existInstance.name)
    }

    if (existInstance) {
      const existName = existInstance.name
      if (existName !== name) {
        const oldFilename = this.instanceMap.get(existName)
        if (oldFilename) {
          getLogger().debug(`Removing old file for trigger '${existName}'`)
          await fsPromises.unlink(path.join(this.codeDirectory, oldFilename))
        }
      }
    }

    const id = await this.addInstance(t)

    // 如果新状态是启用，注册触发器
    if (t.status === 'enabled') {
      await this.registerTrigger(t.name)
    }

    return id
  }

  /**
   * 通过云ID获取触发器
   */
  public async getInstanceTByCloudId(cloudId: string): Promise<T[]> {
    return this.storage.listItemsByEqFilter({ cloudId })
  }

  /**
   * 重命名触发器文件
   */
  public async renameFile(id: string, oldName: string, newName: string) {
    // 先取消注册旧触发器
    await this.unregisterTrigger(oldName)

    const filename = `${oldName.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
    if (filename) {
      const filePath = path.join(this.codeDirectory, filename)
      const newFilename = `${newName.replace(/[^a-zA-Z0-9_]/g, '_')}.js`
      const newFilePath = path.join(this.codeDirectory, newFilename)
      await fsPromises.rename(filePath, newFilePath)
      // 文件监听器会自动触发扫描
    }

    // 获取触发器DTO，如果状态是启用，重新注册
    const trigger = await this.storage.getItem(id)
    if (trigger && trigger.status === 'enabled') {
      await this.registerTrigger(newName)
    }
  }

  /**
   * 删除触发器
   */
  public async deleteInstance(id: string): Promise<void> {
    const t = await this.storage.getItem(id)
    if (!t) {
      return
    }

    // 取消注册触发器
    await this.unregisterTrigger(t.name)

    const filename = this.instanceMap.get(t.name)

    if (filename) {
      const filePath = path.join(this.codeDirectory, filename)
      await fsPromises.unlink(filePath)
      // 文件监听器会自动触发扫描
    }

    await this.storage.removeItem(id)
  }

  /**
   * 更新上下文
   */
  public updateContext(context: ChaiteContext): void {
    this.context = context
  }

  /**
   * 序列化触发器，返回DTO
   */
  public async serializeInstance(name: string): Promise<T | null> {
    const t = await this.getInstance(name)
    if (!t) return null

    const dto = (await this.storage.listItemsByEqFilter({ name }))[0]
    if (!dto) return null

    return dto
  }

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
    if (!t) throw new Error('Trigger not found')
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
    const downloaded = await this.storage.listItemsByInQuery([{ field: 'cloudId', values: result.items.map(item => item.id) }])
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
    if (!serialized) throw new Error('Trigger not found')
    return service.initializeTransfer(serialized)
  }

  /**
   * 清理资源，关闭文件监听器
   */
  public async dispose(): Promise<void> {
    // 先取消注册所有活跃的触发器
    for (const [name] of this.activeInstances) {
      await this.unregisterTrigger(name)
    }

    // 关闭文件监听器
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }

    getLogger().info('TriggerManager disposed successfully')
  }

  /**
   * 启用触发器
   */
  public async enableTrigger(id: string): Promise<void> {
    const trigger = await this.getInstanceT(id)
    if (!trigger) throw new Error('Trigger not found')

    trigger.status = 'enabled'
    await this.storage.setItem(id, trigger)
    await this.registerTrigger(trigger.name)

    getLogger().info(`Trigger '${trigger.name}' has been enabled`)
  }

  /**
   * 禁用触发器
   */
  public async disableTrigger(id: string): Promise<void> {
    const trigger = await this.getInstanceT(id)
    if (!trigger) throw new Error('Trigger not found')

    trigger.status = 'disabled'
    await this.storage.setItem(id, trigger)
    await this.unregisterTrigger(trigger.name)

    getLogger().info(`Trigger '${trigger.name}' has been disabled`)
  }

  /**
   * 检查触发器是否正在运行
   */
  public isRunning(name: string): boolean {
    return this.activeInstances.has(name)
  }

  /**
   * 获取当前运行中的所有触发器
   */
  public getRunningTriggers(): string[] {
    return Array.from(this.activeInstances.keys())
  }
}
