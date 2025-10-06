export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostInfo {
  usage: TokenUsage;
  cost: number;
  model: string;
}

export interface ModelPricing {
  prompt: number;  // Cost per 1M tokens
  completion: number;  // Cost per 1M tokens
}

// Pricing information for common models (cost per 1M tokens)
const MODEL_PRICING: Record<string, ModelPricing> = {
  'anthropic/claude-3.5-sonnet': { prompt: 3, completion: 15 },
  'anthropic/claude-3.5-haiku': { prompt: 1, completion: 5 },
  'anthropic/claude-3-opus': { prompt: 15, completion: 75 },
  'openai/gpt-4o': { prompt: 5, completion: 15 },
  'openai/gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'openai/gpt-4-turbo': { prompt: 10, completion: 30 },
  'openai/chatgpt-4o-latest': { prompt: 5, completion: 15 },
};

export class CostTracker {
  private sessionCosts: CostInfo[] = [];
  private totalCost: number = 0;

  calculateCost(usage: TokenUsage, model: string): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      // Default pricing if model not found
      return (usage.promptTokens * 5 + usage.completionTokens * 15) / 1_000_000;
    }

    const promptCost = (usage.promptTokens / 1_000_000) * pricing.prompt;
    const completionCost = (usage.completionTokens / 1_000_000) * pricing.completion;

    return promptCost + completionCost;
  }

  addUsage(usage: TokenUsage, model: string): CostInfo {
    const cost = this.calculateCost(usage, model);
    const costInfo: CostInfo = { usage, cost, model };

    this.sessionCosts.push(costInfo);
    this.totalCost += cost;

    return costInfo;
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getSessionCosts(): CostInfo[] {
    return this.sessionCosts;
  }

  getMessageCount(): number {
    return this.sessionCosts.length;
  }

  getTotalTokens(): TokenUsage {
    return this.sessionCosts.reduce(
      (acc, costInfo) => ({
        promptTokens: acc.promptTokens + costInfo.usage.promptTokens,
        completionTokens: acc.completionTokens + costInfo.usage.completionTokens,
        totalTokens: acc.totalTokens + costInfo.usage.totalTokens,
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    );
  }

  reset(): void {
    this.sessionCosts = [];
    this.totalCost = 0;
  }

  formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  formatUsage(usage: TokenUsage): string {
    return `${usage.promptTokens} in, ${usage.completionTokens} out`;
  }

  getSummary(): string {
    const totalTokens = this.getTotalTokens();
    return [
      `Messages: ${this.getMessageCount()}`,
      `Tokens: ${this.formatUsage(totalTokens)}`,
      `Total Cost: ${this.formatCost(this.totalCost)}`,
    ].join(' | ');
  }
}
