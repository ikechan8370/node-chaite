import { ColumnSpec, ColumnTypeName } from '../driver/types'

/**
 * 绝大多数可分享实体（渠道、预设、工具、处理器、触发器）都继承 AbstractShareable，
 * 表结构里因此有一整组完全相同的列。抽出来避免五份拷贝各自漂移。
 */
export const SHAREABLE_COLUMNS: Record<string, ColumnSpec | ColumnTypeName> = {
  cloudId: { type: 'int' },
  createdAt: { type: 'text' },
  updatedAt: { type: 'text' },
  md5: { type: 'text' },
  embedded: { type: 'bool', default: 0 },
  uploader: { type: 'json' },
}

/** 写入时统一打时间戳：首次写入补 createdAt，每次写入刷新 updatedAt。 */
export function stampTimestamps<T extends { createdAt?: string, updatedAt?: string }>(entity: T): T {
  if (!entity.createdAt) entity.createdAt = new Date().toISOString()
  entity.updatedAt = new Date().toISOString()
  return entity
}

/** 把 record 里的公共字段读回实体形状。 */
export function readShareable(record: Record<string, unknown>) {
  return {
    id: record.id as string,
    name: record.name as string,
    description: record.description as string,
    cloudId: record.cloudId as number,
    createdAt: record.createdAt as string,
    updatedAt: record.updatedAt as string,
    md5: record.md5 as string,
    embedded: Boolean(record.embedded),
  }
}

/** 把实体的公共字段写成 record 形状。 */
export function writeShareable(entity: Record<string, unknown>) {
  return {
    name: (entity.name as string) || '',
    description: (entity.description as string) || '',
    cloudId: (entity.cloudId as number) || null,
    createdAt: (entity.createdAt as string) || '',
    updatedAt: (entity.updatedAt as string) || '',
    md5: (entity.md5 as string) || '',
    embedded: entity.embedded ? 1 : 0,
  }
}
