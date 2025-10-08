/**
 * OpenRouter provider implementation
 */

import { OpenRouterClient } from '../openrouter.js';
import type {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  StreamResponse,
} from './base-provider.js';
import type { TokenUsage } from '../../types/routing.js';
import { MODEL_PRICING } from '../cost-tracker.js';

export class OpenRouterProvider implements LLMProvider {
  private client: OpenRouterClient;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!key) {
      throw new Error('OpenRouter API key is required');
    }
    this.client = new OpenRouterClient(key);
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const model = options?.model || 'anthropic/claude-3.5-sonnet';

    const result = await this.client.chat(messages, model, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return {
      content: result.content,
      usage: result.usage,
    };
  }

  async chatStream(messages: ChatMessage[], options?: ChatOptions): Promise<StreamResponse> {
    const model = options?.model || 'anthropic/claude-3.5-sonnet';

    const result = await this.client.chatStream(messages, model, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return {
      stream: result.stream,
      getUsage: result.getUsage,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.client.getApiKey();
      return apiKey !== null && apiKey.length > 0;
    } catch {
      return false;
    }
  }

  estimateCost(usage: TokenUsage, model: string): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      // Default pricing if model not in table
      return (usage.promptTokens * 0.003 + usage.completionTokens * 0.015) / 1000;
    }

    const promptCost = (usage.promptTokens * pricing.prompt) / 1_000_000;
    const completionCost = (usage.completionTokens * pricing.completion) / 1_000_000;

    return promptCost + completionCost;
  }

  getName(): string {
    return 'openrouter';
  }
}
