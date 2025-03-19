import { promises as fsPromises } from 'fs'
import path from 'path'
import {
  Tool, ToolDTO, BasicStorage, CloudSharingService,
} from '../types/index'
import { ExecutableShareableManager } from './shareable'


export class ToolManager extends ExecutableShareableManager<ToolDTO, Tool> {
  private static instance: ToolManager

  private constructor(toolsDirectory: string, storage: BasicStorage<ToolDTO>) {
    super('tool', toolsDirectory, storage)
  }

  public setCloudService(cloudService: CloudSharingService<ToolDTO>) {
    this.cloudService = cloudService
  }

  public static async init (toolsDirectory: string, storage: BasicStorage<ToolDTO>): Promise<ToolManager> {
    if (ToolManager.instance) {
      return ToolManager.instance
    }
    ToolManager.instance = new ToolManager(toolsDirectory, storage)
    await ToolManager.instance.initialize()
    return ToolManager.instance
  }

  public static async getInstance(): Promise<ToolManager | null> {
    if (!ToolManager.instance) {
      return null
    }
    return ToolManager.instance
  }

  async serializeInstance(name: string): Promise<ToolDTO | null> {

    const filename = this.instanceMap.get(name)
    if (!filename) return null

    const filePath = path.join(this.codeDirectory, filename)
    try {
      const code = await fsPromises.readFile(filePath, 'utf-8')
      return new ToolDTO({ name, code })
    } catch (error) {
      console.error(`Error serializing tool '${name}':`, error)
      return null

    }
  }
}