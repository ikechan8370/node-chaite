import { CloudAPIResponse, CloudSharingService, Filter, SearchOption, User } from '../types/cloud'
import { SerializedTool } from './tool'
import { createHttpClient, HttpClient } from '../utils'
import { CloudAPI } from '../const'

export class DefaultToolCloudService implements CloudSharingService<SerializedTool> {

  client: HttpClient

  constructor(private cloudApiBaseUrl: string, public identifier: string, public user: User) {
    this.client = createHttpClient({
      baseURL: this.cloudApiBaseUrl,
    })
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

  async list(filter: Filter, query: string, searchOption: SearchOption): Promise<(SerializedTool)[] | null> {
    const response = await this.client.post<CloudAPIResponse<SerializedTool[]>, unknown>(CloudAPI.LIST_TOOLS, {
      filter,
      query,
      searchOption,
    })
    return response.data?.data || null
  }

  async upload(model: SerializedTool): Promise<SerializedTool | null> {
    const response = await this.client.post<CloudAPIResponse<SerializedTool>, SerializedTool>(CloudAPI.ADD_TOOL, model)
    return response.data?.data || null
  }

  async download(shareId: string): Promise<SerializedTool | null> {
    const response = await this.client.get<CloudAPIResponse<SerializedTool>>(CloudAPI.GET_TOOL, {
      params: {
        shareId,
      },
    })
    return response.data?.data || null
  }

  async initializeTransfer(model: SerializedTool): Promise<string | null> {
    const response = await this.client.post<CloudAPIResponse<string>, unknown>(CloudAPI.TEMP_SHARE_TOOL, {
      time: 5 * 60,
      limit: 1,
      permission: 'any',
      content: model,
    })
    return response.data?.data || null
  }
  
}