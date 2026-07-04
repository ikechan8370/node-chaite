import { request } from '../http'

export type CustomConfigValueType = string | number | boolean | object | undefined | null | CustomConfigValueType[]
export type CustomConfig = Record<string, CustomConfigValueType | Record<string, CustomConfigValueType>>

export function fetchConfig() {
  return request.Get<Service.ResponseResult<CustomConfig>>('/api/config/')
}

export function saveConfig(data: CustomConfig) {
  return request.Post<Service.ResponseResult<CustomConfig>>(`/api/config/`, data)
}
