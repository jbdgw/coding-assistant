import { Command } from 'commander';
import ora from 'ora';
import { CodebaseRetrieval } from '../lib/retrieval.js';
import { RAGDisplay } from '../utils/rag-display.js';

interface SearchOptions {
  collection?: string;
  topK?: string;
  filter?: string;
  minScore?: string;
}

export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  const collection = options.collection || 'default';
  const topK = options.topK ? parseInt(options.topK) : 10;
  const minScore = options.minScore ? parseFloat(options.minScore) : 0.0;

  // Parse filter if provided
  let filter: Record<string, unknown> | undefined;
  if (options.filter) {
    try {
      filter = JSON.parse(options.filter) as Record<string, unknown>;
    } catch {
      console.error(RAGDisplay.error('Invalid filter JSON'));
      process.exit(1);
    }
  }

  console.log(RAGDisplay.info(`Searching collection: ${collection}`));
  console.log(RAGDisplay.info(`Query: ${query}\n`));

  const spinner = ora('Searching...').start();

  try {
    // Check if collection exists
    const retrieval = new CodebaseRetrieval({ collectionName: collection });
    const exists = await retrieval.collectionExists();

    if (!exists) {
      spinner.stop();
      console.error(
        RAGDisplay.error(
          `Collection "${collection}" does not exist. Create it first with: my-cli index create <directory>`,
        ),
      );
      process.exit(1);
    }

    // Perform search
    const results = await retrieval.retrieve(query, { topK, filter, minScore });

    spinner.stop();

    // Display results
    console.log(RAGDisplay.searchResults(results));
  } catch (error) {
    spinner.stop();
    console.error(RAGDisplay.error(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Register command with Commander
export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search indexed codebases')
    .option('-c, --collection <name>', 'Collection to search (default: "default")')
    .option('-k, --top-k <number>', 'Number of results to return', '10')
    .option('-f, --filter <json>', 'Metadata filter as JSON')
    .option('-m, --min-score <number>', 'Minimum similarity score (0-1)', '0.0')
    .action(searchCommand);
}
