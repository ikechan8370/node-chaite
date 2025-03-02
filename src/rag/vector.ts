/**
 * generated by claude-3-5-sonnet
 */
export interface VectorDatabase {
  /**
   * 添加单个向量到数据库
   * @param vector - 要添加的向量，表示为数字数组
   * @param text - 与向量关联的文本
   * @returns 返回添加的向量的唯一标识符
   */
  addVector(vector: number[], text: string): Promise<string>;

  /**
   * 批量添加多个向量到数据库
   * @param vectors - 要添加的向量数组，每个向量表示为数字数组
   * @param texts - 与向量关联的文本数组，顺序应与向量数组对应
   * @returns 返回添加的向量的唯一标识符数组
   */
  addVectors(vectors: number[][], texts: string[]): Promise<string[]>;

  /**
   * 搜索与给定查询向量最相似的向量
   * @param queryVector - 查询向量，表示为数字数组
   * @param k - 要返回的最相似向量的数量
   * @returns 返回最相似向量的数组，每个元素包含id、相似度分数和关联文本
   */
  search(queryVector: number[], k: number): Promise<Array<{ id: string, score: number, text: string }>>;

  /**
   * 根据ID获取特定的向量
   * @param id - 向量的唯一标识符
   * @returns 返回包含向量和关联文本的对象，如果未找到则返回null
   */
  getVector(id: string): Promise<{ vector: number[], text: string } | null>;

  /**
   * 从数据库中删除指定ID的向量
   * @param id - 要删除的向量的唯一标识符
   * @returns 返回一个布尔值，表示删除操作是否成功
   */
  deleteVector(id: string): Promise<boolean>;

  /**
   * 更新数据库中指定ID的向量
   * @param id - 要更新的向量的唯一标识符
   * @param newVector - 新的向量，表示为数字数组
   * @param newText - 新的关联文本
   * @returns 返回一个布尔值，表示更新操作是否成功
   */
  updateVector(id: string, newVector: number[], newText: string): Promise<boolean>;

  /**
   * 获取数据库中向量的总数
   * @returns 返回数据库中存储的向量总数
   */
  count(): Promise<number>;

  /**
   * 清空数据库中的所有向量
   * @returns 无返回值
   */
  clear(): Promise<void>;
}