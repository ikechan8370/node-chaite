import { Serializable } from './tools'

export interface CloudAPIResponse<T> {
  code: number
  data?: T
  msg: string
}

export interface CloudSharingService<T> {
  authenticate(apiKey: string): Promise<User | null>,
  upload(model: Serializable): Promise<T & { id: string } | null>; // 返回共享ID
  download(shareId: string): Promise<T | null>;
  initializeTransfer(model: Serializable): Promise<string | null>;
  list(filter: Filter, query: string, searchOption: SearchOption): Promise<Array<T & { id: string }> | null>;
}

type FilterValue = string | number | boolean | FilterValue[];
export type Filter = Record<string, FilterValue | Record<string, FilterValue>>

export interface SearchOption {
  searchFields: string[];
  // todo
}

export interface User {
  username: string,
  user_id: string | number,
  api_key?: string,

  github?: string
  email?: string
  google?: string
  linux_do?: string,
  apple?: string,
  microsoft?: string,
}