import { ArgumentValue } from './models'
import { AbstractShareable } from './cloud'
import { CHANNEL_STATUS_MAP } from '../const/index'

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
  constructor(params: Partial<ToolDTO>) {
    super(params)
    this.modelType = 'executable'
    this.permission = params.permission || 'private'
    this.status = params.status || 'enabled'
  }

  status: 'enabled' | 'disabled'
  public permission: 'public' | 'private' | 'onetime'

  toFormatedString(_verbose?: boolean): string {
    let base = `工具名称：${this.name}`

    if (this.description) {
      base += `\n工具描述：${this.description}`
    }

    if (this.permission) {
      base += `\n权限：${this.permission}`
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

  fromString(str: string): ToolDTO {
    return new ToolDTO(JSON.parse(str))
  }
}

/**
 * 工具组，与若干个工具关联
 */
export interface ToolsGroup {
  id: string;
  name: string;
  description: string;
  toolIds: string[]; // 或者使用实际的工具引用
  isDefault?: boolean;
}

export class ToolsGroupDTO extends AbstractShareable<ToolsGroupDTO> implements ToolsGroup {
  constructor(params: Partial<ToolsGroupDTO>) {
    super(params)
    this.modelType = 'settings'
  }

  toolIds: string[]
  isDefault?: boolean | undefined

  toFormatedString(_verbose?: boolean): string {
    let base = `工具组名称：${this.name}`

    if (this.description) {
      base += `\n工具组描述：${this.description}`
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

/**
 * js写的工具可以继承这个抽象类
 */
export abstract class CustomTool {
  type = 'function' as const
  function: Function = {
    name: '',
    description: '',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  }

  async run(_args: Record<string, ArgumentValue | Record<string, ArgumentValue>>): Promise<string> {
    throw new Error('Not implemented')
  }
}



