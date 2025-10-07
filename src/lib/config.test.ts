import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ConfigManager } from './config.js';
import { configStore } from '../utils/storage.js';

vi.mock('axios');
vi.mock('../utils/storage.js', () => ({
  configStore: {
    get: vi.fn(),
    set: vi.fn(),
    setAll: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
    getPath: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ConfigManager', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ConfigManager();
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      vi.mocked(axios.post).mockResolvedValue({ status: 200 });

      const result = await manager.validateApiKey('valid-key');

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3.5-haiku',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: 'Bearer valid-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should return false for invalid API key (401)', async () => {
      const error = {
        response: { status: 401 },
        isAxiosError: true,
      };
      vi.mocked(axios.post).mockRejectedValue(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const result = await manager.validateApiKey('invalid-key');

      expect(result).toBe(false);
    });

    it('should return true for network errors (not auth errors)', async () => {
      const error = {
        response: { status: 500 },
        isAxiosError: true,
      };
      vi.mocked(axios.post).mockRejectedValue(error);
      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const result = await manager.validateApiKey('test-key');

      expect(result).toBe(true);
    });
  });

  describe('setConfig', () => {
    it('should set all config values', () => {
      const config = {
        openrouterApiKey: 'test-key',
        defaultModel: 'test-model',
        temperature: 0.8,
      };

      manager.setConfig(config);

      expect(configStore.setAll).toHaveBeenCalledWith(config);
    });
  });

  describe('getConfig', () => {
    it('should get all config values', () => {
      const mockConfig = {
        openrouterApiKey: 'test-key',
        defaultModel: 'test-model',
        temperature: 0.7,
        maxTokens: 4000,
      };
      vi.mocked(configStore.getAll).mockReturnValue(mockConfig);

      const result = manager.getConfig();

      expect(result).toEqual(mockConfig);
      expect(configStore.getAll).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should get a specific config value', () => {
      vi.mocked(configStore.get).mockReturnValue('test-model');

      const result = manager.get('defaultModel');

      expect(result).toBe('test-model');
      expect(configStore.get).toHaveBeenCalledWith('defaultModel');
    });
  });

  describe('set', () => {
    it('should set a specific config value', () => {
      manager.set('temperature', 0.9);

      expect(configStore.set).toHaveBeenCalledWith('temperature', 0.9);
    });
  });

  describe('hasApiKey', () => {
    it('should return true when API key exists', () => {
      vi.mocked(configStore.get).mockReturnValue('test-key');

      const result = manager.hasApiKey();

      expect(result).toBe(true);
      expect(configStore.get).toHaveBeenCalledWith('openrouterApiKey');
    });

    it('should return false when API key is empty', () => {
      vi.mocked(configStore.get).mockReturnValue('');

      const result = manager.hasApiKey();

      expect(result).toBe(false);
    });

    it('should return false when API key is undefined', () => {
      vi.mocked(configStore.get).mockReturnValue(undefined);

      const result = manager.hasApiKey();

      expect(result).toBe(false);
    });
  });

  describe('getApiKey', () => {
    it('should return the API key', () => {
      vi.mocked(configStore.get).mockReturnValue('test-key');

      const result = manager.getApiKey();

      expect(result).toBe('test-key');
      expect(configStore.get).toHaveBeenCalledWith('openrouterApiKey');
    });
  });

  describe('getDefaultModel', () => {
    it('should return stored default model', () => {
      vi.mocked(configStore.get).mockReturnValue('test-model');

      const result = manager.getDefaultModel();

      expect(result).toBe('test-model');
      expect(configStore.get).toHaveBeenCalledWith('defaultModel');
    });

    it('should return fallback model when not set', () => {
      vi.mocked(configStore.get).mockReturnValue(undefined);

      const result = manager.getDefaultModel();

      expect(result).toBe('anthropic/claude-3.5-sonnet');
    });
  });

  describe('getBudgetLimit', () => {
    it('should return budget limit', () => {
      vi.mocked(configStore.get).mockReturnValue(10.5);

      const result = manager.getBudgetLimit();

      expect(result).toBe(10.5);
      expect(configStore.get).toHaveBeenCalledWith('budgetLimit');
    });

    it('should return undefined when not set', () => {
      vi.mocked(configStore.get).mockReturnValue(undefined);

      const result = manager.getBudgetLimit();

      expect(result).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all config', () => {
      manager.clear();

      expect(configStore.clear).toHaveBeenCalled();
    });
  });

  describe('getConfigPath', () => {
    it('should return config file path', () => {
      vi.mocked(configStore.getPath).mockReturnValue('/path/to/config');

      const result = manager.getConfigPath();

      expect(result).toBe('/path/to/config');
      expect(configStore.getPath).toHaveBeenCalled();
    });
  });
});
