import EventEmitter from 'node:events'

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 48370

export class GlobalConfig extends EventEmitter {
  /**
   * jwt密钥
   */
  private authKey: string
  /**
   * 监听地址
   */
  private host: string
  /**
   * 监听端口
   */
  private port: number
  /**
   * 是否开启调试模式
   */
  private debug: boolean
  /**
   * 登录有效期，单位秒
   */
  private loginValidTime: number

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

  setDebug (debug: boolean) {
    if (debug === this.debug) {
      return
    }
    this.emit('change', {
      key: 'debug',
      newVal: debug,
      oldVal: this.debug,
    })
    this.debug = debug
  }

  setLoginValidTime (time: number) {
    if (time === this.loginValidTime) {
      return
    }
    this.emit('change', {
      key: 'loginValidTime',
      newVal: time,
      oldVal: this.loginValidTime,
    })
    this.loginValidTime = time
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

  getDebug () {
    return this.debug
  }

  getLoginValidTime () {
    return this.loginValidTime || 24 * 60 *60
  }
}