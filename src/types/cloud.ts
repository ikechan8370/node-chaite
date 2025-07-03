export interface CloudAPIResponse<T> {
  code: number
  data: T
  msg: string
}

export interface PaginationResult<T> {
  items: T[],
  pagination: {
    currentPage: number,
    pageSize: number,
    totalItems: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  },
  type: string
}

export interface CloudSharingService<T extends AbstractShareable<unknown>> {
  setUser(user: User): void,
  getUser(): User | null,
  authenticate(apiKey: string): Promise<User | null>,
  upload(model: Serializable): Promise<T | null>; // 返回共享ID
  download(shareId: string): Promise<T | null>;
  initializeTransfer(model: Serializable): Promise<string | null>;
  list(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T>>;
  delete(shareId: string): Promise<boolean>;
}

type FilterValue = string | number | boolean | FilterValue[];
export type Filter = Record<string, FilterValue | Record<string, FilterValue>>

export interface SearchOption {
  searchFields?: string[];
  page?: number
  pageSize?: number
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
  cloudId?: string
  embedded: boolean
  description: string
  uploader: User
  updatedAt: string
  createdAt: string

  md5: string

  toFormatedString(verbose?: boolean): string
}

export type Shareable<T> = Serializable & DeSerializable<T> & CloudModel

export abstract class AbstractShareable<T> implements Shareable<T> {
  constructor(params?: Partial<AbstractShareable<T>>) {
    if (params) {
      if (params.id) {
        this.id = params.id
      }
      if (params.name) {
        this.name = params.name
      }
      if (params.embedded) {
        this.embedded = params.embedded
      }
      if (params.uploader) {
        this.uploader = params.uploader
      }
      if (params.createdAt) {
        this.createdAt = params.createdAt
      }
      if (params.updatedAt) {
        this.updatedAt = params.updatedAt
      }
      if (params.cloudId) {
        this.cloudId = params.cloudId
      }
      if (params.description) {
        this.description = params.description
      }
      if (params.modelType) {
        this.modelType = params.modelType
      }
      if (params.code) {
        this.code = params.code
      }
      if (params.md5) {
        this.md5 = params.md5
      }
    }
  }
  modelType: 'settings' | 'executable'
  code?: string
  createdAt: string
  description: string
  embedded: boolean
  id: string
  cloudId?: string
  name: string
  uploader: User
  updatedAt: string

  fromString(str: string): T {
    return JSON.parse(str) as T
  }

  toString(): string {
    return JSON.stringify(this)
  }

  toFormatedString(verbose?: boolean): string {
    return JSON.stringify(this, null, 2)
  }

  md5: string
}

export interface Wait {
  ready(): Promise<void>
}
