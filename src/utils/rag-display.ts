import chalk from 'chalk';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import hljs from 'highlight.js';
import { RetrievalResult } from '../lib/retrieval.js';
import { IndexingProgress, IndexingResult } from '../lib/indexer.js';
import { CollectionInfo } from '../lib/vector-store.js';

// Configure marked for terminal output
marked.setOptions({
  renderer: new TerminalRenderer() as any,
});

/**
 * Display utilities for RAG-related output
 */
export class RAGDisplay {
  /**
   * Display search results
   */
  static searchResults(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return chalk.yellow('No results found.');
    }

    let output = chalk.bold.cyan(`\nFound ${results.length} relevant code snippets:\n`);

    for (const result of results) {
      const { filePath, language } = result.metadata;
      const score = (result.score * 100).toFixed(1);

      output += chalk.dim('\n─────────────────────────────────────────\n');
      output += chalk.bold(`📄 ${filePath}`);
      output += chalk.dim(` | ${language || 'unknown'} | similarity: ${score}%\n\n`);

      // Syntax highlight the code
      const highlighted = this.highlightCode(result.metadata.text, language || 'text');
      output += highlighted + '\n';
    }

    return output;
  }

  /**
   * Display indexing progress
   */
  static indexingProgress(progress: IndexingProgress): string {
    const percentage = Math.round((progress.processedFiles / progress.totalFiles) * 100);
    return `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (${percentage}%) - ${chalk.dim(progress.currentFile)}`;
  }

  /**
   * Display indexing result
   */
  static indexingResult(result: IndexingResult): string {
    let output = '\n';

    if (result.success) {
      output += chalk.green.bold('✓ Indexing completed successfully!\n\n');
    } else {
      output += chalk.yellow.bold('⚠ Indexing completed with errors\n\n');
    }

    output += chalk.bold('Statistics:\n');
    output += `  Total files:     ${result.totalFiles}\n`;
    output += chalk.green(`  Processed:       ${result.processedFiles}\n`);

    if (result.failedFiles > 0) {
      output += chalk.red(`  Failed:          ${result.failedFiles}\n`);

      if (result.errors.length > 0) {
        output += chalk.bold('\nErrors:\n');
        for (const error of result.errors.slice(0, 10)) {
          output += chalk.red(`  • ${error.file}: ${error.error}\n`);
        }
        if (result.errors.length > 10) {
          output += chalk.dim(`  ... and ${result.errors.length - 10} more\n`);
        }
      }
    }

    return output;
  }

  /**
   * Display collection info
   */
  static collectionInfo(info: CollectionInfo): string {
    let output = '\n' + chalk.bold.cyan(`Collection: ${info.name}\n`);
    output += chalk.dim('─────────────────────────────────────────\n');
    output += `Vector count:  ${info.count.toLocaleString()}\n`;
    output += `Dimensions:    ${info.dimension}\n`;
    return output;
  }

  /**
   * Display list of collections
   */
  static collectionList(collections: string[]): string {
    if (collections.length === 0) {
      return chalk.yellow('No collections found.');
    }

    let output = chalk.bold.cyan('\nAvailable collections:\n');
    for (const collection of collections) {
      output += chalk.green(`  • ${collection}\n`);
    }
    return output;
  }

  /**
   * Display RAG sources in chat
   */
  static chatSources(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return '';
    }

    let output = chalk.dim.italic('\n📚 Referenced sources:\n');
    for (const result of results) {
      output += chalk.dim(`   • ${result.formattedSource}\n`);
    }
    output += '\n';
    return output;
  }

  /**
   * Highlight code with syntax highlighting
   */
  private static highlightCode(code: string, language: string): string {
    try {
      if (hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value;
      }
    } catch {
      // Fall back to no highlighting
    }
    return code;
  }

  /**
   * Display connection status
   */
  static connectionStatus(
    ollama: boolean,
    chromadb: boolean,
    unstructured: boolean,
  ): string {
    let output = chalk.bold('\nRAG Service Status:\n');
    output += chalk.dim('─────────────────────────────────────────\n');

    const status = (available: boolean) =>
      available ? chalk.green('✓ Connected') : chalk.red('✗ Not available');

    output += `Ollama:        ${status(ollama)}\n`;
    output += `ChromaDB:      ${status(chromadb)}\n`;
    output += `Unstructured:  ${status(unstructured)}\n`;

    return output;
  }

  /**
   * Display error
   */
  static error(message: string): string {
    return chalk.red.bold('Error: ') + chalk.red(message);
  }

  /**
   * Display success message
   */
  static success(message: string): string {
    return chalk.green('✓ ') + message;
  }

  /**
   * Display info message
   */
  static info(message: string): string {
    return chalk.blue('ℹ ') + message;
  }

  /**
   * Display warning message
   */
  static warning(message: string): string {
    return chalk.yellow('⚠ ') + message;
  }
}
