export class TextProcessor {
  private static readonly punctuationRegex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~，。！？；：（）、]/g
  private static readonly stopWords = new Set([
    // 英文停用词
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
    // 中文停用词
    '的', '了', '和', '是', '就', '都', '而', '及', '与', '着', '或', '一个', '没有', '我们', '你们', '他们', '很',
    '但是', '然而', '不过', '因为', '所以', '如果', '虽然', '尽管',
  ])

  /**
   * 将文本分割成小段落
   * @param text 输入的长文本
   * @param maxLength 每个段落的最大长度
   * @returns 分割后的段落数组
   */
  static splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = []
    let currentChunk = ''

    const sentences = text.split(/[.。!！?？]+/)

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence.trim()
      } else {
        if (currentChunk) {
          chunks.push(currentChunk)
        }
        currentChunk = sentence.trim()
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    return chunks
  }

  /**
   * 清理和标准化文本
   * @param text 输入文本
   * @returns 清理后的文本
   */
  static cleanText(text: string): string {
    return text
      .replace(this.punctuationRegex, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 简单的分词（按空格分割英文，按字符分割中文）
   * @param text 输入文本
   * @returns 分词后的数组
   */
  static tokenize(text: string): string[] {
    const words: string[] = []
    let currentWord = ''

    for (const char of text) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字符
        if (currentWord) {
          words.push(currentWord)
          currentWord = ''
        }
        words.push(char)
      } else if (/\s/.test(char)) {
        // 空白字符
        if (currentWord) {
          words.push(currentWord)
          currentWord = ''
        }
      } else {
        // 其他字符（主要是英文）
        currentWord += char
      }
    }

    if (currentWord) {
      words.push(currentWord)
    }

    return words
  }

  /**
   * 从文本中移除停用词
   * @param text 输入文本
   * @returns 移除停用词后的文本
   */
  static removeStopWords(text: string): string {
    return this.tokenize(text)
      .filter(word => !this.stopWords.has(word.toLowerCase()))
      .join(' ')
  }

  /**
   * 提取文本中的关键词（基于简单频率）
   * @param text 输入文本
   * @param topN 返回的关键词数量
   * @returns 关键词数组
   */
  static extractKeywords(text: string, topN: number = 5): string[] {
    const words = this.tokenize(this.removeStopWords(this.cleanText(text)))
    const wordFrequency: {[key: string]: number} = {}

    for (const word of words) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1
    }

    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(entry => entry[0])
  }

  /**
   * 计算两个文本之间的简单相似度
   * @param text1 第一个文本
   * @param text2 第二个文本
   * @returns 相似度分数（0-1之间）
   */
  static simpleSimilarity(text1: string, text2: string): number {
    const set1 = new Set(this.tokenize(this.removeStopWords(this.cleanText(text1))))
    const set2 = new Set(this.tokenize(this.removeStopWords(this.cleanText(text2))))

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }
}