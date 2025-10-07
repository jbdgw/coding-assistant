import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { OpenRouterClient, OpenRouterResponse } from './openrouter.js';

vi.mock('axios');

describe('OpenRouterClient', () => {
  let client: OpenRouterClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OpenRouterClient(mockApiKey);
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          Authorization: `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/your-username/ai-coding-cli',
          'X-Title': 'AI Coding CLI',
        },
      });
    });
  });

  describe('listModels', () => {
    it('should fetch and return models list', async () => {
      const mockModels = [
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          pricing: { prompt: '3', completion: '15' },
          context_length: 200000,
        },
      ];

      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({ data: { data: mockModels } }),
        post: vi.fn(),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);

      const newClient = new OpenRouterClient(mockApiKey);
      const models = await newClient.listModels();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models');
      expect(models).toEqual(mockModels);
    });

    it('should handle errors when fetching models', async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(new Error('Network error')),
        post: vi.fn(),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);
      vi.mocked(axios.isAxiosError).mockReturnValue(false);

      const newClient = new OpenRouterClient(mockApiKey);
      await expect(newClient.listModels()).rejects.toThrow('Network error');
    });
  });

  describe('chat', () => {
    it('should send chat request and return response with usage', async () => {
      const mockResponse: OpenRouterResponse = {
        id: 'test-id',
        model: 'anthropic/claude-3.5-sonnet',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);

      const newClient = new OpenRouterClient(mockApiKey);
      const result = await newClient.chat([{ role: 'user', content: 'Hello' }], 'anthropic/claude-3.5-sonnet');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        max_tokens: 4000,
      });

      expect(result.content).toBe('Hello! How can I help you?');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should use custom options when provided', async () => {
      const mockResponse: OpenRouterResponse = {
        id: 'test-id',
        model: 'anthropic/claude-3.5-sonnet',
        choices: [{ message: { role: 'assistant', content: 'Test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);

      const newClient = new OpenRouterClient(mockApiKey);
      await newClient.chat([{ role: 'user', content: 'Test' }], 'test-model', {
        temperature: 0.9,
        maxTokens: 2000,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.9,
        max_tokens: 2000,
      });
    });

    it('should handle API errors', async () => {
      const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn().mockRejectedValue({
          response: {
            data: {
              error: {
                message: 'Invalid API key',
              },
            },
          },
        }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const newClient = new OpenRouterClient(mockApiKey);
      await expect(newClient.chat([{ role: 'user', content: 'Hello' }], 'test-model')).rejects.toThrow(
        'OpenRouter API error: Invalid API key'
      );
    });
  });

  describe('getApiKey', () => {
    it('should return the API key', () => {
      expect(client.getApiKey()).toBe(mockApiKey);
    });
  });

  describe('chatStream', () => {
    it('should return stream generator and usage function', async () => {
      const mockChunks = [
        'data: {"id":"1","model":"test","choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n',
        'data: {"id":"1","model":"test","choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n',
        'data: [DONE]\n',
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield Buffer.from(chunk);
          }
        },
      };

      const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn().mockResolvedValue({ data: mockStream }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);

      const newClient = new OpenRouterClient(mockApiKey);
      const { stream, getUsage } = await newClient.chatStream([{ role: 'user', content: 'Hello' }], 'test-model');

      const chunks: string[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
      const usage = getUsage();
      expect(usage.completionTokens).toBeGreaterThan(0);
      expect(usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle streaming errors', async () => {
      const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn().mockRejectedValue({
          response: {
            data: {
              error: {
                message: 'Streaming error',
              },
            },
          },
        }),
      };
      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const newClient = new OpenRouterClient(mockApiKey);
      await expect(newClient.chatStream([{ role: 'user', content: 'Hello' }], 'test-model')).rejects.toThrow(
        'OpenRouter streaming error: Streaming error'
      );
    });
  });
});
