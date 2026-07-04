import { request } from '../http'

import PaginationResult = Shareable.PaginationResult

export function fetchTriggerList(query: Shareable.ListTriggerDTO) {
  return request.Get<Service.ResponseResult<Shareable.TriggerModel[]>>('/api/triggers/list', {
    params: query,
  })
}

export function fetchTriggerDetail(id: string) {
  return request.Get<Service.ResponseResult<Shareable.TriggerModel>>(`/api/triggers/${id}`)
}

export function createTrigger(data: Shareable.TriggerModel) {
  return request.Post<Service.ResponseResult<any>>('/api/triggers/', data)
}

export function updateTrigger(id: string, data: Partial<Shareable.TriggerModel>) {
  return request.Put<Service.ResponseResult<Shareable.TriggerModel>>(`/api/triggers/${id}`, data)
}

export function deleteTrigger(id: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/triggers/${id}`)
}

export function uploadTriggerToCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.TriggerModel>>('/api/triggers/upload', data)
}

export function downloadTriggerFromCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.TriggerModel>>('/api/triggers/download', data)
}

export function listTriggersFromCloud(req: Shareable.ListCloudToolDTORequest) {
  return request.Post<Service.ResponseResult<PaginationResult<Shareable.TriggerModel>>>('/api/triggers/list-cloud', req)
}
