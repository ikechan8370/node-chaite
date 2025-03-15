// ************** 处理器 **************

import { AbstractShareable } from './cloud.js'
import { AssistantMessage, UserMessage } from './models.js'
import { PROCESSOR_TYPE_MAP } from '../const/index.js'

export class ProcessorDTO extends AbstractShareable<ProcessorDTO> {
  constructor(public name: string, public code: string) {
    super()
    this.modelType = 'executable'
  }

  type: 'pre' | 'post'
  
  toFormatedString(_verbose?: boolean): string {
    let base = `处理器ID：${this.id}\n处理器名称：${this.name} \n类型：${PROCESSOR_TYPE_MAP[this.type]}\n描述：${this.description}\n`
    base += `创建时间：${this.createdAt}\n最后更新时间：${this.updatedAt}\n上传者：${this.uploader.username ? ('@' + this.uploader.username) : ''}`
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

