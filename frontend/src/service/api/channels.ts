import { request } from '../http'

export interface ListChannels {
  name?: string
  type?: 'openai' | 'gemini' | 'claude'
  status?: 'enabled' | 'disabled'
  model?: string
}

export function fetchChannelList(query: ListChannels) {
  return request.Get<Service.ResponseResult<Shareable.ChannelModel[]>>('/api/channels/list', {
    params: query,
  })
}

export function fetchChannelDetail(id: string) {
  return request.Get<Service.ResponseResult<Shareable.ChannelModel>>(`/api/channels/${id}`)
}

export function createChanel(data: Shareable.ChannelModel) {
  return request.Post<Service.ResponseResult<any>>('/api/channels/', data)
}

export function updateChannel(id: string, data: Partial<Shareable.ChannelModel>) {
  return request.Put<Service.ResponseResult<Shareable.ChannelModel>>(`/api/channels/${id}`, data)
}

export function deleteChanel(id: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/channels/${id}`)
}

export function uploadChannelToCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ChannelModel>>('/api/channels/upload', data)
}

export function downloadChannelFromCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ChannelModel>>('/api/channels/download', data)
}

export function listChannelsFromCloud(req: Shareable.ListCloudChannelRequest) {
  return request.Post<Service.ResponseResult<Shareable.PaginationResult<Shareable.ChannelModel>>>('/api/channels/list-cloud', req)
}
