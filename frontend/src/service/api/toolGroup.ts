import { request } from '../http'
import { fetchAllLocalItems } from './pagination'
import type { LocalPageResult } from './pagination'
import PaginationResult = Shareable.PaginationResult

export interface ListToolGroupModels {
  name?: string
  page?: number
  pageSize?: number
}

export function fetchToolGroupList(query: ListToolGroupModels) {
  return request.Get<Service.ResponseResult<LocalPageResult<Shareable.ToolsGroupModel>>>('/api/toolGroups/list', {
    params: query,
  })
}

export function fetchAllToolGroupList(query: ListToolGroupModels = {}) {
  return fetchAllLocalItems<Shareable.ToolsGroupModel, ListToolGroupModels>(fetchToolGroupList, query)
}

export function fetchToolGroupDetail(id: string) {
  return request.Get<Service.ResponseResult<Shareable.ToolsGroupModel>>(`/api/toolGroups/${id}`)
}

export function createToolGroup(data: Shareable.ToolsGroupModel) {
  return request.Post<Service.ResponseResult<any>>('/api/toolGroups/', data)
}

export function updateToolGroup(id: string, data: Partial<Shareable.ToolsGroupModel>) {
  return request.Put<Service.ResponseResult<Shareable.ToolsGroupModel>>(`/api/toolGroups/${id}`, data)
}

export function deleteToolGroup(id: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/toolGroups/${id}`)
}

export function uploadToolGroupToCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ToolsGroupModel>>('/api/toolGroups/upload', data)
}

export function downloadToolGroupFromCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ToolsGroupModel>>('/api/toolGroups/download', data)
}

export function listToolGroupsFromCloud(req: Shareable.ListCloudToolDTORequest) {
  return request.Post<Service.ResponseResult<PaginationResult<Shareable.ToolsGroupModel>>>('/api/toolGroups/list-cloud', req)
}
