import { ClientType, SendMessageOption } from './adapter'
import { BaseClientOptions } from './common'
import { DeSerializable, Serializable, Wait } from './tools'

/**
 * 渠道
 * 每个渠道对应一个adapter，并记录客户端的options
 */
export class Channel implements Serializable, DeSerializable<Channel>, Wait {
  constructor(id: string, adapterType: ClientType, options: BaseClientOptions, name: string, type: ClientType, status: 'enabled' | 'disabled', statistics: ChannelStatistics, weight?: number, priority?: number, disabledReason?: string) {
    this.id = id
    this.adapterType = adapterType
    this.options = options
    this.name = name
    this.type = type
    this.weight = weight || 1
    this.priority = priority || 1
    this.status = status
    this.disabledReason = disabledReason
    this.statistics = statistics
    this.init()
  }

  async init() {
    return this.options.ready()
  }

  async ready(): Promise<void> {
    await this.init()
  }

  adapterType: ClientType
  options: BaseClientOptions
  id: string
  name: string
  type: ClientType
  weight: number
  priority: number
  status: 'enabled' | 'disabled'
  disabledReason?: string
  statistics: ChannelStatistics
  
  fromString(str: string): Channel {
    const channel = JSON.parse(str)
    return new Channel(channel.id, channel.adapterType, new BaseClientOptions().fromString(channel.options), channel.name, channel.type, channel.status, new ChannelStatistics().fromString(channel.statistics), channel.weight, channel.priority, channel.disabledReason)
  }

  toString(): string {
    const toJsonStr = {
      id: this.id,
      adapterType: this.adapterType,
      options: this.options.toString(),
      name: this.name,
      type: this.type,
      weight: this.weight,
      statistics: this.statistics.toString(),
      status: this.status,
      priority: this.priority,
      disabledReason: this.disabledReason,
    }
    return JSON.stringify(toJsonStr)
  }
}

export class ChannelStatistics implements Serializable, DeSerializable<ChannelStatistics> {
  callTimes?: number
  useToken?: number
  perModel: Record<string, Omit<ChannelStatistics, 'perModel'>>

  fromString(str: string): ChannelStatistics {
    const channel = JSON.parse(str) as ChannelStatistics
    this.callTimes = channel.callTimes
    this.useToken = channel.useToken
    this.perModel = channel.perModel
    return this
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

export interface ChannelsStorage {
  saveChannel(channel: Channel): Promise<void>
  getChannel(id: string): Promise<Channel | null>
  getChannelByName(name: string): Promise<Channel[]>
  deleteChannel(name: string): Promise<void>
  getAllChannels(model?: string): Promise<Channel[]>
  getChannelByType(type: ClientType): Promise<Channel[]>
  getChannelByStatus(status: 'enabled' | 'disabled'): Promise<Channel[]>
}

export interface ChannelsLoadBalancer {
  getChannel(model: string, channels: Channel[]): Promise<Channel | null>
}

/**
 * 对话模式预设，最终使用的
 */
export class ChatPreset implements Serializable, DeSerializable<ChatPreset> {
  prefix: string
  channelId: string
  name: string
  local: boolean
  namespace?: string
  description?: string

  sendMessageOption: SendMessageOption

  toString(): string {
    return JSON.stringify({
      prefix: this.prefix,
      channelId: this.channelId,
      name: this.name,
      local: this.local,
      namespace: this.namespace,
      description: this.description,
      sendMessageOption: this.sendMessageOption?.toString(), // 嵌套序列化
    })
  }

  fromString(str: string): ChatPreset {
    const raw = JSON.parse(str)
    const preset = new ChatPreset()

    preset.prefix = raw.prefix
    preset.channelId = raw.channelId
    preset.name = raw.name
    preset.local = raw.local
    preset.namespace = raw.namespace
    preset.description = raw.description

    if (raw.sendMessageOption) {
      preset.sendMessageOption = SendMessageOption.create().fromString(raw.sendMessageOption)
    }

    return preset
  }
}

/**
 * 抽象的对话预设管理接口，不同框架去实际实现
 */
export interface ChatPresetsStorage {
  savePreset(preset: ChatPreset): Promise<void>;
  getPreset(name: string): Promise<ChatPreset | null>;
  deletePreset(name: string): Promise<void>;
  getAllPresets(): Promise<ChatPreset[]>;
}