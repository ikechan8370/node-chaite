import { DefaultLogger, ILogger } from '../types/common'
import { asyncLocalStorage } from './helpers'

export function getLogger (): ILogger {
  const chaite = asyncLocalStorage.getStore()?.chaite
  return chaite?.getLogger() || DefaultLogger
}
