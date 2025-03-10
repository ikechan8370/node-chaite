import EventEmitter from 'node:events'

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 48370

export class GlobalConfig extends EventEmitter {
  private authKey: string
  private host: string
  private port: number

  setAuthKey (key: string) {
    if (key === this.authKey) {
      return
    }
    this.emit('change', {
      key: 'authKey',
      newVal: key,
      oldVal: this.authKey,
    })
    this.authKey = key
  }

  setHost (host: string) {
    if (host === this.host) {
      return
    }
    this.emit('change', {
      key: 'host',
      newVal: host,
      oldVal: this.host,
    })
    this.host = host
  }

  setPort (port: number) {
    if (port === this.port) {
      return
    }
    this.emit('change', {
      key: 'port',
      newVal: port,
      oldVal: this.port,
    })
    this.port = port
  }

  getAuthKey () {
    return this.authKey
  }

  getHost () {
    return this.host || DEFAULT_HOST
  }

  getPort () {
    return this.port || DEFAULT_PORT
  }
}