/**
 * Budget command - Manage budget limits
 */

import { Command } from 'commander';
import { UsageTracker } from '../lib/usage-tracker.js';
import { Display } from '../utils/display.js';
import chalk from 'chalk';

/**
 * Register budget subcommands
 */
export function registerBudgetCommand(program: Command): void {
  const budget = program
    .command('budget')
    .description('Manage budget limits for API usage');

  // budget set
  budget
    .command('set')
    .description('Set budget limits')
    .option('--daily <amount>', 'Set daily budget limit', parseFloat)
    .option('--weekly <amount>', 'Set weekly budget limit', parseFloat)
    .option('--monthly <amount>', 'Set monthly budget limit', parseFloat)
    .action((options: { daily?: number; weekly?: number; monthly?: number }) => {
      const tracker = new UsageTracker();

      try {
        if (!options.daily && !options.weekly && !options.monthly) {
          Display.error('Please specify at least one budget limit (--daily, --weekly, or --monthly)');
          tracker.close();
          return;
        }

        if (typeof options.daily === 'number') {
          tracker.setBudgetLimit('daily', options.daily);
          Display.success(`Daily budget limit set to $${options.daily.toFixed(2)}`);
        }

        if (typeof options.weekly === 'number') {
          tracker.setBudgetLimit('weekly', options.weekly);
          Display.success(`Weekly budget limit set to $${options.weekly.toFixed(2)}`);
        }

        if (typeof options.monthly === 'number') {
          tracker.setBudgetLimit('monthly', options.monthly);
          Display.success(`Monthly budget limit set to $${options.monthly.toFixed(2)}`);
        }
      } catch (error) {
        Display.error(`Failed to set budget: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        tracker.close();
      }
    });

  // budget clear
  budget
    .command('clear')
    .description('Clear all budget limits')
    .action(() => {
      const tracker = new UsageTracker();

      try {
        tracker.clearBudgetLimits();
        Display.success('All budget limits cleared');
      } catch (error) {
        Display.error(`Failed to clear budgets: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        tracker.close();
      }
    });

  // budget status
  budget
    .command('status')
    .description('Show current budget status')
    .action(() => {
      const tracker = new UsageTracker();

      try {
        Display.header('Budget Status');

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

            console.log(chalk.bold(`\n${name} Budget:`));
            console.log(`  Limit: $${limit.toFixed(2)}`);
            console.log(`  Used: ${chalk.cyan(`$${used.toFixed(2)}`)} (${percentage.toFixed(1)}%)`);
            console.log(`  Remaining: ${chalk.green(`$${(remaining || 0).toFixed(2)}`)}`);

            // Visual progress bar
            const barLength = 30;
            const filledLength = Math.min(Math.floor((used / limit) * barLength), barLength);
            const emptyLength = barLength - filledLength;
            const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

            const barColor = percentage > 90 ? chalk.red : percentage > 70 ? chalk.yellow : chalk.green;
            console.log(`  ${barColor(bar)}`);
          }
        }

        if (!hasBudgets) {
          console.log(chalk.dim('\nNo budget limits set.'));
          console.log(chalk.dim('Use `budget set --daily <amount>` to set a limit.'));
        }

        console.log();
      } catch (error) {
        Display.error(`Failed to retrieve budget status: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        tracker.close();
      }
    });
}
