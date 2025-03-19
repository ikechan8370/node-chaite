import { DeSerializable, Serializable } from './cloud'
import { Channel } from '../channels/index'

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


export interface ChannelsLoadBalancer {
  getChannel(model: string, channels: Channel[]): Promise<Channel | null>
  getChannels(model: string, channels: Channel[], totalQuantity: number): Promise<{ channel: Channel; quantity: number }[]>
}

