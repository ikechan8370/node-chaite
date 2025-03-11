import { VectorDatabase } from './vector.js'
import { RAGResult, Vectorizer } from '../types/index.js'
import { TextProcessor } from './text.js'
import { RAGAggregator } from './result.js'

export class RAGManager {

  constructor(private vectorDb: VectorDatabase, private vectorizer: Vectorizer) {
  }

  /**
   * 添加文档到 RAG 系统
   * @param document 文档文本
   * @param maxNum 最大分割数
   */
  async addDocument(document: string, maxNum: number = 100): Promise<void> {
    const chunks = TextProcessor.splitIntoChunks(document, maxNum)
    const vectors = await this.vectorizer.batchTextToVector(chunks)
    await this.vectorDb.addVectors(vectors, chunks)
  }

  /**
   * 执行 RAG 查询
   * @param query 查询文本
   * @param k 返回结果数量
   * @returns 查询结果
   */
  async query(query: string, k: number): Promise<RAGResult[]> {
    const queryVector = await this.vectorizer.textToVector(query)
    const results = await this.vectorDb.search(queryVector, k)
    return results.map(r => ({ content: r.text, score: r.score }))
  }

  /**
   * 聚合检索出来的结果
   * @param results 文本形式
   * @param filterScore 过滤的最低分数
   */
  getAggregatedResults(results: RAGResult[], filterScore?: number): string {
    if (filterScore) {
      results = RAGAggregator.filterResults(results, filterScore)
    }
    return RAGAggregator.aggregate(results)
  }
}