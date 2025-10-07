/**
 * Base provider interface for LLM providers
 */

import type { TokenUsage } from '../../types/routing.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatResponse {
  content: string;
  usage: TokenUsage;
}

export interface StreamResponse {
  stream: AsyncGenerator<string, void, unknown>;
  getUsage: () => TokenUsage;
}

/**
 * Abstract interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Non-streaming chat completion
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Streaming chat completion
   */
  chatStream(messages: ChatMessage[], options?: ChatOptions): Promise<StreamResponse>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Estimate cost for given token usage and model
   */
  estimateCost(usage: TokenUsage, model: string): number;

  /**
   * Get provider name
   */
  getName(): string;
}
