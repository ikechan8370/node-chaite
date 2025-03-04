import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'

// 定义API错误的接口
export interface ApiError {
  status?: number;
  data?: unknown;
  message: string;
  request?: unknown;
  originalError?: Error | AxiosError;
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  authorizationPrefix?: string;
  getToken?: () => string | Promise<string> | null | undefined;
  onRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onResponse?: <T>(response: T) => T;
  onError?: (error: ApiError) => ApiError;
}

/**
 * 创建HTTP客户端
 */
export class HttpClient {
  private instance: AxiosInstance
  private options: HttpClientOptions

  /**
   * 构造HTTP客户端
   * @param options 配置选项
   */
  constructor(options: HttpClientOptions = {}) {
    this.options = {
      baseURL: '',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      authorizationPrefix: 'Bearer',
      ...options,
    }

    this.instance = this.createAxiosInstance()
    this.setupInterceptors()
  }

  /**
   * 创建Axios实例
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      headers: this.options.headers,
    })
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 自定义请求处理
        if (this.options.onRequest) {
          config = this.options.onRequest(config)
        }

        // 添加认证 token（如果提供了获取 token 的方法）
        if (this.options.getToken && config.headers) {
          const token = await this.options.getToken()
          if (token) {
            config.headers.Authorization = `${this.options.authorizationPrefix} ${token}`
          }
        }

        return config
      },
      (error: unknown) => {
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 使用自定义的响应处理器（如果有）
        if (this.options.onResponse) {
          return this.options.onResponse(response.data)
        }
        return response.data
      },
      (error: unknown) => {
        const apiError = this.normalizeError(error)

        // 使用自定义的错误处理器（如果有）
        if (this.options.onError) {
          return Promise.reject(this.options.onError(apiError))
        }

        return Promise.reject(apiError)
      },
    )
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 服务器响应了，但状态码超出 2xx 范围
        return {
          status: error.response.status,
          data: error.response.data,
          message: `Request failed with status code ${error.response.status}`,
          originalError: error,
        }
      } else if (error.request) {
        // 请求已经发出，但没有收到响应
        return {
          request: error.request,
          message: 'No response received from server',
          originalError: error,
        }
      }
    }

    // 其他类型的错误
    if (error instanceof Error) {
      return {
        message: error.message,
        originalError: error,
      }
    }

    // 未知错误
    return {
      message: 'Unknown error occurred',
      originalError: error instanceof Error ? error : new Error(String(error)),
    }
  }

  /**
   * 更新配置
   * @param options 新配置
   */
  public updateOptions(options: Partial<HttpClientOptions>): void {
    this.options = { ...this.options, ...options }
    this.instance = this.createAxiosInstance()
    this.setupInterceptors()
  }

  /**
   * 获取底层 Axios 实例
   */
  public getAxiosInstance(): AxiosInstance {
    return this.instance
  }

  /**
   * HTTP GET 请求
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T, AxiosResponse<T>>(url, config)
  }

  /**
   * HTTP POST 请求
   */
  public async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T, AxiosResponse<T>, D>(url, data, config)
  }

  /**
   * HTTP PUT 请求
   */
  public async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T, AxiosResponse<T>, D>(url, data, config)
  }

  /**
   * HTTP DELETE 请求
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T, AxiosResponse<T>>(url, config)
  }

  /**
   * HTTP PATCH 请求
   */
  public async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T, AxiosResponse<T>, D>(url, data, config)
  }
}

/**
 * 创建默认的HTTP客户端
 */
export const createHttpClient = (options?: HttpClientOptions): HttpClient => {
  return new HttpClient(options)
}

export default createHttpClient