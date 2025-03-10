import jwt from 'jsonwebtoken'
export class FrontEndAuthHandler {
  private token: string | null
  constructor() {
  }

  generateToken (timeout: number = 5 * 60, onetime: boolean = false): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const randomString = Math.random().toString(36).substring(2, 15)
    const token = `${timestamp}-${randomString}`
    if (!onetime) {
      this.token = token
      setTimeout(() => {
        this.token = null
      }, timeout * 1000)
    }
    return token
  }

  validateToken (token: string): boolean {
    if (token === this.token) {
      this.token = null
      return true
    }
    return false
  }

  static generateJWT (key: string) {
    return jwt.sign({ key }, key, { expiresIn: '24h' })
  }

  static validateJWT (key: string, token: string): boolean {
    try {
      jwt.verify(token, key)
      return true
    } catch (error) {
      return false
    }
  }
}