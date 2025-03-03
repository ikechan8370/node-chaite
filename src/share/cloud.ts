import { Serializable } from '../types'
import { CloudSharingService, Filter, SearchOption, User } from '../types/cloud'
import { SerializedTool } from './tool'

// todo
export class DefaultToolCloudService implements CloudSharingService<SerializedTool> {

  constructor(private cloudApiBaseUrl: string, private identifier: string, private user: User) {

  }

  authenticate(apiKey: string): Promise<User> {
    throw new Error('Method not implemented.')
  }

  list(filter: Filter, query: string, searchOption: SearchOption): Promise<(SerializedTool & { id: string })[]> {
    throw new Error('Method not implemented.')
  }

  upload(model: Serializable): Promise<SerializedTool> {
    throw new Error('Method not implemented.')
  }

  download(shareId: string): Promise<SerializedTool> {
    throw new Error('Method not implemented.')
  }

  initializeTransfer(model: Serializable): Promise<string> {
    throw new Error('Method not implemented.')
  }
  
}