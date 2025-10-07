import { Command } from 'commander';
import ora from 'ora';
import * as path from 'path';
import { CodebaseIndexer } from '../lib/indexer.js';
import { RAGDisplay } from '../utils/rag-display.js';
import { VectorStore } from '../lib/vector-store.js';

interface IndexOptions {
  collection?: string;
  fileTypes?: string;
  exclude?: string;
}

export async function indexCommand(directory: string, options: IndexOptions): Promise<void> {
  // Resolve directory path
  const dir = path.resolve(directory);

  // Parse options
  const collection = options.collection || path.basename(dir);
  const fileTypes = options.fileTypes?.split(',').map((ext) => (ext.startsWith('.') ? ext : `.${ext}`));
  const exclude = options.exclude?.split(',');

  console.log(RAGDisplay.info(`Indexing directory: ${dir}`));
  console.log(RAGDisplay.info(`Collection name: ${collection}`));

  // Create indexer
  const indexer = new CodebaseIndexer({
    collectionName: collection,
    fileTypes,
    exclude,
  });

  // Show spinner
  const spinner = ora('Scanning directory...').start();

  try {
    // Index directory
    const result = await indexer.indexDirectory(dir, (progress) => {
      spinner.text = RAGDisplay.indexingProgress(progress);
    });

    spinner.stop();

    // Display result
    console.log(RAGDisplay.indexingResult(result));

    // Show collection info
    if (result.processedFiles > 0) {
      const vectorStore = new VectorStore();
      const info = await vectorStore.getCollectionInfo(collection);
      console.log(RAGDisplay.collectionInfo(info));
    }
  } catch (error) {
    spinner.stop();
    console.error(RAGDisplay.error(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Subcommands for index management
export async function indexListCommand(): Promise<void> {
  try {
    const vectorStore = new VectorStore();
    const collections = await vectorStore.listCollections();
    console.log(RAGDisplay.collectionList(collections));
  } catch (error) {
    console.error(RAGDisplay.error(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function indexStatsCommand(collection: string): Promise<void> {
  try {
    const vectorStore = new VectorStore();
    const info = await vectorStore.getCollectionInfo(collection);
    console.log(RAGDisplay.collectionInfo(info));
  } catch (error) {
    console.error(RAGDisplay.error(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function indexDeleteCommand(collection: string): Promise<void> {
  try {
    const vectorStore = new VectorStore();

    // Confirm deletion
    const { default: inquirer } = await import('inquirer');
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete collection "${collection}"?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(RAGDisplay.info('Deletion cancelled.'));
      return;
    }

    await vectorStore.deleteCollection(collection);
    console.log(RAGDisplay.success(`Collection "${collection}" deleted.`));
  } catch (error) {
    console.error(RAGDisplay.error(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Register command with Commander
export function registerIndexCommand(program: Command): void {
  const indexCmd = program
    .command('index')
    .description('Index a codebase for RAG retrieval');

  indexCmd
    .command('create <directory>')
    .description('Index a directory')
    .option('-c, --collection <name>', 'Collection name (defaults to directory name)')
    .option('-f, --file-types <extensions>', 'Comma-separated file extensions to index (e.g., .py,.js,.ts)')
    .option('-e, --exclude <patterns>', 'Comma-separated exclude patterns (e.g., node_modules,.git)')
    .action(indexCommand);

  indexCmd
    .command('list')
    .description('List all collections')
    .action(indexListCommand);

  indexCmd
    .command('stats <collection>')
    .description('Show collection statistics')
    .action(indexStatsCommand);

  indexCmd
    .command('delete <collection>')
    .description('Delete a collection')
    .action(indexDeleteCommand);
}
