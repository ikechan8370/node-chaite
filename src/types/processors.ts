// ************** 处理器 **************

import { AbstractShareable } from './cloud'
import { AssistantMessage, UserMessage } from './models'
import { PROCESSOR_TYPE_MAP } from '../const/index'

export class ProcessorDTO extends AbstractShareable<ProcessorDTO> {
  constructor(params: Partial<ProcessorDTO>) {
    super(params)
    this.modelType = 'executable'
    if (params.type) {
      this.type = params.type
    }
  }

  type: 'pre' | 'post'

  fromString(str: string): ProcessorDTO {
    return new ProcessorDTO(JSON.parse(str))
  }

  toFormatedString(_verbose?: boolean): string {
    let base = `处理器ID：${this.id}`

    if (this.name) {
      base += `\n处理器名称：${this.name}`
    }

    if (this.type) {
      base += `\n类型：${PROCESSOR_TYPE_MAP[this.type]}`
    }

    if (this.description) {
      base += `\n描述：${this.description}`
    }

    if (this.createdAt) {
      base += `\n创建时间：${this.createdAt}`
    }

    if (this.updatedAt) {
      base += `\n最后更新时间：${this.updatedAt}`
    }

    if (this.uploader?.username) {
      base += `\n上传者：@${this.uploader.username}`
    }

    return base.trimEnd()
  }
}

export interface Processor {
  type: 'pre' | 'post'
  name: string
}

/**
 * 继承这个来实现一个前处理器
 */
export abstract class PreProcessor implements Processor {
  type: 'pre'

  abstract process(message: UserMessage): Promise<UserMessage>

  name: string

  id: string
}

/**
 * 继承这个来实现一个后处理器
 */
export abstract class PostProcessor implements Processor {
  type: 'post'

  abstract process(message: AssistantMessage): Promise<AssistantMessage>

  name: string

  id: string
}

