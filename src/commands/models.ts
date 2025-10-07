import ora from 'ora';
import { configManager } from '../lib/config.js';
import { OpenRouterClient } from '../lib/openrouter.js';
import { Display } from '../utils/display.js';

export async function modelsCommand(): Promise<void> {
  // Check if API key is configured
  if (!configManager.hasApiKey()) {
    Display.error('API key not configured. Please run: my-cli init');
    process.exit(1);
  }

  const apiKey = configManager.getApiKey()!;
  const client = new OpenRouterClient(apiKey);

  const spinner = ora('Fetching available models...').start();

  try {
    const models = await client.listModels();
    spinner.succeed(`Found ${models.length} models`);

    // Group models by provider
    const modelsByProvider = models.reduce(
      (acc, model) => {
        const provider = model.id.split('/')[0];
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
      },
      {} as Record<string, typeof models>
    );

    Display.newline();
    Display.header('Available Models');

    // Show popular providers first
    const popularProviders = ['anthropic', 'openai', 'google', 'meta-llama', 'mistralai'];

    popularProviders.forEach(provider => {
      if (modelsByProvider[provider]) {
        Display.section(`${provider.toUpperCase()} Models`);
        modelsByProvider[provider].forEach(model => {
          console.log(`  ${chalk.cyan(model.id)}`);
          if (model.name) {
            console.log(`    ${chalk.gray(model.name)}`);
          }
          console.log(
            `    ${chalk.gray(`Pricing: $${model.pricing.prompt}/M prompt, $${model.pricing.completion}/M completion`)}`
          );
          console.log();
        });
      }
    });

    Display.info('Use "my-cli chat --model <model-id>" to use a specific model');
    Display.newline();
  } catch (error) {
    spinner.fail('Failed to fetch models');
    Display.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

import chalk from 'chalk';
