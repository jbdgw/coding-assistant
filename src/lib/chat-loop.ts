import readline from 'readline';
import ora from 'ora';
import { Display } from '../utils/display.js';
import { OpenRouterClient, OpenRouterMessage } from './openrouter.js';
import { CostTracker } from './cost-tracker.js';
import { configManager } from './config.js';

export interface ChatLoopOptions {
  model: string;
  openRouterClient: OpenRouterClient;
  initialMessages?: OpenRouterMessage[];
}

export class ChatLoop {
  private model: string;
  private client: OpenRouterClient;
  private costTracker: CostTracker;
  private conversationHistory: OpenRouterMessage[];
  private rl: readline.Interface;
  private isRunning: boolean = false;

  constructor(options: ChatLoopOptions) {
    this.model = options.model;
    this.client = options.openRouterClient;
    this.costTracker = new CostTracker();
    this.conversationHistory = options.initialMessages || [];

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: Display.modelPrompt(this.model),
    });
  }

  start(): void {
    this.isRunning = true;
    Display.header('AI Coding Chat');
    Display.info(`Model: ${this.model}`);
    Display.info('Type /help for available commands, /exit to quit');
    console.log();

    this.rl.prompt();

    this.rl.on('line', (input: string) => {
      const trimmed = input.trim();

      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      // Handle slash commands
      if (trimmed.startsWith('/')) {
        void this.handleCommand(trimmed).then(() => {
          this.rl.prompt();
        });
        return;
      }

      // Regular message
      void this.handleMessage(trimmed).then(() => {
        this.rl.prompt();
      });
    });

    this.rl.on('close', () => {
      this.stop();
    });
  }

  private async handleCommand(command: string): Promise<void> {
    const parts = command.slice(1).split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        Display.commands();
        break;

      case 'model':
        if (args.length === 0) {
          Display.error('Please specify a model name. Example: /model gpt-4o');
        } else {
          await this.switchModel(args.join(' '));
        }
        break;

      case 'models':
        await this.listModels();
        break;

      case 'clear':
        this.clearHistory();
        break;

      case 'cost':
        this.showCost();
        break;

      case 'exit':
      case 'quit':
        this.rl.close();
        break;

      default:
        Display.error(`Unknown command: /${cmd}. Type /help for available commands.`);
    }
  }

  private async handleMessage(userMessage: string): Promise<void> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const spinner = ora('Thinking...').start();

    try {
      const temperature = configManager.get('temperature') || 0.7;
      const maxTokens = configManager.get('maxTokens') || 4000;

      let fullResponse = '';

      // Use streaming for better UX
      const { stream, getUsage } = await this.client.chatStream(this.conversationHistory, this.model, {
        temperature,
        maxTokens,
      });

      spinner.stop();
      Display.newline();
      console.log(chalk.green('Assistant:'));

      for await (const chunk of stream) {
        process.stdout.write(chunk);
        fullResponse += chunk;
      }

      Display.newline();
      Display.newline();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
      });

      // Get usage and track cost
      const usage = getUsage();
      const costInfo = this.costTracker.addUsage(usage, this.model);
      Display.usage(costInfo.usage.promptTokens, costInfo.usage.completionTokens, costInfo.cost);

      // Check budget limit
      const budgetLimit = configManager.getBudgetLimit();
      if (budgetLimit && this.costTracker.getTotalCost() >= budgetLimit) {
        Display.warning(`Budget limit of $${budgetLimit} reached!`);
        Display.info('Session will end.');
        this.rl.close();
      }
    } catch (error) {
      spinner.stop();
      Display.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async switchModel(newModel: string): Promise<void> {
    try {
      // Validate model exists
      const spinner = ora('Checking model...').start();
      const models = await this.client.listModels();
      spinner.stop();

      const modelExists = models.some(m => m.id === newModel);
      if (!modelExists) {
        Display.error(`Model '${newModel}' not found. Use /models to see available models.`);
        return;
      }

      this.model = newModel;
      this.rl.setPrompt(Display.modelPrompt(this.model));
      Display.success(`Switched to model: ${newModel}`);
    } catch (error) {
      Display.error(`Failed to switch model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async listModels(): Promise<void> {
    const spinner = ora('Fetching models...').start();
    try {
      const models = await this.client.listModels();
      spinner.stop();

      // Show popular models first
      const popularModels = models.filter(
        m => m.id.includes('claude') || m.id.includes('gpt-4') || m.id.includes('gemini')
      );

      Display.modelList(popularModels.slice(0, 10));
      Display.info(`Showing 10 of ${models.length} available models`);
    } catch (error) {
      spinner.stop();
      Display.error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private clearHistory(): void {
    this.conversationHistory = [];
    Display.clear();
    Display.success('Conversation history cleared');
  }

  private showCost(): void {
    Display.newline();
    Display.section('Cost Summary');
    console.log(this.costTracker.getSummary());
    Display.newline();
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    Display.newline();
    Display.sessionSummary(this.costTracker.getMessageCount(), this.costTracker.getTotalCost());
    Display.success('Chat session ended');
    process.exit(0);
  }
}

// Need to import chalk for streaming output
import chalk from 'chalk';
