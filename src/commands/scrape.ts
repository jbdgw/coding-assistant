import ora from 'ora';
import { Command } from 'commander';
import { Crawl4AIService } from '../lib/crawl4ai-service.js';
import { CodebaseIndexer } from '../lib/indexer.js';
import { Display } from '../utils/display.js';

export interface ScrapeCommandOptions {
  collection?: string;
  output?: string;
  maxPages?: number;
  depth?: number;
  singlePage?: boolean;
  autoIndex?: boolean;
}

export async function scrapeCommand(url: string, options: ScrapeCommandOptions): Promise<void> {
  Display.header('Documentation Scraper');

  // Validate URL
  try {
    new URL(url);
  } catch {
    Display.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  // Determine output directory
  const outputDir = options.output || './scraped-docs';
  const collection = options.collection || 'docs';

  Display.info(`URL: ${url}`);
  Display.info(`Output: ${outputDir}`);
  Display.info(`Collection: ${collection}`);
  if (options.singlePage) {
    Display.info(`Mode: Single page`);
  } else {
    Display.info(`Max pages: ${options.maxPages || 50}`);
    Display.info(`Depth: ${options.depth || 2}`);
  }
  Display.newline();

  // Check Crawl4AI installation
  const crawler = new Crawl4AIService();
  const installCheck = await crawler.checkInstallation();

  if (!installCheck.installed) {
    Display.error('Crawl4AI is not installed!');
    Display.newline();
    Display.info('To install Crawl4AI, run:');
    Display.info('  ./scripts/setup-crawl4ai.sh');
    Display.newline();
    Display.info('Or manually:');
    Display.info('  pip3 install --user --break-system-packages crawl4ai');
    process.exit(1);
  }

  // Scrape documentation
  const spinner = ora('Scraping documentation...').start();

  try {
    const result = await crawler.scrapeDocs(url, outputDir, {
      maxPages: options.maxPages,
      depth: options.depth,
      singlePage: options.singlePage,
    });

    spinner.stop();

    if (!result.success) {
      Display.error(`Scraping failed: ${result.error}`);
      process.exit(1);
    }

    Display.newline();
    Display.success(`Scraped ${result.pagesScraped} page(s) to ${result.outputDir}`);
    Display.newline();

    // Auto-index if requested
    if (options.autoIndex !== false) {
      Display.info('Auto-indexing scraped content...');
      Display.newline();

      const indexer = new CodebaseIndexer({
        collectionName: collection,
      });

      const indexSpinner = ora('Indexing...').start();

      try {
        const indexResult = await indexer.indexDirectory(result.outputDir, (progress) => {
          indexSpinner.text = `Indexing: ${progress.processedFiles}/${progress.totalFiles} files`;
        });

        indexSpinner.stop();

        if (indexResult.success) {
          Display.success(
            `Indexed ${indexResult.processedFiles} files into collection "${collection}"`,
          );
        } else {
          Display.warning(
            `Indexed ${indexResult.processedFiles} files, ${indexResult.failedFiles} failed`,
          );
        }
      } catch (error) {
        indexSpinner.stop();
        Display.error(`Indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    Display.newline();
    Display.section('Next Steps');
    console.log(`  Search: npm run dev -- search "query" --collection ${collection}`);
    console.log(`  Chat:   npm run dev -- chat`);
    Display.newline();
  } catch (error) {
    spinner.stop();
    Display.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Register the scrape command
 */
export function registerScrapeCommand(program: Command): void {
  program
    .command('scrape <url>')
    .description('Scrape documentation website and optionally index it')
    .option('-c, --collection <name>', 'Collection name for indexing', 'docs')
    .option('-o, --output <dir>', 'Output directory for scraped files', './scraped-docs')
    .option('--max-pages <number>', 'Maximum pages to scrape', (val) => parseInt(val), 50)
    .option('--depth <number>', 'Maximum crawl depth', (val) => parseInt(val), 2)
    .option('--single-page', 'Scrape only the single page (no crawling)', false)
    .option('--no-auto-index', 'Skip automatic indexing after scraping', false)
    .action(scrapeCommand);
}
