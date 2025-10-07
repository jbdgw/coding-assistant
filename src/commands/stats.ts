/**
 * Stats command - Display usage statistics
 */

import { UsageTracker } from '../lib/usage-tracker.js';
import { Display } from '../utils/display.js';
import chalk from 'chalk';

export interface StatsCommandOptions {
  period?: string; // '7d', '30d', 'all'
}

export function statsCommand(_options: StatsCommandOptions = {}): void {
  const tracker = new UsageTracker();

  try {
    Display.header('Usage Statistics');

    // Get model statistics
    const modelStats = tracker.getModelStats();

    if (modelStats.length === 0) {
      Display.info('No usage data available yet. Start chatting to see statistics!');
      tracker.close();
      return;
    }

    // Display overall summary
    const totalCost = modelStats.reduce((sum, stat) => sum + stat.totalCost, 0);
    const totalCalls = modelStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
    const avgSuccessRate =
      modelStats.reduce((sum, stat) => sum + stat.successRate, 0) / modelStats.length;

    console.log(chalk.bold('\n📊 Overall Summary'));
    console.log(`Total API Calls: ${chalk.cyan(totalCalls)}`);
    console.log(`Total Cost: ${chalk.green('$' + totalCost.toFixed(4))}`);
    console.log(`Average Success Rate: ${chalk.yellow(avgSuccessRate.toFixed(1) + '%')}`);

    // Display model breakdown
    console.log(chalk.bold('\n🤖 Model Breakdown'));
    console.log();

    // Create a table-like display
    const headers = ['Model', 'Calls', 'Success Rate', 'Avg Cost', 'Total Cost'];
    const colWidths = [40, 10, 15, 12, 12];

    // Print header
    let headerRow = '';
    headers.forEach((header, i) => {
      headerRow += header.padEnd(colWidths[i]);
    });
    console.log(chalk.bold.cyan(headerRow));
    console.log('─'.repeat(headerRow.length));

    // Print rows
    modelStats.forEach((stat) => {
      const row = [
        stat.model.padEnd(colWidths[0]),
        stat.totalCalls.toString().padEnd(colWidths[1]),
        `${stat.successRate.toFixed(1)}%`.padEnd(colWidths[2]),
        `$${stat.avgCost.toFixed(4)}`.padEnd(colWidths[3]),
        chalk.green(`$${stat.totalCost.toFixed(4)}`).padEnd(colWidths[4] + 9), // +9 for color codes
      ];
      console.log(row.join(''));
    });

    // Display budget status
    console.log(chalk.bold('\n💰 Budget Status'));
    const budgetConfig = tracker.getBudgetConfig();

    const periods: Array<{ name: string; key: 'daily' | 'weekly' | 'monthly' }> = [
      { name: 'Daily', key: 'daily' },
      { name: 'Weekly', key: 'weekly' },
      { name: 'Monthly', key: 'monthly' },
    ];

    let hasBudgets = false;
    for (const { name, key } of periods) {
      const limitKey = `${key}Limit` as keyof typeof budgetConfig;
      const limit = budgetConfig[limitKey];

      if (limit && typeof limit === 'number') {
        hasBudgets = true;
        const remaining = tracker.getBudgetRemaining(key);
        const used = limit - (remaining || 0);
        const percentage = (used / limit) * 100;

        const statusColor = percentage > 90 ? chalk.red : percentage > 70 ? chalk.yellow : chalk.green;

        console.log(
          `${name}: ${statusColor(`$${used.toFixed(2)}`)} / $${limit.toFixed(2)} (${statusColor(percentage.toFixed(1) + '%')})`,
        );
      }
    }

    if (!hasBudgets) {
      console.log(chalk.dim('No budget limits set. Use `budget set` to configure.'));
    }

    console.log();
  } catch (error) {
    Display.error(`Failed to retrieve statistics: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    tracker.close();
  }
}
