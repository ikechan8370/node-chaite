/**
 * 基本存储接口
 */
export interface BasicStorage<T> {
  getItem(key: string): Promise<T | null>;
  setItem(key: string, value: T): Promise<string>;
  removeItem(key: string): Promise<void>;
  listItems(): Promise<T[]>;
  clear(): Promise<void>;
}