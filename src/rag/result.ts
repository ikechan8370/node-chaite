import { RAGResult } from '../types/common.js'

export class RAGAggregator {
  /**
   * 聚合多个RAG结果
   * @param results RAG结果数组
   * @param maxLength 聚合结果的最大长度
   * @returns 聚合后的文本
   */
  static aggregate(results: RAGResult[], maxLength: number = 1000): string {
    const sortedResults = results.sort((a, b) => b.score - a.score)

    let aggregatedContent = ''
    for (const result of sortedResults) {
      if (aggregatedContent.length + result.content.length <= maxLength) {
        aggregatedContent += (aggregatedContent ? ' ' : '') + result.content
      } else {
        break
      }
    }

    return aggregatedContent.trim()
  }

  /**
   * 过滤结果集
   * @param results RAG结果数组
   * @param minScore 最小分数阈值
   * @returns 过滤后的结果数组
   */
  static filterResults(results: RAGResult[], minScore: number): RAGResult[] {
    return results.filter(result => result.score >= minScore)
  }
}