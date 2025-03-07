import { ArgumentValue } from './models'
import { AbstractShareable } from './cloud'

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



