import { request } from '../http'

interface LocalListResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListProcessorDTO {
  name?: string
  ptype?: 'post' | 'pre'
  page?: number
  pageSize?: number
}

export function fetchProcessorList(query: ListProcessorDTO = {}) {
  return request.Get<Service.ResponseResult<LocalListResult<Shareable.ProcessorModel>>>('/api/processors/list', {
    params: query,
  })
}

export function fetchProcessorDetail(id: string) {
  return request.Get<Service.ResponseResult<Shareable.ProcessorModel>>(`/api/processors/${id}`)
}

export function createProcessor(data: Shareable.ProcessorModel) {
  return request.Post<Service.ResponseResult<any>>('/api/processors/', data)
}

export function updateProcessor(id: string, data: Partial<Shareable.ProcessorModel>) {
  return request.Put<Service.ResponseResult<Shareable.ProcessorModel>>(`/api/processors/${id}`, data)
}

export function deleteProcessor(id: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/processors/${id}`)
}

export function uploadProcessorToCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ProcessorModel>>('/api/processors/upload', data)
}

export function downloadProcessorFromCloud(data: { id: string }) {
  return request.Post<Service.ResponseResult<Shareable.ProcessorModel>>('/api/processors/download', data)
}

export function listProcessorsFromCloud(req: Shareable.ListCloudToolDTORequest) {
  return request.Post<Service.ResponseResult<Shareable.PaginationResult<Shareable.ProcessorModel>>>('/api/processors/list-cloud', req)
}
