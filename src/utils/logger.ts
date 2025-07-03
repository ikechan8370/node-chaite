import { DefaultLogger, ILogger } from '../types'
import { asyncLocalStorage } from './index'

export function getLogger (): ILogger {
  const chaite = asyncLocalStorage.getStore()?.chaite
  return chaite?.getLogger() || DefaultLogger
}
