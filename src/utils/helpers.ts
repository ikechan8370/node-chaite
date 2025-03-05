import {
  BaseClientOptions,
  ChaiteContext,
  ILogger,
  MultipleKeyStrategy,
  MultipleKeyStrategyChoice,
} from '../types/common'
import { AsyncLocalStorage } from 'async_hooks'
import { ProcessorDTO, ProcessorStorage } from '../types'
import fs from 'fs/promises'
import path from 'path'

export async function getKey(apiKeys: string[] | string, strategy: MultipleKeyStrategy): Promise<string> {
  const logger = asyncLocalStorage.getStore()?.logger as ILogger
  const candidateApiKeys = Array.isArray(apiKeys) ? apiKeys : [ apiKeys ]
  const keyNum = candidateApiKeys.length
  if (keyNum === 0) {
    logger.error(`No key ${keyNum} found.`)
    throw new Error('No key provided')
  }
  let apiKey: string
  switch (strategy) {
  case MultipleKeyStrategyChoice.RANDOM: {
    const randomKeyIdx = Math.floor(Math.random() * keyNum)
    apiKey = candidateApiKeys[randomKeyIdx]
    break
  }
  case MultipleKeyStrategyChoice.ROUND_ROBIN: {
    logger.warn('ROUND_ROBIN is not supported yet')
    throw new Error('ROUND_ROBIN is not supported yet')
  }
  case MultipleKeyStrategyChoice.CONVERSATION_HASH: {
    logger.warn('CONVERSATION_HASH is not supported yet')
    throw new Error('CONVERSATION_HASH is not supported yet')
  }
  default: {
    throw new Error('unknown MultipleKeyStrategy')
  }
  }
  return apiKey
}

export const asyncLocalStorage = new AsyncLocalStorage<ChaiteContext>()

class DefaultProcessorStorage implements ProcessorStorage {
  saveProcessor(processor: ProcessorDTO): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getProcessor(id: string): Promise<ProcessorDTO | null> {
    throw new Error('Method not implemented.')
  }
  deleteProcessor(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getAllProcessors(): Promise<ProcessorDTO[]> {
    throw new Error('Method not implemented.')
  }
}

export const processStorage = new DefaultProcessorStorage()

export async function getProcessorDTOFromId(id: string): Promise<ProcessorDTO | null> {
  return processStorage.getProcessor(id)
}

export function serializeBaseClientOptions (options: BaseClientOptions) {

}

/**
 * 表示构造函数的类型
 */
type AbstractConstructor<T> = abstract new (...args: unknown[]) => T;

/**
 * 将JS代码保存到指定目录并导入其默认导出
 *
 * @param {string} jsContent - JS代码内容
 * @param {string} modulesDir - 保存模块的目录
 * @param {string} fileName - 文件名（不含路径）
 * @param {Function} AbstractClass - 抽象类，用于检查实例是否继承自它
 * @returns {Promise<T | null>} 如果默认导出继承自AbstractClass则返回该实例，否则返回null
 */
export async function saveAndLoadModule<T>(
  jsContent: string,
  modulesDir: string,
  fileName: string,
  AbstractClass: AbstractConstructor<T>,
): Promise<T | null> {
  // 1. 确保目录存在
  await fs.mkdir(modulesDir, { recursive: true })

  // 2. 构建完整的文件路径
  const filePath = path.join(modulesDir, fileName)

  // 3. 保存代码到文件
  await fs.writeFile(filePath, jsContent, 'utf8')

  try {
    // 4. 导入模块
    const absolutePath = path.resolve(filePath)
    const moduleURL = `file://${absolutePath}`

    // 添加时间戳以避免缓存问题
    const importUrl = `${moduleURL}?update=${Date.now()}`
    const module = await import(importUrl)

    // 5. 检查默认导出
    if (!('default' in module)) {
      return null // 没有默认导出
    }

    const instance = module.default

    // 6. 检查实例是否继承自抽象类
    if (instance instanceof AbstractClass) {
      return instance as T
    }

    return null
  } catch (error) {
    console.error(`导入模块 ${fileName} 时出错:`, error)
    return null
  }
}