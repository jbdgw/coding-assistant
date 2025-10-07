/**
 * Model router - Smart routing logic for selecting optimal LLM
 */

import { ComplexityAnalyzer } from './complexity-analyzer.js';
import { getRoutingTableForStrategy } from '../../config/routing-config.js';
import { TaskComplexity, type RoutingDecision, type RoutingStrategy } from '../../types/routing.js';
import type { ChatMessage } from '../providers/base-provider.js';

export interface ModelRouterOptions {
  strategy?: RoutingStrategy;
  budgetRemaining?: number;
  budgetThreshold?: number;
}

export class ModelRouter {
  private complexityAnalyzer: ComplexityAnalyzer;
  private strategy: RoutingStrategy;

  constructor(options: ModelRouterOptions = {}) {
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.strategy = options.strategy || 'balanced';
  }

  /**
   * Select the best model for a given task
   */
  selectModel(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    options: ModelRouterOptions = {},
  ): RoutingDecision {
    // 1. Analyze task complexity
    let complexity = this.complexityAnalyzer.analyze(userMessage, conversationHistory);

    // 2. Check budget constraints
    const budgetRemaining = options.budgetRemaining;
    const budgetThreshold = options.budgetThreshold || 0.1; // Default: $0.10

    if (budgetRemaining !== undefined && budgetRemaining < budgetThreshold) {
      // Downgrade complexity if budget is low
      if (complexity === TaskComplexity.COMPLEX) {
        complexity = TaskComplexity.MODERATE;
      } else if (complexity === TaskComplexity.MODERATE) {
        complexity = TaskComplexity.SIMPLE;
      }
    }

    // 3. Get routing table for strategy
    const routingTable = getRoutingTableForStrategy(this.strategy);
    const candidates = routingTable[complexity];

    if (!candidates || candidates.length === 0) {
      throw new Error(`No routing candidates found for complexity: ${complexity}`);
    }

    // 4. Select highest priority model
    const sortedCandidates = [...candidates].sort((a, b) => a.priority - b.priority);
    const selectedModel = sortedCandidates[0];

    return {
      model: selectedModel.model,
      complexity,
      reason: this.getReasonForSelection(complexity, selectedModel.model),
      estimatedCost: selectedModel.cost,
    };
  }

  /**
   * Get fallback model for a given model and complexity
   */
  getFallback(
    failedModel: string,
    complexity: TaskComplexity,
  ): { model: string; reason: string } | null {
    const routingTable = getRoutingTableForStrategy(this.strategy);
    const candidates = routingTable[complexity];

    if (!candidates) {
      return null;
    }

    // Find next priority model
    const currentModelIndex = candidates.findIndex((c) => c.model === failedModel);
    if (currentModelIndex === -1 || currentModelIndex === candidates.length - 1) {
      // No more fallbacks available
      return null;
    }

    const fallback = candidates[currentModelIndex + 1];
    return {
      model: fallback.model,
      reason: `Fallback after ${failedModel} failed`,
    };
  }

  /**
   * Get human-readable reason for model selection
   */
  private getReasonForSelection(complexity: TaskComplexity, model: string): string {
    const reasons: Record<TaskComplexity, string> = {
      [TaskComplexity.SIMPLE]: 'Simple task - using efficient model',
      [TaskComplexity.MODERATE]: 'Moderate task - using balanced model',
      [TaskComplexity.COMPLEX]: 'Complex task - using powerful model',
    };

    return `${reasons[complexity]} (${model})`;
  }

  /**
   * Update routing strategy
   */
  setStrategy(strategy: RoutingStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get current strategy
   */
  getStrategy(): RoutingStrategy {
    return this.strategy;
  }

  /**
   * Get detailed analysis (for debugging)
   */
  analyzeDetailed(userMessage: string, conversationHistory: ChatMessage[] = []) {
    const complexityAnalysis = this.complexityAnalyzer.analyzeDetailed(
      userMessage,
      conversationHistory,
    );

    return {
      complexity: complexityAnalysis,
    };
  }
}
