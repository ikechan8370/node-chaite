export interface CloudAPIResponse<T> {
  code: number
  data?: T
  msg: string
}

export interface CloudSharingService<T> {
  setUser(user: User): void,
  getUser(): User | null,
  authenticate(apiKey: string): Promise<User | null>,
  upload(model: Serializable): Promise<T & { id: string } | null>; // 返回共享ID
  download(shareId: string): Promise<T | null>;
  initializeTransfer(model: Serializable): Promise<string | null>;
  list(filter: Filter, query: string, searchOption: SearchOption): Promise<Array<T & { id: string }> | null>;
  delete(shareId: string): Promise<boolean>;
}

type FilterValue = string | number | boolean | FilterValue[];
export type Filter = Record<string, FilterValue | Record<string, FilterValue>>

export interface SearchOption {
  searchFields?: string[];
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


export interface Serializable {
  toString(): string;
}

export interface DeSerializable<T> {
  fromString(str: string): T;
}

export interface CloudModel {
  modelType: 'settings' | 'executable'
  code?: string
  name: string
  id: string
  embedded: boolean
  description: string
  uploader: User
  utime: number
  ctime: number
}

export type Shareable<T> = Serializable & DeSerializable<T> & CloudModel

export abstract class AbstractShareable<T> implements Shareable<T> {
  modelType: 'settings' | 'executable'
  code?: string
  ctime: number
  description: string
  embedded: boolean
  id: string
  name: string
  uploader: User
  utime: number

  fromString(str: string): T {
    return JSON.parse(str) as T
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

export interface Wait {
  ready(): Promise<void>
}
