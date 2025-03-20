import {
  AbstractShareable,
  CloudAPIResponse,
  CloudAPIType,
  CloudSharingService,
  Filter,
  SearchOption,
  User,
} from '../types/index'
import { createHttpClient, HttpClient } from '../utils/index'
import { CloudAPI } from '../const/index'

export class DefaultCloudService<T extends AbstractShareable<T>> implements CloudSharingService<T> {

  client: HttpClient

  type!: CloudAPIType

  user!: User

  identifier!: string

  constructor(private cloudApiBaseUrl: string, type: CloudAPIType) {
    this.client = createHttpClient({
      baseURL: this.cloudApiBaseUrl,
    })
    this.type = type
  }

  setUser(user: User) {
    this.user = user
    this.identifier = user.user_id + ''
  }

  async authenticate(apiKey: string): Promise<User | null> {
    const response = await this.client.post<CloudAPIResponse<User>, unknown>(CloudAPI.USER, {
      apiKey,
    })
    const user = response.data?.data
    if (user) {
      this.user = user
      this.identifier = user.user_id + ''
    }
    return user || null
  }

  async list(filter: Filter, query: string, searchOption: SearchOption): Promise<(T)[] | null> {
    const response = await this.client.post<CloudAPIResponse<T[]>, unknown>(CloudAPI.LIST[this.type], {
      filter,
      query,
      searchOption,
    })
    return response.data?.data || null
  }

  async upload(model: T): Promise<T | null> {
    const response = await this.client.post<CloudAPIResponse<T>, T>(CloudAPI.ADD[this.type], model)
    return response.data?.data || null
  }

  async download(shareId: string): Promise<T | null> {
    const response = await this.client.get<CloudAPIResponse<T>>(CloudAPI.GET[this.type], {
      params: {
        shareId,
      },
    })
    return response.data?.data || null
  }

  async initializeTransfer(model: T): Promise<string | null> {
    const response = await this.client.post<CloudAPIResponse<string>, unknown>(CloudAPI.TEMP_SHARE[this.type], {
      time: 5 * 60,
      limit: 1,
      permission: 'any',
      content: model,
    })
    return response.data?.data || null
  }

  async delete(shareId: string): Promise<boolean> {
    const response = await this.client.post<CloudAPIResponse<boolean>, unknown>(CloudAPI.DELETE[this.type], {
      shareId,
    })
    return response.data?.data || false
  }

  getUser(): User | null {
    return this.user
  }

}
