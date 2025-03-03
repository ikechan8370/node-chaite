import { ArgumentValue } from './models'

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

export interface ToolMetadata {
  name: string;
  filename: string;
}

export interface Preset {
  name: string;
  tools: string[]; // 工具名称列表
}

/**
 * 抽象的预设管理接口，不同框架去实际实现
 */
export interface PresetStorage {
  savePreset(preset: Preset): Promise<void>;
  getPreset(name: string): Promise<Preset | null>;
  deletePreset(name: string): Promise<void>;
  getAllPresets(): Promise<Preset[]>;
}

export interface Serializable {
  toString(): string;
}

export interface DeSerializable<T> {
  fromString(str: string): T;
}



