// ************** 处理器 **************

import { DeSerializable, Serializable } from './tools'
import { User } from './cloud'
import { AssistantMessage, UserMessage } from './models'

export class ProcessorDTO implements Serializable, DeSerializable<ProcessorDTO> {
  code: string
  name: string
  type: 'pre' | 'post'
  id: string
  embedded: boolean
  description: string
  uploader: User
  utime: number
  ctime: number

  fromString(str: string): ProcessorDTO {
    return JSON.parse(str) as ProcessorDTO
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

export interface Processor {
  type: 'pre' | 'post'
  name: string
}

export abstract class PreProcessor implements Processor {
  type: 'pre'

  abstract process(message: UserMessage): Promise<UserMessage>

  name: string

  id: string
}


export abstract class PostProcessor implements Processor {
  type: 'post'

  abstract process(message: AssistantMessage): Promise<AssistantMessage>

  name: string

  id: string
}

export interface ProcessorStorage {
  // savePreset(preset: ToolPreset): Promise<void>;
  // getPreset(name: string): Promise<ToolPreset | null>;
  // deletePreset(name: string): Promise<void>;
  // getAllPresets(): Promise<ToolPreset[]>;
  saveProcessor(processor: ProcessorDTO): Promise<void>
  getProcessor(id: string): Promise<ProcessorDTO | null>
  deleteProcessor(id: string): Promise<void>
  getAllProcessors(): Promise<ProcessorDTO[]>
}

