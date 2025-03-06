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



// **************** 管理部分 *******************8

export interface ToolSettings {
  name: string;
  tools: string[]; // 工具名称列表
}

/**
 * 抽象的预设管理接口，不同框架去实际实现
 */
export interface ToolSettingsStorage {
  saveToolSettings(preset: ToolSettings): Promise<void>;
  getToolSettings(name: string): Promise<ToolSettings | null>;
  deleteToolSettings(name: string): Promise<void>;
  getAllToolSettings(): Promise<ToolSettings[]>;
}



