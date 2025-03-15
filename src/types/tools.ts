import { ArgumentValue } from './models.js'
import { AbstractShareable } from './cloud.js'
import { CHANNEL_STATUS_MAP } from '../const/index.js'

export interface Function {
    name: string
    description: string
    parameters: Parameter
}

export interface Parameter {
    type: 'object'
    properties: Record<string, Property>
    required: string[]
}

export interface Property {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    description: string | null
}

export interface Tool {
    name: Function['name']
    type: 'function'
    function: Function
    run(args: Record<string, ArgumentValue | Record<string, ArgumentValue>>): Promise<string>
}



export class ToolDTO extends AbstractShareable<ToolDTO> {
  constructor(public name: string, public code: string) {
    super()
    this.modelType = 'executable'
  }

  public permission: 'public' | 'private' | 'onetime'

  toFormatedString(_verbose?: boolean): string {
    let base = `工具名称：${this.name}\n工具描述：${this.description}`
    base += `创建时间：${this.createdAt}\n最后更新时间：${this.updatedAt}\n上传者：${this.uploader.username ? ('@' + this.uploader.username) : ''}`
    return base.trimEnd()
  }
}

/**
 * js写的工具可以继承这个抽象类
 */
export abstract class CustomTool {
  type: 'function'
  function: Function

  async run(_args: Record<string, ArgumentValue | Record<string, ArgumentValue>>): Promise<string> {
    throw new Error('Not implemented')
  }
}



