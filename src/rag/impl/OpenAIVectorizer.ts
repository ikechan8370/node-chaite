import { Vectorizer } from '../../types/common'
import { OpenAIClient } from '../../adapters'

export class OpenAIVectorizer implements Vectorizer {
  constructor(private client: OpenAIClient, private model: string, private dimensions: number) {
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