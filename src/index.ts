#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { chatCommand, ChatCommandOptions } from './commands/chat.js';
import { modelsCommand } from './commands/models.js';
import { helpCommand } from './commands/help.js';
import { registerIndexCommand } from './commands/index-cmd.js';
import { registerSearchCommand } from './commands/search.js';
import { registerScrapeCommand } from './commands/scrape.js';
import { statsCommand, StatsCommandOptions } from './commands/stats.js';
import { registerBudgetCommand } from './commands/budget.js';
import { strategyCommand, showStrategyCommand } from './commands/strategy.js';
import { Display } from './utils/display.js';

const program = new Command();

program.name('my-cli').description('Personal AI coding CLI tool using Mastra AI and OpenRouter').version('0.1.0');

program
  .command('init')
  .description('Initialize and configure the CLI')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      Display.error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-m, --model <model>', 'Model to use for this session')
  .option('-s, --strategy <strategy>', 'Routing strategy: cost, performance, or balanced (default)')
  .option('-b, --budget-limit <amount>', 'Budget limit for this session', parseFloat)
  .action((options: ChatCommandOptions) => {
    try {
      chatCommand(options);
    } catch (error) {
      Display.error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('models')
  .description('List all available models')
  .action(async () => {
    try {
      await modelsCommand();
    } catch (error) {
      Display.error(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('help')
  .description('Show help information')
  .action(() => {
    helpCommand();
  });

// Register RAG commands
registerIndexCommand(program);
registerSearchCommand(program);
registerScrapeCommand(program);

// Register routing commands
program
  .command('stats')
  .description('View usage statistics and costs')
  .option('-p, --period <period>', 'Time period: 7d, 30d, or all (default)')
  .action((options: StatsCommandOptions) => {
    try {
      statsCommand(options);
    } catch (error) {
      Display.error(`Failed to retrieve stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

registerBudgetCommand(program);

program
  .command('strategy')
  .description('View available routing strategies')
  .argument('[strategy]', 'Specific strategy to view: cost, performance, or balanced')
  .action((strategyName?: string) => {
    try {
      if (strategyName) {
        showStrategyCommand(strategyName);
      } else {
        strategyCommand();
      }
    } catch (error) {
      Display.error(`Failed to show strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

// Default to help if no command provided
if (!process.argv.slice(2).length) {
  helpCommand();
  process.exit(0);
}

program.parse(process.argv);
