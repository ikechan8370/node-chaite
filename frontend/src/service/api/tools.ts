import { request } from '../http'
import { fetchAllLocalItems } from './pagination'

import PaginationResult = Shareable.PaginationResult

export interface ListToolModels {
  name?: string
  page?: number
  pageSize?: number
}

interface LocalListResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function fetchToolList(query: ListToolModels) {
  return request.Get<Service.ResponseResult<LocalListResult<Shareable.ToolModel>>>('/api/tools/list', {
    params: query,
  })
}

export function fetchAllToolList(query: ListToolModels = {}) {
  return fetchAllLocalItems<Shareable.ToolModel, ListToolModels>(fetchToolList, query)
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

export interface ToolTestSchema {
  name: string
  description: string
  parameters: { type: 'object'; properties: Record<string, { type: string; description?: string | null }>; required?: string[] }
}
export function fetchToolTestSchema(id: string) {
  return request.Get<Service.ResponseResult<ToolTestSchema>>(`/api/tools/${id}/test-schema`)
}
export function testTool(id: string, data: { args: Record<string, unknown>; userId?: string; groupId?: string }) {
  return request.Post<Service.ResponseResult<{ result: string; durationMs: number }>>(`/api/tools/${id}/test`, data)
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
