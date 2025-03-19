import { promises as fsPromises } from 'fs'
import path from 'path'
import {
  ProcessorDTO, Processor,
} from '../types/index'
import { CloudSharingService } from '../types/cloud'
import { ExecutableShareableManager } from './shareable'
import { BasicStorage } from '../types/index'


export class ProcessorsManager extends ExecutableShareableManager<ProcessorDTO, Processor> {
  private static instance: ProcessorsManager

  private constructor(processorsDirectory: string, storage: BasicStorage<ProcessorDTO>) {
    super('processor', processorsDirectory, storage)
  }

  public setCloudService(cloudService: CloudSharingService<ProcessorDTO>) {
    this.cloudService = cloudService
  }

  public static async init(processorsDirectory: string, storage: BasicStorage<ProcessorDTO>): Promise<ProcessorsManager> {
    if (ProcessorsManager.instance) {
      return ProcessorsManager.instance
    }
    ProcessorsManager.instance = new ProcessorsManager(processorsDirectory, storage)
    await ProcessorsManager.instance.initialize()
    return ProcessorsManager.instance
  }

  public static async getInstance(): Promise<ProcessorsManager | null> {
    if (!ProcessorsManager.instance) {
      return null
    }
    return ProcessorsManager.instance
  }

  async serializeInstance(name: string): Promise<ProcessorDTO | null> {

    const filename = this.instanceMap.get(name)
    if (!filename) return null

    const filePath = path.join(this.codeDirectory, filename)
    try {
      const code = await fsPromises.readFile(filePath, 'utf-8')
      return new ProcessorDTO({ name, code })
    } catch (error) {
      console.error(`Error serializing tool '${name}':`, error)
      return null

    }
  }
}