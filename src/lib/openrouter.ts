import axios, { AxiosInstance } from 'axios';
import { TokenUsage } from './cost-tracker.js';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  top_provider?: {
    max_completion_tokens?: number;
  };
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterStreamChunk {
  id: string;
  model: string;
  choices: Array<{
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class OpenRouterClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/your-username/ai-coding-cli',
        'X-Title': 'AI Coding CLI',
      },
    });
  }

  async listModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await this.client.get<{ data: OpenRouterModel[] }>('/models');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch models: ${error.message}`);
      }
      throw error;
    }
  }

  async chat(
    messages: OpenRouterMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{ content: string; usage: TokenUsage }> {
    try {
      const response = await this.client.post<OpenRouterResponse>('/chat/completions', {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
      });

      const content = response.data.choices[0]?.message?.content || '';
      const usage: TokenUsage = {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      };

      return { content, usage };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as { error?: { message?: string } } | undefined;
        const errorMsg = errorData?.error?.message || error.message;
        throw new Error(`OpenRouter API error: ${errorMsg}`);
      }
      throw error;
    }
  }

  async chatStream(
    messages: OpenRouterMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{ stream: AsyncGenerator<string, void, undefined>; getUsage: () => TokenUsage }> {
    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4000,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      let promptTokens = 0;
      let completionTokens = 0;
      let buffer = '';

      // Estimate prompt tokens upfront
      const totalMessageLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      promptTokens = Math.ceil(totalMessageLength / 4);

      const generator = async function* () {
        for await (const chunk of response.data as AsyncIterable<Buffer>) {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith(':')) continue; // Skip SSE comments

            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr) as OpenRouterStreamChunk;
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  completionTokens += Math.ceil(content.length / 4);
                  yield content;
                }
              } catch {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      };

      const getUsage = () => ({
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      });

      return { stream: generator(), getUsage };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = (error.response?.data as { error?: { message?: string } })?.error?.message || error.message;
        throw new Error(`OpenRouter streaming error: ${errorMsg}`);
      }
      throw error;
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  getApiKey(): string {
    return this.apiKey;
  }
}
