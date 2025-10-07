import inquirer from 'inquirer';
import ora from 'ora';
import { configManager } from '../lib/config.js';
import { Display } from '../utils/display.js';

interface InitAnswers {
  apiKey: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  setBudget: boolean;
}

interface BudgetAnswers {
  budgetLimit: number;
}

export async function initCommand(): Promise<void> {
  Display.header('Initialize AI Coding CLI');

  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your OpenRouter API key:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API key is required';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'defaultModel',
      message: 'Select your default model:',
      choices: [
        { name: 'Claude 3.5 Sonnet (Recommended)', value: 'anthropic/claude-3.5-sonnet' },
        { name: 'Claude 3.5 Haiku (Fast & Cheap)', value: 'anthropic/claude-3.5-haiku' },
        { name: 'GPT-4o', value: 'openai/gpt-4o' },
        { name: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
        { name: 'Claude 3 Opus (Most Capable)', value: 'anthropic/claude-3-opus' },
      ],
      default: 'anthropic/claude-3.5-sonnet',
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Temperature (0-2, higher = more creative):',
      default: 0.7,
      validate: (input: number) => {
        if (input < 0 || input > 2) {
          return 'Temperature must be between 0 and 2';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Max tokens per response:',
      default: 4000,
      validate: (input: number) => {
        if (input < 100) {
          return 'Max tokens must be at least 100';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'setBudget',
      message: 'Would you like to set a budget limit?',
      default: false,
    },
  ]);

  let budgetLimit: number | undefined;

  if (answers.setBudget) {
    const budgetAnswer = await inquirer.prompt<BudgetAnswers>([
      {
        type: 'number',
        name: 'budgetLimit',
        message: 'Budget limit (USD):',
        default: 10.0,
        validate: (input: number) => {
          if (input <= 0) {
            return 'Budget must be greater than 0';
          }
          return true;
        },
      },
    ]);
    budgetLimit = budgetAnswer.budgetLimit;
  }

  // Validate API key
  const spinner = ora('Validating API key...').start();

  try {
    const isValid = await configManager.validateApiKey(answers.apiKey);

    if (!isValid) {
      spinner.fail('Invalid API key');
      Display.error('The provided API key is not valid. Please check and try again.');
      Display.info('Get your API key at: https://openrouter.ai/keys');
      process.exit(1);
    }

    spinner.succeed('API key validated');

    // Save configuration
    configManager.setConfig({
      openrouterApiKey: answers.apiKey,
      defaultModel: answers.defaultModel,
      temperature: answers.temperature,
      maxTokens: answers.maxTokens,
      budgetLimit,
    });

    Display.newline();
    Display.success('Configuration saved successfully!');
    Display.newline();
    Display.section('Your Configuration');
    console.log(`  API Key: ${'*'.repeat(20)}`);
    console.log(`  Default Model: ${answers.defaultModel}`);
    console.log(`  Temperature: ${answers.temperature}`);
    console.log(`  Max Tokens: ${answers.maxTokens}`);
    if (budgetLimit) {
      console.log(`  Budget Limit: $${budgetLimit.toFixed(2)}`);
    }
    Display.newline();
    Display.info('You can now start chatting with: my-cli chat');
    Display.newline();
  } catch (error) {
    spinner.fail('Validation failed');
    Display.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
