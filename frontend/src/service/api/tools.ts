import { request } from '../http'

import PaginationResult = Shareable.PaginationResult

export interface ListToolModels {
  name?: string
}

export function fetchToolList(query: ListToolModels) {
  return request.Get<Service.ResponseResult<Shareable.ToolModel[]>>('/api/tools/list', {
    params: query,
  })
}

export function fetchToolDetail(id: string) {
  return request.Get<Service.ResponseResult<Shareable.ToolModel>>(`/api/tools/${id}`)
}

export function createTool(data: Shareable.ToolModel) {
  return request.Post<Service.ResponseResult<any>>('/api/tools/', data)
}

export function updateTool(id: string, data: Partial<Shareable.ToolModel>) {
  return request.Put<Service.ResponseResult<Shareable.ToolModel>>(`/api/tools/${id}`, data)
}

export function deleteTool(id: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/tools/${id}`)
}

export function uploadToolToCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ToolModel>>('/api/tools/upload', data)
}

export function downloadToolFromCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ToolModel>>('/api/tools/download', data)
}

export function listToolsFromCloud(req: Shareable.ListCloudToolDTORequest) {
  return request.Post<Service.ResponseResult<PaginationResult<Shareable.ToolModel>>>('/api/tools/list-cloud', req)
}
