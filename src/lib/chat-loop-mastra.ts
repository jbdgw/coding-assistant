import readline from 'readline';
import ora from 'ora';
import { Display } from '../utils/display.js';
import { CostTracker } from './cost-tracker.js';
import { configManager } from './config.js';
import { E2BSandboxManager } from './e2b-sandbox-manager.js';
import { SessionManager } from './session-manager.js';
import { getMemory } from './memory-instance.js';
import { createChatAgent } from '../mastra/agents/chat-agent.js';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import chalk from 'chalk';
import { ProviderManager } from './provider-manager.js';
import type { RoutingStrategy, RoutingDecision } from '../types/routing.js';
import { customAlphabet } from 'nanoid';
import os from 'os';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

/**
 * Get a unique resource ID for this user/machine
 */
function getResourceId(): string {
  // Use machine hostname as resource ID (consistent across sessions)
  return `user-${os.hostname()}`;
}

export interface MastraChatLoopOptions {
  model: string;
  useSmartRouting?: boolean;
  strategy?: RoutingStrategy;
  budgetLimit?: number;
  sessionId?: string; // Resume existing session
  threadId?: string; // Resume with specific thread ID
}

export class MastraChatLoop {
  private model: string;
  private agent: Agent | null = null;
  private memory: Memory;
  private sessionManager: SessionManager;
  private sessionId: string;
  private threadId: string;
  private resourceId: string;
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

    // Initialize memory and session management
    this.memory = getMemory();
    this.sessionManager = new SessionManager();
    this.resourceId = getResourceId();

    // Use provided session/thread IDs or generate new ones
    if (options.sessionId) {
      // Resume existing session
      const session = this.sessionManager.getSession(options.sessionId);
      if (!session) {
        throw new Error(`Session not found: ${options.sessionId}`);
      }
      this.sessionId = session.id;
      this.threadId = session.threadId;
    } else if (options.threadId) {
      // Resume with specific thread ID
      const session = this.sessionManager.getSessionByThreadId(options.threadId);
      if (!session) {
        throw new Error(`Session not found for thread: ${options.threadId}`);
      }
      this.sessionId = session.id;
      this.threadId = session.threadId;
    } else {
      // Create new session
      this.threadId = nanoid();
      const session = this.sessionManager.createSession({
        threadId: this.threadId,
        title: 'New Chat Session',
      });
      this.sessionId = session.id;
    }

    // Agent will be created lazily in handleMessage
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
    const session = this.sessionManager.getSession(this.sessionId)!;

    // Prevent unhandled errors from killing the process
    process.on('uncaughtException', (error) => {
      console.error(chalk.red('\n⚠️  Uncaught Exception:'), error);
      Display.info('Chat continues - type your next message or /exit to quit');
      this.rl.prompt();
    });

    process.on('unhandledRejection', (reason) => {
      console.error(chalk.red('\n⚠️  Unhandled Rejection:'), reason);
      Display.info('Chat continues - type your next message or /exit to quit');
      this.rl.prompt();
    });

    Display.header('AI Coding Chat with Persistent Memory');

    // Display session info
    if (session.messageCount > 0) {
      Display.info(
        `📝 Resuming: ${session.title || 'Untitled'} (${session.messageCount} messages, started ${session.startedAt.toLocaleString()})`,
      );
    } else {
      Display.info(`📝 Session: ${session.id}`);
    }

    Display.success('💾 Persistent Memory: Enabled ✓');
    if (!process.env.OPENAI_API_KEY) {
      Display.info('   Working Memory + Conversation History (Semantic search disabled)');
      console.log(chalk.dim('   Tip: Add OPENAI_API_KEY to enable semantic search across all past sessions'));
    } else {
      Display.info('   Full Memory: Working Memory + Conversation History + Semantic Search');
    }

