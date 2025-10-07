import { OllamaEmbeddingsService } from './ollama-embeddings.js';
import { VectorStore, QueryResult } from './vector-store.js';

export interface RetrievalConfig {
  collectionName: string;
  topK?: number;
  minScore?: number;
}

export interface RetrievalResult extends QueryResult {
  formattedSource: string;
}

/**
 * Service for retrieving relevant code snippets from indexed codebases
 */
export class CodebaseRetrieval {
  private embeddings: OllamaEmbeddingsService;
  private vectorStore: VectorStore;
  private config: Required<RetrievalConfig>;

  constructor(
    config: RetrievalConfig,
    embeddings?: OllamaEmbeddingsService,
    vectorStore?: VectorStore,
  ) {
    this.config = {
      collectionName: config.collectionName,
      topK: config.topK || 10,
      minScore: config.minScore || 0.0,
    };

    this.embeddings = embeddings || new OllamaEmbeddingsService();
    this.vectorStore = vectorStore || new VectorStore();
  }

  /**
   * Retrieve relevant code snippets for a query
   */
  async retrieve(
    query: string,
    options: {
      topK?: number;
      filter?: Record<string, any>;
      minScore?: number;
    } = {},
  ): Promise<RetrievalResult[]> {
    // Generate embedding for query
    const queryVector = await this.embeddings.embed(query);

    // Query vector store
    const results = await this.vectorStore.query(this.config.collectionName, queryVector, {
      topK: options.topK || this.config.topK,
      filter: options.filter,
    });

    // Filter by minimum score
    const minScore = options.minScore ?? this.config.minScore;
    const filtered = results.filter((result) => result.score >= minScore);

    // Format results
    return filtered.map((result) => ({
      ...result,
      formattedSource: this.formatSource(result),
    }));
  }

  /**
   * Retrieve code snippets and format as context for LLM
   */
  async retrieveAsContext(
    query: string,
    options: {
      topK?: number;
      filter?: Record<string, any>;
      minScore?: number;
    } = {},
  ): Promise<string> {
    const results = await this.retrieve(query, options);

    if (results.length === 0) {
      return 'No relevant code snippets found in indexed projects.';
    }

    let context = 'Relevant code snippets from indexed projects:\n\n';

    for (const result of results) {
      context += `### ${result.metadata.filePath} (${result.metadata.language}, score: ${result.score.toFixed(3)})\n`;
      context += '```' + (result.metadata.language || '') + '\n';
      context += result.metadata.text + '\n';
      context += '```\n\n';
    }

    return context;
  }

  /**
   * Format a result into a human-readable source reference
   */
  private formatSource(result: QueryResult): string {
    const { filePath, language, startLine, endLine } = result.metadata;

    let formatted = `${filePath}`;

    if (language) {
      formatted += ` (${language})`;
    }

    if (startLine !== undefined && endLine !== undefined) {
      formatted += `:${startLine}-${endLine}`;
    }

    return formatted;
  }

  /**
   * Get statistics about a collection
   */
  async getCollectionStats(): Promise<{
    name: string;
    count: number;
    dimension: number;
  }> {
    return await this.vectorStore.getCollectionInfo(this.config.collectionName);
  }

  /**
   * Check if collection exists
   */
  async collectionExists(): Promise<boolean> {
    try {
      const collections = await this.vectorStore.listCollections();
      return collections.includes(this.config.collectionName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<RetrievalConfig> {
    return { ...this.config };
  }
}
