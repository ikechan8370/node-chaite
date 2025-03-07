import { NonExecutableShareableManager } from './shareable'
import { Channel, DefaultChannelLoadBalancer } from '../channels'
import { BasicStorage } from '../types/storage'
import { ChannelsLoadBalancer } from '../types'

export class ChannelsManager extends NonExecutableShareableManager<Channel> {
  private static instance: ChannelsManager
  private constructor(protected storage: BasicStorage<Channel>, private loadBalancer: ChannelsLoadBalancer = new DefaultChannelLoadBalancer()) {
    super('chat-preset', storage)
  }

  public static async init(storage: BasicStorage<Channel>, loadBalancer: ChannelsLoadBalancer) {
    if (ChannelsManager.instance) {
      return ChannelsManager.instance
    }
    ChannelsManager.instance = new ChannelsManager(storage, loadBalancer)
    return ChannelsManager.instance
  }

  public static async getInstance(): Promise<ChannelsManager | null> {
    if (!ChannelsManager.instance) {
      return null
    }
    return ChannelsManager.instance
  }

  async getAllChannels(name?: string): Promise<Channel[]> {
    const allChannels = await this.storage.listItems()
    if (name) {
      return allChannels.filter(channel => channel.name.includes(name))
    } else {
      return allChannels
    }
  }

  async getChannelByType(type: Channel['type']): Promise<Channel[]> {
    const allChannels =  await this.storage.listItems()
    return allChannels.filter(channel => channel.type === type)
  }

  async getChannelByStatus(status: 'enabled' | 'disabled'): Promise<Channel[]> {
    const allChannels = await this.storage.listItems()
    return allChannels.filter(channel => channel.status === status)
  }

  async getChannelByModel(model: string): Promise<Channel[]> {
    const channels = await this.getAllChannels(model)
    const channel = await this.loadBalancer.getChannel(model, channels)
    return channel ? [channel] : []
  }

}