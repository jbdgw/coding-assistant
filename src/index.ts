#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { chatCommand, ChatCommandOptions } from './commands/chat.js';
import { modelsCommand } from './commands/models.js';
import { helpCommand } from './commands/help.js';
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

// Default to help if no command provided
if (!process.argv.slice(2).length) {
  helpCommand();
  process.exit(0);
}

program.parse(process.argv);
