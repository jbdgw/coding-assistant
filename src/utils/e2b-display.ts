import chalk from 'chalk';
import { ExecutionResult } from '../lib/e2b-sandbox-manager.js';

/**
 * E2B Display Utilities
 * Helper functions for displaying E2B sandbox execution results
 */
export class E2BDisplay {
  /**
   * Display execution results
   */
  static executionResult(result: ExecutionResult): void {
    console.log();
    console.log(chalk.bold.cyan('━━━ Execution Results ━━━'));
    console.log();

    // Display stdout if present
    if (result.stdout) {
      console.log(chalk.bold.green('Output:'));
      console.log(result.stdout);
      console.log();
    }

    // Display stderr if present
    if (result.stderr) {
      console.log(chalk.bold.yellow('Warnings:'));
      console.log(result.stderr);
      console.log();
    }

    // Display error if present
    if (result.error) {
      console.log(chalk.bold.red('Error:'));
      console.log(result.error);
      console.log();
    }

    // Display structured results
    if (result.results && result.results.length > 0) {
      for (const [index, res] of result.results.entries()) {
        // Display text result
        if (res.text) {
          console.log(chalk.bold.blue(`Result ${index + 1}:`));
          console.log(res.text);
          console.log();
        }

        // Display markdown
        if (res.markdown) {
          console.log(chalk.bold.blue(`Markdown ${index + 1}:`));
          console.log(res.markdown);
          console.log();
        }

        // Display JSON
        if (res.json) {
          console.log(chalk.bold.blue(`JSON ${index + 1}:`));
          console.log(JSON.stringify(res.json, null, 2));
          console.log();
        }

        // Display chart/image info
        if (res.png) {
          console.log(chalk.bold.magenta(`📊 Chart/Image ${index + 1} (PNG):`));
          console.log(chalk.dim('A PNG image was generated. In a web interface, this would be displayed.'));
          console.log(chalk.dim(`Data size: ${res.png.length} bytes (base64 encoded)`));
          console.log();
        }

        if (res.svg) {
          console.log(chalk.bold.magenta(`📊 Chart ${index + 1} (SVG):`));
          console.log(chalk.dim('An SVG chart was generated.'));
          console.log();
        }

        // Display HTML
        if (res.html) {
          console.log(chalk.bold.blue(`HTML ${index + 1}:`));
          console.log(chalk.dim('HTML content generated (not displayed in terminal)'));
          console.log();
        }
      }
    }

    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
  }

  /**
   * Display file operation result
   */
  static fileOperation(
    operation: string,
    result: { success: boolean; message: string; path?: string; paths?: string[] }
  ): void {
    console.log();

    if (result.success) {
      console.log(chalk.green(`✓ ${operation} successful`));
      if (result.path) {
        console.log(chalk.dim(`  Path: ${result.path}`));
      }
      if (result.paths && result.paths.length > 0) {
        console.log(chalk.dim(`  Paths: ${result.paths.join(', ')}`));
      }
    } else {
      console.log(chalk.red(`✗ ${operation} failed`));
      console.log(chalk.dim(`  ${result.message}`));
    }

    console.log();
  }

  /**
   * Display list of files
   */
  static fileList(path: string, files?: string[]): void {
    console.log();
    console.log(chalk.bold.cyan(`Files in ${path}:`));

    if (files && files.length > 0) {
      files.forEach(file => {
        console.log(chalk.dim(`  - ${file}`));
      });
    } else {
      console.log(chalk.dim('  (empty)'));
    }

    console.log();
  }

  /**
   * Display file contents
   */
  static fileContent(path: string, content: string): void {
    console.log();
    console.log(chalk.bold.cyan(`Content of ${path}:`));
    console.log(chalk.dim('─'.repeat(80)));
    console.log(content);
    console.log(chalk.dim('─'.repeat(80)));
    console.log();
  }

  /**
   * Display sandbox info
   */
  static sandboxInfo(info: { sandboxId?: string; templateId?: string; startedAt?: string; endAt?: string }): void {
    console.log();
    console.log(chalk.bold.cyan('Sandbox Information:'));

    if (info.sandboxId) {
      console.log(chalk.dim(`  ID: ${info.sandboxId}`));
    }
    if (info.templateId) {
      console.log(chalk.dim(`  Template: ${info.templateId}`));
    }
    if (info.startedAt) {
      console.log(chalk.dim(`  Started: ${info.startedAt}`));
    }
    if (info.endAt) {
      console.log(chalk.dim(`  Ends: ${info.endAt}`));
    }

    console.log();
  }

  /**
   * Display code execution status
   */
  static executionStatus(language: string, exitCode: number): void {
    console.log();

    if (exitCode === 0) {
      console.log(chalk.green(`✓ ${language} code executed successfully`));
    } else {
      console.log(chalk.red(`✗ ${language} code execution failed (exit code: ${exitCode})`));
    }
  }
}
