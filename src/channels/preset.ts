import { ChatPreset, ChatPresetsStorage } from '../types'

export class ChatPresetManager {
  private static instance: ChatPresetManager
  private storage?: ChatPresetsStorage

  public static getInstance(): ChatPresetManager {
    if (!ChatPresetManager.instance) {
      ChatPresetManager.instance = new ChatPresetManager()
    }
    return ChatPresetManager.instance
  }

  public setStorage(storage: ChatPresetsStorage): void {
    this.storage = storage
  }

  async savePreset(preset: ChatPreset): Promise<void> {
    if (!this.storage) throw new Error('Preset storage not initialized')
    await this.storage.savePreset(preset)
  }

  async getPreset(name: string): Promise<ChatPreset | null> {
    if (!this.storage) throw new Error('Preset storage not initialized')
    return this.storage.getPreset(name)
  }

  async deletePreset(name: string): Promise<void> {
    if (!this.storage) throw new Error('Preset storage not initialized')
    await this.storage.deletePreset(name)
  }

  async getAllPresets(options: {
    includeLocal?: boolean,
    namespace?: string
  } = {
    includeLocal: true,
  }): Promise<ChatPreset[]> {
    if (!this.storage) throw new Error('Preset storage not initialized')
    const presets = await this.storage.getAllPresets()

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

  async getPresetByPrefix(prefix: string): Promise<ChatPreset | null> {
    const presets = await this.getAllPresets()
    return presets.find(p => p.prefix === prefix) || null
  }

  async resolvePreset(prefixOrName: string): Promise<ChatPreset> {
    const byPrefix = await this.getPresetByPrefix(prefixOrName)
    if (byPrefix) return byPrefix

    const byName = await this.getPreset(prefixOrName)
    if (!byName) throw new Error(`Preset ${prefixOrName} not found`)

    return byName
  }
}
