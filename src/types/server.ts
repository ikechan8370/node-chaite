export class ChaiteResponse<T> {
  constructor(private code: number, private data: T, private message: string) {
  }

  static ok<T>(data: T) {
    return new ChaiteResponse<T>(0, data, 'ok')
  }

  static okm<T>(data: T, msg: string) {
    return new ChaiteResponse<T>(0, data, msg)
  }

  static fail<T>(data: T, msg: string) {
    return new ChaiteResponse<T>(-1, data, msg)
  }

  static failc<T>(data: T, msg: string, code: number) {
    return new ChaiteResponse<T>(code, data, msg)
  }

}