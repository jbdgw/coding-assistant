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
  setupE2B: boolean;
}

interface BudgetAnswers {
  budgetLimit: number;
}

interface E2BAnswers {
  e2bApiKey: string;
}

interface RAGAnswers {
  setupRAG: boolean;
}

export async function initCommand(): Promise<void> {
  Display.header('Initialize AI Coding CLI');

  const questions = [
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
    {
      type: 'confirm',
      name: 'setupE2B',
      message: 'Would you like to set up E2B for code execution? (optional)',
      default: false,
    },
  ] as any;
  const answers = (await inquirer.prompt(questions)) as InitAnswers;

  // Ask about RAG setup
  const ragSetup = (await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupRAG',
      message: 'Would you like to set up RAG for code search? (requires Ollama + ChromaDB)',
      default: false,
    },
  ])) as RAGAnswers;

  let budgetLimit: number | undefined;

  if (answers.setBudget) {
    const budgetQuestions = [
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
    ] as any;
    const budgetAnswer = (await inquirer.prompt(budgetQuestions)) as BudgetAnswers;
    budgetLimit = budgetAnswer.budgetLimit;
  }

  let e2bApiKey: string | undefined;

  if (answers.setupE2B) {
    Display.newline();
    Display.info('E2B enables secure code execution in sandboxed environments.');
    Display.info('Get your API key at: https://e2b.dev/dashboard?tab=keys');
    Display.newline();

    const e2bAnswer = (await inquirer.prompt([
      {
        type: 'password',
        name: 'e2bApiKey',
        message: 'Enter your E2B API key (or leave empty to skip):',
        validate: (input: string) => {
          if (input && !input.startsWith('e2b_')) {
            return 'E2B API keys should start with "e2b_"';
          }
          return true;
        },
      },
    ])) as E2BAnswers;

    if (e2bAnswer.e2bApiKey && e2bAnswer.e2bApiKey.trim().length > 0) {
      e2bApiKey = e2bAnswer.e2bApiKey.trim();
    }
  }

  if (ragSetup.setupRAG) {
    Display.newline();
    Display.info('RAG enables searching your indexed codebases for relevant code examples.');
    Display.info('Requirements:');
    Display.info('  1. Ollama running locally (http://localhost:11434)');
    Display.info('  2. ChromaDB running locally (http://localhost:8000)');
    Display.info('  3. Crawl4AI (optional, for scraping documentation sites)');
    Display.newline();
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
      e2bApiKey,
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
    if (e2bApiKey) {
      console.log(`  E2B Code Execution: Enabled ✓`);
    } else {
      console.log(`  E2B Code Execution: Not configured`);
    }
    if (ragSetup.setupRAG) {
      console.log(`  RAG Code Search: Enabled ✓`);
    }
    Display.newline();
    Display.info('You can now start chatting with: my-cli chat');
    if (!e2bApiKey) {
      Display.info('To enable code execution later, get an E2B key at: https://e2b.dev/dashboard');
    }
    if (ragSetup.setupRAG) {
      Display.info('Index a codebase with: my-cli index create <directory>');
      Display.info('Scrape documentation with: my-cli scrape <url>');
      Display.info('Search with: my-cli search <query>');
    }
    Display.newline();
  } catch (error) {
    spinner.fail('Validation failed');
    Display.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
