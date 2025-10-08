/**
 * Remember command - Store user preferences
 */

import { Command } from 'commander';
import { initializeDatabase } from '../lib/storage/usage-db.js';
import { Display } from '../utils/display.js';
import chalk from 'chalk';

export function rememberCommand() {
  const command = new Command('remember');

  command
    .description('Store a user preference for the AI to remember')
    .argument('<key>', 'Preference key (e.g., "coding-style", "framework", "language")')
    .argument('<value>', 'Preference value')
    .option('-c, --category <category>', 'Category for the preference', 'general')
    .option('--confidence <number>', 'Confidence level (0-1)', '1.0')
    .action(async (key: string, value: string, options) => {
      const db = initializeDatabase();

      try {
        const category = options.category;
        const confidence = parseFloat(options.confidence);

        if (confidence < 0 || confidence > 1) {
          Display.error('Confidence must be between 0 and 1');
          process.exit(1);
        }

        // Insert or update preference
        const stmt = db.prepare(`
          INSERT INTO user_preferences (category, key, value, confidence, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(category, key)
          DO UPDATE SET value = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP
        `);

        stmt.run(category, key, value, confidence, value, confidence);

        Display.success(`✓ Remembered: ${chalk.cyan(key)} = ${chalk.yellow(value)}`);
        Display.info(`  Category: ${category}`);
        Display.info(`  Confidence: ${(confidence * 100).toFixed(0)}%`);
        console.log();
        Display.info('The AI will use this preference in future conversations');
      } catch (error) {
        Display.error(
          `Failed to store preference: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        process.exit(1);
      } finally {
        db.close();
      }
    });

  // Subcommand to list preferences
  command
    .command('list')
    .description('List all stored preferences')
    .option('-c, --category <category>', 'Filter by category')
    .action((options) => {
      const db = initializeDatabase();

      try {
        let query = 'SELECT * FROM user_preferences';
        const params: any[] = [];

        if (options.category) {
          query += ' WHERE category = ?';
          params.push(options.category);
        }

        query += ' ORDER BY category, key';

        const stmt = db.prepare(query);
        const preferences = stmt.all(...params) as any[];

        if (preferences.length === 0) {
          console.log(chalk.yellow('\nNo preferences stored yet.'));
          console.log(chalk.dim('Store a preference with: my-cli remember <key> <value>\n'));
          return;
        }

        console.log(chalk.bold.cyan('\n💡 Stored Preferences:\n'));

        let currentCategory = '';
        for (const pref of preferences) {
          if (pref.category !== currentCategory) {
            currentCategory = pref.category;
            console.log(chalk.bold(`\n${currentCategory.toUpperCase()}:`));
          }

          const confidence = (pref.confidence * 100).toFixed(0);
          const confidenceBar = '█'.repeat(Math.floor(pref.confidence * 10));
          console.log(`  ${chalk.cyan(pref.key)}: ${chalk.yellow(pref.value)}`);
          console.log(chalk.dim(`    Confidence: ${confidenceBar} ${confidence}%`));
        }

        console.log();
      } finally {
        db.close();
      }
    });

  return command;
}
