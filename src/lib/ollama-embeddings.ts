import { Ollama } from 'ollama';

export interface OllamaEmbeddingsConfig {
  baseUrl?: string;
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  dimension: number;
}

/**
 * Service for generating embeddings using Ollama
 */
export class OllamaEmbeddingsService {
  private client: Ollama;
  private model: string;
  private cachedDimension?: number;

  constructor(config: OllamaEmbeddingsConfig = {}) {
    this.client = new Ollama({
      host: config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    });
    this.model = config.model || 'dengcao/Qwen3-Embedding-0.6B:Q8_0';
  }

  /**
   * Generate a single embedding
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embed({
        model: this.model,
        input: text,
      });

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('No embeddings returned from Ollama');
      }

      // Cache the dimension from the first embedding
      if (!this.cachedDimension && response.embeddings[0]) {
        this.cachedDimension = response.embeddings[0].length;
      }

      return response.embeddings[0];
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async embedMany(texts: string[], batchSize = 50): Promise<EmbeddingResponse> {
    if (texts.length === 0) {
      return { embeddings: [], dimension: this.cachedDimension || 0 };
    }

    const allEmbeddings: number[][] = [];

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const response = await this.client.embed({
          model: this.model,
          input: batch,
        });

        if (!response.embeddings || response.embeddings.length === 0) {
          throw new Error(`No embeddings returned for batch starting at index ${i}`);
        }

        // Cache the dimension from the first embedding
        if (!this.cachedDimension && response.embeddings[0]) {
          this.cachedDimension = response.embeddings[0].length;
        }

        allEmbeddings.push(...response.embeddings);
      } catch (error) {
        throw new Error(
          `Failed to generate embeddings for batch ${i}-${i + batch.length}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      embeddings: allEmbeddings,
      dimension: this.cachedDimension || (allEmbeddings[0]?.length ?? 0),
    };
  }

  /**
   * Get the embedding dimension for this model
   */
  async getDimension(): Promise<number> {
    if (this.cachedDimension) {
      return this.cachedDimension;
    }

    // Generate a test embedding to determine dimension
    const testEmbedding = await this.embed('test');
    return testEmbedding.length;
  }

  /**
   * Check if Ollama server is available and model is loaded
   */
  async checkConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      // Try to list models to check connection
      await this.client.list();

      // Try to generate a test embedding to check if model is available
      await this.embed('connection test');

      return { available: true };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the current model name
   */
  getModel(): string {
    return this.model;
  }
}
