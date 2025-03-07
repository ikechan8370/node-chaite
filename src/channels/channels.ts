import {
  AbstractShareable,
  BaseClientOptions,
  ChannelsLoadBalancer,
  ChannelStatistics,
  ClientType,
  Wait,
} from '../types'

export class DefaultChannelLoadBalancer implements ChannelsLoadBalancer {
  public constructor() {}

  async getChannel(name: string, channels: Channel[]): Promise<Channel> {
    // 按优先级分组并排序
    const priorityGroups = this.groupByPriority(channels)

    // 按优先级降序选择可用组
    for (const group of priorityGroups) {
      const availableChannels = group.filter(c => c.status === 'enabled')

      if (availableChannels.length > 0) {
        return this.selectByWeight(availableChannels)
      }
    }

    throw new Error('No available channels')
  }

  // 按优先级分组并降序排列
  private groupByPriority(channels: Channel[]): Channel[][] {
    const priorityMap = new Map<number, Channel[]>()

    channels.forEach(channel => {
      const group = priorityMap.get(channel.priority) || []
      group.push(channel)
      priorityMap.set(channel.priority, group)
    })

    return Array.from(priorityMap.keys())
      .sort((a, b) => b - a) // 降序排列
      .map(priority => priorityMap.get(priority)!)
  }

  // 在相同优先级内按权重选择
  private selectByWeight(channels: Channel[]): Channel {
    const totalWeight = channels.reduce((sum, c) => sum + c.weight, 0)
    let random = Math.random() * totalWeight

    for (const channel of channels) {
      random -= channel.weight
      if (random <= 0) {
        return channel
      }
    }
    return channels[0]
  }
}

/**
 * 渠道
 * 每个渠道对应一个adapter，并记录客户端的options
 */
export class Channel extends AbstractShareable<Channel> implements Wait {
  constructor(id: string, models: string[], adapterType: ClientType, options: BaseClientOptions, name: string, type: ClientType, status: 'enabled' | 'disabled', statistics: ChannelStatistics, weight?: number, priority?: number, disabledReason?: string) {
    super()
    this.modelType = 'settings'
    this.id = id
    this.models = models
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
  models: string[]
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
    return new Channel(channel.id, channel.adapterType, channel.models, new BaseClientOptions().fromString(channel.options), channel.name, channel.type, channel.status, new ChannelStatistics().fromString(channel.statistics), channel.weight, channel.priority, channel.disabledReason)
  }

  toString(): string {
    const toJsonStr = {
      id: this.id,
      models: this.models,
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