import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScrapeOptions {
  maxPages?: number;
  depth?: number;
  singlePage?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  pagesScraped: number;
  outputDir: string;
  error?: string;
}

/**
 * Service for calling Crawl4AI Python script to scrape documentation sites
 */
export class Crawl4AIService {
  private pythonScript: string;

  constructor() {
    // Path to Python script in project root
    this.pythonScript = path.join(__dirname, '../../scripts/crawl-docs.py');
  }

  /**
   * Check if Crawl4AI is installed
   */
  async checkInstallation(): Promise<{ installed: boolean; error?: string }> {
    return new Promise(resolve => {
      const python = spawn('python3', ['-c', 'import crawl4ai; print("OK")']);

      let output = '';
      python.stdout.on('data', data => {
        output += data.toString();
      });

      python.on('close', code => {
        if (code === 0 && output.includes('OK')) {
          resolve({ installed: true });
        } else {
          resolve({
            installed: false,
            error: 'Crawl4AI not installed. Run: pip3 install --user --break-system-packages crawl4ai',
          });
        }
      });
    });
  }

  /**
   * Scrape a documentation website
   */
  async scrapeDocs(url: string, outputDir: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    // Check installation first
    const installCheck = await this.checkInstallation();
    if (!installCheck.installed) {
      return {
        success: false,
        pagesScraped: 0,
        outputDir,
        error: installCheck.error,
      };
    }

    return new Promise(resolve => {
      const args = [this.pythonScript, url, outputDir];

      if (options.singlePage) {
        args.push('--single');
      }

      if (options.maxPages) {
        args.push('--max-pages', options.maxPages.toString());
      }

      if (options.depth) {
        args.push('--depth', options.depth.toString());
      }

      const python = spawn('python3', args);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', data => {
        const output = data.toString();
        stdout += output;
        // Stream output to console
        process.stdout.write(output);
      });

      python.stderr.on('data', data => {
        stderr += data.toString();
      });

      python.on('close', code => {
        if (code === 0) {
          // Parse pages scraped from output
          const match = stdout.match(/Scraped (\d+) pages/);
          const pagesScraped = match ? parseInt(match[1]) : 1;

          resolve({
            success: true,
            pagesScraped,
            outputDir,
          });
        } else {
          resolve({
            success: false,
            pagesScraped: 0,
            outputDir,
            error: stderr || 'Scraping failed',
          });
        }
      });

      python.on('error', err => {
        resolve({
          success: false,
          pagesScraped: 0,
          outputDir,
          error: err.message,
        });
      });
    });
  }
}
