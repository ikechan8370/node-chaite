// ************** 处理器 **************

import { AbstractShareable } from './cloud.js'
import { AssistantMessage, UserMessage } from './models.js'

export class ProcessorDTO extends AbstractShareable<ProcessorDTO> {
  constructor(public name: string, public code: string) {
    super()
    this.modelType = 'executable'
  }

  type: 'pre' | 'post'
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

