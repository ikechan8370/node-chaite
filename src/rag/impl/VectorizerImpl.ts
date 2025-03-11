import { IClient, Vectorizer } from '../../types/index.js'

export class VectorizerImpl implements Vectorizer {
  constructor(private client: IClient, private model: string, private dimensions: number) {
  }

  async textToVector(text: string): Promise<number[]> {
    const embeddingResult = await this.client.getEmbedding(text, {
      model: this.model, dimensions: this.dimensions,
    })
    return embeddingResult.embeddings[0]
  }

  async batchTextToVector(texts: string[]): Promise<number[][]> {
    const embeddingResult = await this.client.getEmbedding(texts, {
      model: this.model, dimensions: this.dimensions,
    })
    return embeddingResult.embeddings
  }
}