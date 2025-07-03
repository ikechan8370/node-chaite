import * as crypto from 'node:crypto'

export function getMd5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}