import { NonExecutableShareableManager } from './shareable'
import { ChatPreset } from '../channels/index'
import { BasicStorage } from '../types/index'

export class ChatPresetManager extends NonExecutableShareableManager<ChatPreset> {
  private static instance: ChatPresetManager
  private constructor(protected storage: BasicStorage<ChatPreset>) {
    super('chat-preset', storage)
  }

  public static async init(storage: BasicStorage<ChatPreset>) {
    if (ChatPresetManager.instance) {
      return ChatPresetManager.instance
    }
    ChatPresetManager.instance = new ChatPresetManager(storage)
    return ChatPresetManager.instance
  }

  public static async getInstance(): Promise<ChatPresetManager | null> {
    if (!ChatPresetManager.instance) {
      return null
    }
    return ChatPresetManager.instance
  }

  public async getAllPresets(options: {
    includeLocal?: boolean,
    namespace?: string
  } = {
    includeLocal: true,
  }): Promise<ChatPreset[]> {
    if (!this.storage) throw new Error('Preset storage not initialized')
    const presets = await this.storage.listItems()

    return presets.filter(preset => {
      const matchNamespace = options.namespace
        ? preset.namespace === options.namespace
        : true
      const matchLocal = options.includeLocal
        ? true
        : !preset.local
      return matchNamespace && matchLocal
    })
  }

  public async getPresetByPrefix(prefix: string): Promise<ChatPreset | null> {
    const presets = await this.getAllPresets()
    return presets.find(p => p.prefix === prefix) || null
  }

}