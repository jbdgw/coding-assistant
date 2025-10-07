import readline from 'readline';
import ora from 'ora';
import { Display } from '../utils/display.js';
import { CostTracker } from './cost-tracker.js';
import { configManager } from './config.js';
import { E2BSandboxManager } from './e2b-sandbox-manager.js';
import { createChatAgent } from '../mastra/agents/chat-agent.js';
import { Agent } from '@mastra/core/agent';
import chalk from 'chalk';
import { ProviderManager } from './provider-manager.js';
import type { RoutingStrategy, RoutingDecision } from '../types/routing.js';

export interface MastraChatLoopOptions {
  model: string;
  useSmartRouting?: boolean;
  strategy?: RoutingStrategy;
  budgetLimit?: number;
}

export class MastraChatLoop {
  private model: string;
  private agent: Agent;
  private costTracker: CostTracker;
  private providerManager?: ProviderManager;
  private useSmartRouting: boolean;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  private rl: readline.Interface;
  private isRunning: boolean = false;
  private currentModel: string;

  constructor(options: MastraChatLoopOptions) {
    this.model = options.model;
    this.useSmartRouting = options.useSmartRouting || false;
    this.currentModel = this.model;
    this.agent = createChatAgent(this.model);
    this.costTracker = new CostTracker();
    this.conversationHistory = [];

    // Initialize provider manager if using smart routing
    if (this.useSmartRouting) {
      this.providerManager = new ProviderManager({
        strategy: options.strategy || 'balanced',
        apiKey: process.env.OPENROUTER_API_KEY || configManager.getApiKey(),
      });

      // Set budget limit if provided
      if (options.budgetLimit) {
        this.providerManager.getUsageTracker().setBudgetLimit('daily', options.budgetLimit);
      }
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: Display.modelPrompt(this.useSmartRouting ? 'Smart Routing' : this.model),
    });
  }

  start(): void {
    this.isRunning = true;
    Display.header('AI Coding Chat with E2B');

    if (this.useSmartRouting && this.providerManager) {
      Display.info(`Smart Routing: Enabled (${this.providerManager.getStrategy()} strategy)`);
      const budgetConfig = this.providerManager.getUsageTracker().getBudgetConfig();
      if (budgetConfig.dailyLimit) {
        const remaining = this.providerManager.getUsageTracker().getBudgetRemaining('daily');
        Display.info(`Daily Budget: $${budgetConfig.dailyLimit.toFixed(2)} (Remaining: $${remaining?.toFixed(2) || '0.00'})`);
      }
    } else {
      Display.info(`Model: ${this.model}`);
    }

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

    let routingDecision: RoutingDecision | undefined;
    const spinner = ora('Thinking...').start();

    try {
      // If smart routing is enabled, select model dynamically
      if (this.useSmartRouting && this.providerManager) {
        routingDecision = this.providerManager.selectModel(
          userMessage,
          this.conversationHistory.slice(0, -1),
        );

        // Update current model and recreate agent if model changed
        if (this.currentModel !== routingDecision.model) {
          this.currentModel = routingDecision.model;
          this.agent = createChatAgent(this.currentModel);
        }

        // Show routing decision
        spinner.stop();
        console.log(chalk.cyan(`💡 ${routingDecision.reason}`));
        spinner.start('Thinking...');
      }

      // Use Mastra agent with tools
      const result = await this.agent.generate(userMessage, {
        modelSettings: {
          temperature: configManager.get('temperature') || 0.7,
        },
        maxSteps: 10, // Allow multiple tool calls
      });

      spinner.stop();
      Display.newline();

      // Check if RAG search was used and display sources
      if (result.steps && result.steps.length > 0) {
        for (const step of result.steps) {
          if (
            step.toolCalls &&
            step.toolCalls.some((call: any) => call.toolName === 'search_indexed_code')
          ) {
            // Find the RAG tool call result
            const ragCall = step.toolCalls.find(
              (call: any) => call.toolName === 'search_indexed_code',
            );
            if (ragCall && (ragCall as any).result && typeof (ragCall as any).result === 'object') {
              const ragResult = (ragCall as any).result as { results?: Array<{ filePath: string; score: number }> };
              if (ragResult.results && ragResult.results.length > 0) {
                console.log(chalk.dim.italic('📚 Referenced sources:'));
                for (const source of ragResult.results) {
                  const score = (source.score * 100).toFixed(1);
                  console.log(chalk.dim(`   • ${source.filePath} (${score}% match)`));
                }
                console.log();
              }
            }
          }
        }
      }

      console.log(chalk.green('Assistant:'));
      console.log(result.text);
      Display.newline();

      // Track token usage if available
      if (result.usage) {
        const usageAny = result.usage as any;
        const promptTokens = typeof usageAny.promptTokens === 'number' ? usageAny.promptTokens : 0;
        const completionTokens = typeof usageAny.completionTokens === 'number' ? usageAny.completionTokens : 0;
        const totalTokens = promptTokens + completionTokens;
        const usage = {
          promptTokens,
          completionTokens,
          totalTokens,
        };

        // Log to database if smart routing is enabled
        if (this.useSmartRouting && this.providerManager && routingDecision) {
          const cost = this.costTracker.calculateCost(usage, this.currentModel);
          this.providerManager.getUsageTracker().logUsage(
            this.currentModel,
            usage,
            routingDecision.complexity,
            cost,
            true,
          );
        }

        const costInfo = this.costTracker.addUsage(usage, this.currentModel);
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

    // Cleanup provider manager if using smart routing
    if (this.providerManager) {
      this.providerManager.close();
    }

    Display.newline();
    Display.sessionSummary(this.costTracker.getMessageCount(), this.costTracker.getTotalCost());
    Display.success('Chat session ended');
    process.exit(0);
  }
}
