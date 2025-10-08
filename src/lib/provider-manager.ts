/**
 * Provider Manager - Orchestrates model routing, provider execution, and usage tracking
 */

import { ModelRouter } from './routing/model-router.js';
import { OpenRouterProvider } from './providers/openrouter-provider.js';
import { UsageTracker } from './usage-tracker.js';
import type { ChatMessage, ChatOptions, ChatResponse, StreamResponse } from './providers/base-provider.js';
import type { RoutingDecision, RoutingStrategy } from '../types/routing.js';

export interface ProviderManagerOptions {
  strategy?: RoutingStrategy;
  budgetThreshold?: number;
  apiKey?: string;
  dbPath?: string;
  sessionId?: string;
}

export class ProviderManager {
  private router: ModelRouter;
  private provider: OpenRouterProvider;
  private usageTracker: UsageTracker;
  private conversationHistory: ChatMessage[] = [];

  constructor(options: ProviderManagerOptions = {}) {
    this.router = new ModelRouter({
      strategy: options.strategy || 'balanced',
      budgetThreshold: options.budgetThreshold,
    });
    this.provider = new OpenRouterProvider(options.apiKey);
    this.usageTracker = new UsageTracker(options.dbPath, options.sessionId);
  }

  /**
   * Select model for a given message
   */
  selectModel(userMessage: string, conversationHistory: ChatMessage[] = []): RoutingDecision {
    // Get budget remaining for routing decision
    const budgetRemaining =
      this.usageTracker.getBudgetRemaining('daily') ||
      this.usageTracker.getBudgetRemaining('weekly') ||
      this.usageTracker.getBudgetRemaining('monthly') ||
      undefined;

    const decision = this.router.selectModel(userMessage, conversationHistory, {
      budgetRemaining,
    });

    return decision;
  }

  /**
   * Chat with automatic model selection
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<{ response: ChatResponse; decision: RoutingDecision }> {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found in conversation');
    }

    // Select model
    const decision = this.selectModel(lastUserMessage.content, messages.slice(0, -1));

    // Execute with fallback
    const response = await this.executeWithFallback(async (model: string) => {
      return await this.provider.chat(messages, {
        ...options,
        model,
      });
    }, decision);

    return { response, decision };
  }

  /**
   * Streaming chat with automatic model selection
   */
  async chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<{ stream: StreamResponse; decision: RoutingDecision }> {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found in conversation');
    }

    // Select model
    const decision = this.selectModel(lastUserMessage.content, messages.slice(0, -1));

    // Execute with fallback
    const stream = await this.executeWithFallback(async (model: string) => {
      return await this.provider.chatStream(messages, {
        ...options,
        model,
      });
    }, decision);

    return { stream, decision };
  }

  /**
   * Execute operation with automatic fallback
   */
  private async executeWithFallback<T extends ChatResponse | StreamResponse>(
    operation: (model: string) => Promise<T>,
    decision: RoutingDecision,
    attemptCount: number = 0
  ): Promise<T> {
    const maxAttempts = 3;

    try {
      const result = await operation(decision.model);

      // Log successful usage
      if ('usage' in result) {
        this.usageTracker.logUsage(
          decision.model,
          result.usage,
          decision.complexity,
          this.provider.estimateCost(result.usage, decision.model),
          true
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if we should try fallback
      if (attemptCount >= maxAttempts - 1) {
        // Max attempts reached, log failure and throw
        this.usageTracker.logFailure(decision.model, errorMessage);
        throw new Error(`All attempts failed for ${decision.model} after ${maxAttempts} tries: ${errorMessage}`);
      }

      // Try to get fallback
      const fallback = this.router.getFallback(decision.model, decision.complexity);

      if (!fallback) {
        // No fallback available, log and throw
        this.usageTracker.logFailure(decision.model, errorMessage);
        throw new Error(`No fallback available for ${decision.model}: ${errorMessage}`);
      }

      // Log failure with fallback info
      this.usageTracker.logFailure(decision.model, errorMessage, fallback.model, false);

      // Create new decision with fallback model
      const fallbackDecision: RoutingDecision = {
        ...decision,
        model: fallback.model,
        reason: fallback.reason,
      };

      // Retry with fallback
      return await this.executeWithFallback(operation, fallbackDecision, attemptCount + 1);
    }
  }

  /**
   * Get usage tracker instance
   */
  getUsageTracker(): UsageTracker {
    return this.usageTracker;
  }

  /**
   * Get model router instance
   */
  getRouter(): ModelRouter {
    return this.router;
  }

  /**
   * Set routing strategy
   */
  setStrategy(strategy: RoutingStrategy): void {
    this.router.setStrategy(strategy);
  }

  /**
   * Get current strategy
   */
  getStrategy(): RoutingStrategy {
    return this.router.getStrategy();
  }

  /**
   * Close and cleanup
   */
  close(): void {
    this.usageTracker.close();
  }
}
