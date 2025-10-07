import readline from 'readline';
import ora from 'ora';
import { Display } from '../utils/display.js';
import { CostTracker } from './cost-tracker.js';
import { configManager } from './config.js';
import { E2BSandboxManager } from './e2b-sandbox-manager.js';
import { createChatAgent } from '../mastra/agents/chat-agent.js';
import { Agent } from '@mastra/core/agent';
import chalk from 'chalk';

export interface MastraChatLoopOptions {
  model: string;
}

export class MastraChatLoop {
  private model: string;
  private agent: Agent;
  private costTracker: CostTracker;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  private rl: readline.Interface;
  private isRunning: boolean = false;

  constructor(options: MastraChatLoopOptions) {
    this.model = options.model;
    this.agent = createChatAgent(this.model);
    this.costTracker = new CostTracker();
    this.conversationHistory = [];

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: Display.modelPrompt(this.model),
    });
  }

  start(): void {
    this.isRunning = true;
    Display.header('AI Coding Chat with E2B');
    Display.info(`Model: ${this.model}`);

    // Check if E2B is configured
    if (process.env.E2B_API_KEY) {
      Display.success('E2B Code Execution: Enabled ✓');
    } else {
      Display.warning('E2B Code Execution: Not configured');
    }

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
        this.handleCommand(trimmed);
        this.rl.prompt();
        return;
      }

      // Regular message
      void this.handleMessage(trimmed).then(() => {
        this.rl.prompt();
      });
    });

    this.rl.on('close', () => {
      void this.stop();
    });
  }

  private handleCommand(command: string): void {
    const parts = command.slice(1).split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case 'help':
        Display.commands();
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
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const spinner = ora('Thinking...').start();

    try {
      // Use Mastra agent with tools
      const result = await this.agent.generate(userMessage, {
        modelSettings: {
          temperature: configManager.get('temperature') || 0.7,
          maxTokens: configManager.get('maxTokens') || 4000,
        },
        maxSteps: 10, // Allow multiple tool calls
      });

      spinner.stop();
      Display.newline();
      console.log(chalk.green('Assistant:'));
      console.log(result.text);
      Display.newline();

      // Track token usage if available
      if (result.usage) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const promptTokens = typeof result.usage.promptTokens === 'number' ? result.usage.promptTokens : 0;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const completionTokens = typeof result.usage.completionTokens === 'number' ? result.usage.completionTokens : 0;
        const usage = {
          promptTokens: promptTokens as number,
          completionTokens: completionTokens as number,
        };
        const costInfo = this.costTracker.addUsage(usage, this.model);
        Display.usage(costInfo.usage.promptTokens, costInfo.usage.completionTokens, costInfo.cost);
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: result.text || '',
      });

      // Check budget limit
      const budgetLimit = configManager.getBudgetLimit();
      if (budgetLimit && this.costTracker.getTotalCost() >= budgetLimit) {
        Display.warning(`Budget limit of $${budgetLimit} reached!`);
        Display.info('Session will end.');
        this.rl.close();
      }
    } catch (err) {
      spinner.stop();
      Display.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
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

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    // Cleanup E2B sandbox if it was initialized
    try {
      const sandboxManager = E2BSandboxManager.getInstance({
        apiKey: process.env.E2B_API_KEY || '',
      });
      if (sandboxManager.isInitialized()) {
        await sandboxManager.cleanup();
      }
    } catch {
      // Sandbox manager not initialized, nothing to clean up
    }

    Display.newline();
    Display.sessionSummary(this.costTracker.getMessageCount(), this.costTracker.getTotalCost());
    Display.success('Chat session ended');
    process.exit(0);
  }
}