    if (this.useSmartRouting && this.providerManager) {
      Display.info(`Smart Routing: Enabled (${this.providerManager.getStrategy()} strategy)`);
      const budgetConfig = this.providerManager.getUsageTracker().getBudgetConfig();
      if (budgetConfig.dailyLimit) {
        const remaining = this.providerManager.getUsageTracker().getBudgetRemaining('daily');
        Display.info(
          `Daily Budget: $${budgetConfig.dailyLimit.toFixed(2)} (Remaining: $${remaining?.toFixed(2) || '0.00'})`,
        );
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
      void this.handleMessage(trimmed)
        .then(() => {
          this.rl.prompt();
        })
        .catch((error) => {
          console.error(chalk.red('\n⚠️  Error handling message:'), error);
          Display.info('Chat continues - type your next message or /exit to quit');
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
      // Initialize agent if not yet created (lazy loading)
      if (!this.agent) {
        this.agent = await createChatAgent(this.model, this.memory);
      }

      // If smart routing is enabled, select model dynamically
      if (this.useSmartRouting && this.providerManager) {
        routingDecision = this.providerManager.selectModel(
          userMessage,
          this.conversationHistory.slice(0, -1),
        );

        // Update current model and recreate agent if model changed
        if (this.currentModel !== routingDecision.model) {
          this.currentModel = routingDecision.model;
          this.agent = await createChatAgent(this.currentModel, this.memory);
        }

        // Show routing decision
        spinner.stop();
        console.log(chalk.cyan(`💡 ${routingDecision.reason}`));
        spinner.start('Thinking...');
      }

      // Use Mastra agent with tools and memory
      const result = await this.agent.generate(userMessage, {
        modelSettings: {
          temperature: configManager.get('temperature') || 0.7,
        },
        maxSteps: 10, // Allow multiple tool calls
        memory: {
          thread: this.threadId,
          resource: this.resourceId,
        },
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

      // Debug: Log raw usage data
      if (process.env.DEBUG_USAGE) {
        console.log(chalk.dim('Debug - Raw usage:'), JSON.stringify(result.usage, null, 2));
      }

      // Track token usage if available
      if (result.usage) {
        const usageAny = result.usage as any;

        // Try different property names that AI SDK might use
        const promptTokens =
          usageAny.promptTokens ??
          usageAny.inputTokens ??
          usageAny.prompt_tokens ??
          0;
        const completionTokens =
          usageAny.completionTokens ??
          usageAny.outputTokens ??
          usageAny.completion_tokens ??
          0;
        const totalTokens = promptTokens + completionTokens;
        const usage = {
          promptTokens,
          completionTokens,
          totalTokens,
        };

        // Warn if usage is zero (might indicate a tracking issue)
        if (totalTokens === 0) {
          console.log(chalk.yellow('⚠️  Warning: Token usage is 0. Set DEBUG_USAGE=1 to see raw usage data.'));
        }

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

        // Update session with cost and message count
        this.sessionManager.incrementMessageCount(this.sessionId);
        this.sessionManager.addCost(this.sessionId, costInfo.cost);
      } else {
        console.log(chalk.yellow('⚠️  No usage data available from model response'));
        // Still increment message count even without usage
        this.sessionManager.incrementMessageCount(this.sessionId);
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
      Display.newline();
      Display.info('Chat continues - type your next message or /exit to quit');
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

    // End session in database
    this.sessionManager.updateSession(this.sessionId, {
      endedAt: new Date(),
    });

    // Get session info before closing
    const sessionId = this.sessionId;

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

    // Close session manager
    this.sessionManager.close();

    Display.newline();
    Display.info(`💾 Session saved: ${sessionId}`);
    Display.info(`   Use 'my-cli resume ${sessionId}' to continue this conversation`);
    Display.sessionSummary(this.costTracker.getMessageCount(), this.costTracker.getTotalCost());
    Display.success('Chat session ended');

    // Allow process to exit naturally after all cleanup is done
  }
}
