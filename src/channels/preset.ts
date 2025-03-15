import { AbstractShareable, SendMessageOption } from '../types/index.js'

/**
 * 对话模式预设，最终使用的
 */
export class ChatPreset extends AbstractShareable<ChatPreset> {
  prefix: string
  channelId: string
  local: boolean
  namespace?: string
  sendMessageOption: SendMessageOption

  toString(): string {
    return JSON.stringify({
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      embedded: this.embedded,
      uploader: this.uploader,
      modelType: this.modelType,
      prefix: this.prefix,
      channelId: this.channelId,
      name: this.name,
      local: this.local,
      namespace: this.namespace,
      description: this.description,
      sendMessageOption: this.sendMessageOption?.toString(), // 嵌套序列化
    })
  }

  fromString(str: string): ChatPreset {
    const raw = JSON.parse(str)
    const preset = new ChatPreset()

    preset.prefix = raw.prefix
    preset.channelId = raw.channelId
    preset.name = raw.name
    preset.local = raw.local
    preset.namespace = raw.namespace
    preset.description = raw.description
    preset.id = raw.id
    preset.createdAt = raw.createdAt
    preset.updatedAt = raw.updatedAt
    preset.embedded = raw.embedded
    preset.uploader = raw.uploader
    preset.modelType = raw.modelType

    if (raw.sendMessageOption) {
      preset.sendMessageOption = SendMessageOption.create().fromString(raw.sendMessageOption)
    }

    return preset
  }

  toFormatedString(verbose?: boolean): string {
    let base = `预设ID：${this.id}\n预设名称：${this.name} \nnamespace：${this.namespace}\n描述：${this.description}\n前缀：${this.prefix}\n`
    if (verbose) {
      base += `渠道：${this.channelId}\n`
    }
    base += `创建时间：${this.createdAt}\n最后更新时间：${this.updatedAt}\n上传者：${this.uploader.username ? ('@' + this.uploader.username) : ''}`
    return base.trimEnd()
  }
}
