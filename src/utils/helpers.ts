import { ChaiteContext, ILogger, MultipleKeyStrategy, MultipleKeyStrategyChoice } from '../types/common'
import { AsyncLocalStorage } from 'async_hooks'

export async function getKey(apiKeys: string[] | string, strategy: MultipleKeyStrategy): Promise<string> {
  const logger = asyncLocalStorage.getStore()?.logger as ILogger
  const candidateApiKeys = Array.isArray(apiKeys) ? apiKeys : [ apiKeys ]
  const keyNum = apiKeys.length
  if (keyNum === 0) {
    logger.error(`No key ${keyNum} found.`)
    throw new Error('No key provided')
  }
  let apiKey: string
  switch (strategy) {
  case MultipleKeyStrategyChoice.RANDOM: {
    const randomKeyIdx = Math.floor(Math.random() * keyNum + 1)
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