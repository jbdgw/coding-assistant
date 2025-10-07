import { ChromaVector } from '@mastra/chroma';

export interface VectorStoreConfig {
  host?: string;
  port?: number;
}

export interface DocumentMetadata extends Record<string, any> {
  text: string;
  filePath: string;
  fileType: string;
  language?: string;
  startLine?: number;
  endLine?: number;
  lastModified: string;
  collection: string;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata: DocumentMetadata;
}

export interface CollectionInfo {
  name: string;
  count: number;
  dimension: number;
}

/**
 * Wrapper for ChromaDB vector store operations
 */
export class VectorStore {
  private store: ChromaVector;

  constructor(config: VectorStoreConfig = {}) {
    const host = config.host || process.env.CHROMA_HOST || 'localhost';
    const port = config.port || parseInt(process.env.CHROMA_PORT || '8000');

    this.store = new ChromaVector({
      host,
      port,
      // For local ChromaDB, we don't need SSL
      ssl: false,
    });
  }

  /**
   * Create a new collection (index)
   */
  async createCollection(name: string, dimension: number): Promise<void> {
    try {
      await this.store.createIndex({
        indexName: name,
        dimension,
        metric: 'cosine',
      });
    } catch (error) {
      throw new Error(
        `Failed to create collection ${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Upsert vectors with metadata
   */
  async upsert(
    collectionName: string,
    vectors: number[][],
    metadata: DocumentMetadata[],
    ids?: string[],
  ): Promise<void> {
    if (vectors.length === 0) {
      return;
    }

    if (vectors.length !== metadata.length) {
      throw new Error('Vectors and metadata arrays must have the same length');
    }

    try {
      await this.store.upsert({
        indexName: collectionName,
        vectors,
        metadata: metadata as Record<string, any>[],
        ids,
      });
    } catch (error) {
      throw new Error(
        `Failed to upsert vectors: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Query the vector store
   */
  async query(
    collectionName: string,
    queryVector: number[],
    options: {
      topK?: number;
      filter?: Record<string, any>;
      includeVectors?: boolean;
    } = {},
  ): Promise<QueryResult[]> {
    try {
      const results = await this.store.query<DocumentMetadata>({
        indexName: collectionName,
        queryVector,
        topK: options.topK || 10,
        filter: options.filter,
        includeVector: options.includeVectors || false,
      });

      return results.map((result) => ({
        id: result.id,
        score: result.score,
        metadata: result.metadata as DocumentMetadata,
      }));
    } catch (error) {
      throw new Error(
        `Failed to query vectors: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    try {
      const collections = await this.store.listIndexes();
      return collections;
    } catch (error) {
      throw new Error(
        `Failed to list collections: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(name: string): Promise<CollectionInfo> {
    try {
      const info = await this.store.describeIndex({ indexName: name });
      return {
        name,
        count: info.count,
        dimension: info.dimension,
      };
    } catch (error) {
      throw new Error(
        `Failed to get collection info: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name: string): Promise<void> {
    try {
      await this.store.deleteIndex({ indexName: name });
    } catch (error) {
      throw new Error(
        `Failed to delete collection ${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check if ChromaDB is accessible
   */
  async checkConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      // Try to list collections to check connection
      await this.store.listIndexes();
      return { available: true };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the underlying ChromaVector instance
   */
  getStore(): ChromaVector {
    return this.store;
  }
}
