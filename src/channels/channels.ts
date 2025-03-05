import { Channel, ChannelsLoadBalancer, ChannelsStorage } from '../types'

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

export class ChannelsManager {

  private static instance: ChannelsManager

  private storage: ChannelsStorage

  public static getInstance(loadBalancer: ChannelsLoadBalancer = new DefaultChannelLoadBalancer()): ChannelsManager {
    if (!ChannelsManager.instance) {
      ChannelsManager.instance = new ChannelsManager(loadBalancer)
    }
    return ChannelsManager.instance
  }

  public static setStorage(storage: ChannelsStorage): ChannelsManager {
    ChannelsManager.getInstance().setStorage(storage)
    return ChannelsManager.instance
  }

  public setStorage(storage: ChannelsStorage) {
    this.storage = storage
  }

  private constructor(private loadBalancer: ChannelsLoadBalancer) {
  }
  
  async saveChannel(channel: Channel): Promise<void> {
    await this.storage.saveChannel(channel)
  }
  
  async getChannel(id: string): Promise<Channel | null> {
    return await this.storage.getChannel(id)
  }

  async getChannelByName(name: string): Promise<Channel[]> {
    return await this.storage.getChannelByName(name)
  }
  
  async deleteChannel(name: string): Promise<void> {
    await this.storage.deleteChannel(name)
  }
  
  async getAllChannels(model?: string): Promise<Channel[]> {
    return await this.storage.getAllChannels(model)
  }
  
  async getChannelByType(type: Channel['type']): Promise<Channel[]> {
    return await this.storage.getChannelByType(type)
  }
  
  async getChannelByStatus(status: 'enabled' | 'disabled'): Promise<Channel[]> {
    return await this.storage.getChannelByStatus(status)
  }
 
  async getChannelByModel(model: string): Promise<Channel[]> {
    const channels = await this.getAllChannels(model)
    const channel = await this.loadBalancer.getChannel(model, channels)
    return channel ? [channel] : []
  }
}