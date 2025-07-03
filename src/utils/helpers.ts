import {
  ChaiteContext, DefaultLogger,
  ILogger,
  MultipleKeyStrategy,
  MultipleKeyStrategyChoice,
} from '../types'
import { AsyncLocalStorage } from 'async_hooks'
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
export async function useEvent() {
  return asyncLocalStorage.getStore()?.getEvent()
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

/**
 * 解析 JavaScript 代码中的 class 变量 name 的值
 * @param {string} code - 输入的 JavaScript 代码
 * @returns {string|null} - 解析出的 class 的 name 值，或者 null 如果没有找到
 */
export function extractClassName(code: string) {
  // 定义正则匹配 class 继承和 name 属性赋值的模式
  const classRegex = /class\s+\w+\s+extends\s+\w+\s+{[\s\S]*?name\s*=\s*['"]([^'"]+)['"]/

  // 使用正则匹配整个代码字符串
  const match = classRegex.exec(code)

  // 如果匹配成功，返回变量 name 的值，否则返回 null
  return match ? match[1] : null
}
