import { NonExecutableShareableManager } from './shareable'
import { Channel, DefaultChannelLoadBalancer } from '../channels/index'
import { BasicStorage, ChannelsLoadBalancer } from '../types/index'
import {Chaite, getLogger} from "../index";

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
    let channels = await this.getAllChannels()
    channels = channels.filter(channel => channel.models.includes(model))
    if (Chaite.getInstance().getGlobalConfig()?.getDebug()) {
      getLogger().debug(`查询所有渠道: ${model} -> ${channels.map(channel => channel.name).join(', ')}`)
    }
    const channel = await this.loadBalancer.getChannel(model, channels)
    if (Chaite.getInstance().getGlobalConfig()?.getDebug()) {
      getLogger().debug(`选中了渠道: ${model} -> ${channel?.name}`)
    }
    return channel ? [channel] : []
  }
  
  async getChannelsByModel(model: string, totalQuantity: number): Promise<{ channel: Channel; quantity: number }[]> {
    const channels = await this.getAllChannels(model)
    return await this.loadBalancer.getChannels(model, channels, totalQuantity)
  }
}