import * as fs from 'fs/promises';
import * as path from 'path';
import { MDocument } from '@mastra/rag';
import { OllamaEmbeddingsService } from './ollama-embeddings.js';
import { VectorStore, DocumentMetadata } from './vector-store.js';

export interface IndexerConfig {
  collectionName: string;
  fileTypes?: string[];
  exclude?: string[];
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
}

export interface IndexingProgress {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  currentFile: string;
}

export interface IndexingResult {
  success: boolean;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * Service for indexing codebases into vector store
 */
export class CodebaseIndexer {
  private embeddings: OllamaEmbeddingsService;
  private vectorStore: VectorStore;
  private config: Required<IndexerConfig>;

  // Default supported file extensions (text-based files only)
  private static readonly DEFAULT_FILE_TYPES = [
    '.py', '.js', '.ts', '.tsx', '.jsx', '.md', '.txt', '.json',
    '.go', '.rs', '.java', '.cpp', '.c', '.h', '.hpp',
    '.html', '.css', '.scss', '.sass', '.less',
    '.xml', '.yml', '.yaml', '.toml', '.ini', '.env',
    '.sh', '.bash', '.zsh', '.fish',
    '.rb', '.php', '.swift', '.kt', '.scala',
    '.sql', '.graphql', '.proto',
  ];

  constructor(
    config: IndexerConfig,
    embeddings?: OllamaEmbeddingsService,
    vectorStore?: VectorStore,
  ) {
    this.config = {
      collectionName: config.collectionName,
      fileTypes:
        config.fileTypes || CodebaseIndexer.DEFAULT_FILE_TYPES,
      exclude: config.exclude || ['node_modules', '.git', 'dist', 'build', '.next'],
      chunkSize: config.chunkSize || 512,
      chunkOverlap: config.chunkOverlap || 50,
      batchSize: config.batchSize || 50,
    };

    this.embeddings = embeddings || new OllamaEmbeddingsService();
    this.vectorStore = vectorStore || new VectorStore();
  }

  /**
   * Index a directory recursively
   */
  async indexDirectory(
    directory: string,
    progressCallback?: (progress: IndexingProgress) => void,
  ): Promise<IndexingResult> {
    // Ensure collection exists
    const dimension = await this.embeddings.getDimension();
    try {
      await this.vectorStore.createCollection(this.config.collectionName, dimension);
    } catch (error) {
      // Collection might already exist, that's okay
    }

    // Scan directory for files
    const files = await this.scanDirectory(directory);

    const result: IndexingResult = {
      success: true,
      totalFiles: files.length,
      processedFiles: 0,
      failedFiles: 0,
      errors: [],
    };

    // Process files
    for (const file of files) {
      try {
        // Update progress
        if (progressCallback) {
          progressCallback({
            totalFiles: files.length,
            processedFiles: result.processedFiles,
            failedFiles: result.failedFiles,
            currentFile: path.relative(directory, file),
          });
        }

        // Process file
        await this.indexFile(file, directory);
        result.processedFiles++;
      } catch (error) {
        result.failedFiles++;
        result.errors.push({
          file: path.relative(directory, file),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    result.success = result.failedFiles === 0;
    return result;
  }

  /**
   * Index a single file
   */
  private async indexFile(filePath: string, baseDirectory: string): Promise<void> {
    // Get file stats
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(baseDirectory, filePath);

    // Read file (only text-based files are supported)
    const ext = path.extname(filePath).toLowerCase();

    // Verify file type is supported
    if (!CodebaseIndexer.DEFAULT_FILE_TYPES.includes(ext)) {
      // Skip non-text files (PDFs, images, etc.)
      return;
    }

    // Read text file
    let text: string;
    try {
      text = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!text || text.trim().length === 0) {
      return; // Skip empty files
    }

    // Create document and chunk
    const doc = MDocument.fromText(text);
    const chunksResult = await doc.chunk({
      strategy: 'recursive',
      maxSize: this.config.chunkSize,
      overlap: this.config.chunkOverlap,
    });

    // Convert chunks to array if needed
    const chunksArray = Array.isArray(chunksResult)
      ? chunksResult
      : (chunksResult as any).getDocs ? (chunksResult as any).getDocs() : [];

    if (chunksArray.length === 0) {
      return; // No chunks to index
    }

    // Extract text from chunks
    const chunkTexts = chunksArray.map((chunk: any) => chunk.text || chunk.pageContent || '');

    const { embeddings } = await this.embeddings.embedMany(
      chunkTexts,
      this.config.batchSize,
    );

    // Prepare metadata
    const metadata: DocumentMetadata[] = chunkTexts.map((chunkText: string, i: number) => ({
      text: chunkText,
      filePath: relativePath,
      fileType: ext.slice(1),
      language: this.getLanguage(ext),
      startLine: undefined, // Could calculate from chunk if needed
      endLine: undefined,
      lastModified: stats.mtime.toISOString(),
      collection: this.config.collectionName,
    }));

    // Generate IDs
    const ids = chunkTexts.map((_: string, i: number) => `${relativePath}_chunk_${i}`);

    // Upsert to vector store
    await this.vectorStore.upsert(
      this.config.collectionName,
      embeddings,
      metadata,
      ids,
    );
  }

  /**
   * Scan directory for supported files
   */
  private async scanDirectory(directory: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string, exclude: string[]): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Check if excluded
        if (exclude.some((pattern) => fullPath.includes(pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          await scan(fullPath, exclude);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    }

    await scan(directory, this.config.exclude);

    // Filter by supported file types
    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return this.config.fileTypes.includes(ext);
    });
  }

  /**
   * Get programming language from file extension
   */
  private getLanguage(ext: string): string {
    const languageMap: Record<string, string> = {
      '.py': 'python',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.md': 'markdown',
      '.json': 'json',
      '.txt': 'text',
      '.html': 'html',
      '.css': 'css',
      '.yml': 'yaml',
      '.yaml': 'yaml',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<IndexerConfig> {
    return { ...this.config };
  }
}
