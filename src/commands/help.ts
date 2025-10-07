import { Display } from '../utils/display.js';
import chalk from 'chalk';

export function helpCommand(): void {
  Display.header('AI Coding CLI - Help');

  console.log(chalk.bold('USAGE'));
  console.log('  my-cli <command> [options]');
  console.log();

  console.log(chalk.bold('COMMANDS'));
  console.log();

  const commands = [
    {
      name: 'init',
      description: 'Initialize and configure the CLI',
      usage: 'my-cli init',
    },
    {
      name: 'chat',
      description: 'Start an interactive chat session',
      usage: 'my-cli chat [--model <model-name>]',
      options: [{ flag: '--model <model-name>', desc: 'Use a specific model for this session' }],
    },
    {
      name: 'models',
      description: 'List all available models',
      usage: 'my-cli models',
    },
    {
      name: 'help',
      description: 'Show this help message',
      usage: 'my-cli help',
    },
  ];

  commands.forEach(cmd => {
    console.log(chalk.cyan(`  ${cmd.name}`));
    console.log(chalk.gray(`    ${cmd.description}`));
    console.log(chalk.white(`    ${cmd.usage}`));
    if (cmd.options) {
      cmd.options.forEach(opt => {
        console.log(chalk.gray(`      ${opt.flag.padEnd(25)} ${opt.desc}`));
      });
    }
    console.log();
  });

  console.log(chalk.bold('IN-CHAT COMMANDS'));
  console.log(chalk.gray('  (Available during chat sessions)'));
  console.log();

  const chatCommands = [
    { cmd: '/model <model-name>', desc: 'Switch to a different model' },
    { cmd: '/models', desc: 'Show available models' },
    { cmd: '/clear', desc: 'Clear conversation history' },
    { cmd: '/cost', desc: 'Show session cost summary' },
    { cmd: '/help', desc: 'Show in-chat commands' },
    { cmd: '/exit', desc: 'End the chat session' },
  ];

  chatCommands.forEach(({ cmd, desc }) => {
    console.log(`  ${chalk.cyan(cmd).padEnd(30)} ${chalk.gray(desc)}`);
  });
  console.log();

  console.log(chalk.bold('EXAMPLES'));
  console.log();
  console.log(chalk.gray('  # First time setup'));
  console.log(chalk.white('  my-cli init'));
  console.log();
  console.log(chalk.gray('  # Start chat with default model'));
  console.log(chalk.white('  my-cli chat'));
  console.log();
  console.log(chalk.gray('  # Start chat with specific model'));
  console.log(chalk.white('  my-cli chat --model anthropic/claude-3-opus'));
  console.log();
  console.log(chalk.gray('  # List available models'));
  console.log(chalk.white('  my-cli models'));
  console.log();

  console.log(chalk.bold('RESOURCES'));
  console.log();
  console.log(`  ${chalk.gray('OpenRouter API Keys:')} https://openrouter.ai/keys`);
  console.log(`  ${chalk.gray('OpenRouter Docs:')}    https://openrouter.ai/docs`);
  console.log(`  ${chalk.gray('Mastra Docs:')}        https://mastra.ai/docs`);
  console.log();
}
