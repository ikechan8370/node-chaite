import { request } from '../http'
import { fetchAllLocalItems } from './pagination'
import type { LocalPageResult } from './pagination'

export interface ListPresets {
  name?: string
  prompt?: string
  page?: number
  pageSize?: number
}

export function fetchPresetList(query: ListPresets) {
  return request.Get<Service.ResponseResult<LocalPageResult<Shareable.PresetModel>>>('/api/preset/list', {
    params: query,
  })
}

export function fetchAllPresetList(query: ListPresets = {}) {
  return fetchAllLocalItems<Shareable.PresetModel, ListPresets>(fetchPresetList, query)
}

export function fetchPresetDetail(id: string) {
  return request.Get<Service.ResponseResult<Shareable.PresetModel>>(`/api/preset/${id}`)
}

export function createPreset(data: Shareable.PresetModel) {
  return request.Post<Service.ResponseResult<any>>('/api/preset/', data)
}

export function updatePreset(id: string, data: Partial<Shareable.PresetModel>) {
  return request.Put<Service.ResponseResult<Shareable.PresetModel>>(`/api/preset/${id}`, data)
}

export function deletePreset(id: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/preset/${id}`)
}

export function uploadPresetToCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.PresetModel>>('/api/preset/upload', data)
}

export function downloadPresetFromCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.PresetModel>>('/api/preset/download', data)
}

export function listPresetsFromCloud(req: Shareable.ListCloudPresetRequest) {
  return request.Post<Service.ResponseResult<Shareable.PaginationResult<Shareable.PresetModel>>>('/api/preset/list-cloud', req)
}
