import {
  AbstractShareable,
  CloudAPIResponse,
  CloudAPIType,
  CloudSharingService,
  Filter, PaginationResult, ProcessorDTO,
  SearchOption, ToolDTO, ToolsGroupDTO, TriggerDTO,
  User,
} from '../types'
import { createHttpClient, HttpClient } from '../utils/index'
import { CloudAPI } from '../const'
import { Channel, ChatPreset } from '../channels'

export class DefaultCloudService<T extends AbstractShareable<T>> implements CloudSharingService<T> {

  client: HttpClient

  type!: CloudAPIType

  user!: User

  identifier!: string

  apiKey: string

  constructor(private cloudApiBaseUrl: string, type: CloudAPIType) {
    this.client = createHttpClient({
      baseURL: this.cloudApiBaseUrl,
    })
    this.type = type
  }

  setUser(user: User) {
    this.user = user
    this.identifier = user.user_id + ''
    if (user.api_key) {
      this.apiKey = user.api_key
      this.client.updateOptions({
        headers: {
          Authorization: 'ApiKey ' + this.apiKey,
        },
      })
    }
  }

  async authenticate(apiKey: string): Promise<User | null> {
    const response = await this.client.post<CloudAPIResponse<User>, unknown>(CloudAPI.USER, {
      apiKey,
    }, {
      headers: {
        Authorization: 'ApiKey ' + apiKey,
      },
    })
    this.apiKey = apiKey
    const user = response.data
    if (user) {
      this.user = user
      this.identifier = user.user_id + ''
      this.client.updateOptions({
        headers: {
          Authorization: 'ApiKey ' + apiKey,
        },
      })
    }
    return user || null
  }

  async list(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T>> {
    const response = await this.client.post<CloudAPIResponse<PaginationResult<T>>, unknown>(CloudAPI.LIST[this.type], {
      filter,
      query,
      searchOption,
    })
    const tempInstance = this.createEmptyInstance()

    if (response.data?.items?.length) {
      response.data.items = response.data.items.map(item => {
        return tempInstance.fromString(JSON.stringify(item))
      })
    }
    return response.data
  }

  private createEmptyInstance(): T {
    const EmptyClass = this.getClassForType()
    return new EmptyClass({}) as T
  }

  private getClassForType(): new ({}) => T {
    switch (this.type) {
    case 'tool':
      return ToolDTO as any
    case 'chat-preset':
      return ChatPreset as any
    case 'processor':
      return ProcessorDTO as any
    case 'channel':
      return Channel as any
    case 'tool-group':
      return ToolsGroupDTO as any
    case 'trigger':
      return TriggerDTO as any
    default:
      throw new Error(`Unknown type: ${this.type}`)
    }
  }

  async upload(model: T): Promise<T | null> {
    const response = await this.client.post<CloudAPIResponse<T>, T>(CloudAPI.ADD[this.type], model)
    return response.data || null
  }

  async download(shareId: string): Promise<T | null> {
    const response = await this.client.get<CloudAPIResponse<T>>(CloudAPI.GET[this.type] + shareId)
    return response.data || null
  }

  async initializeTransfer(model: T): Promise<string | null> {
    const response = await this.client.post<CloudAPIResponse<string>, unknown>(CloudAPI.TEMP_SHARE[this.type], {
      time: 5 * 60,
      limit: 1,
      permission: 'any',
      content: model,
    })
    return response.data || null
  }

  async delete(shareId: string): Promise<boolean> {
    const response = await this.client.post<CloudAPIResponse<boolean>, unknown>(CloudAPI.DELETE[this.type], {
      shareId,
    })
    return response.data || false
  }

  getUser(): User | null {
    return this.user
  }

}
