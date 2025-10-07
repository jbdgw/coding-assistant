import { configStore, ConfigType } from '../utils/storage.js';
import axios from 'axios';

export class ConfigManager {
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3.5-haiku',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      // Other errors might be network issues, consider them as potentially valid
      return true;
    }
  }

  setConfig(config: Partial<ConfigType>): void {
    configStore.setAll(config);
  }

  getConfig(): ConfigType {
    return configStore.getAll();
  }

  get<K extends keyof ConfigType>(key: K): ConfigType[K] | undefined {
    return configStore.get(key);
  }

  set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
    configStore.set(key, value);
  }

  hasApiKey(): boolean {
    const apiKey = configStore.get('openrouterApiKey');
    return !!apiKey && apiKey.length > 0;
  }

  getApiKey(): string | undefined {
    return configStore.get('openrouterApiKey');
  }

  getDefaultModel(): string {
    return configStore.get('defaultModel') || 'anthropic/claude-3.5-sonnet';
  }

  getBudgetLimit(): number | undefined {
    return configStore.get('budgetLimit');
  }

  clear(): void {
    configStore.clear();
  }

  getConfigPath(): string {
    return configStore.getPath();
  }

  // E2B API Key methods
  hasE2BApiKey(): boolean {
    const apiKey = configStore.get('e2bApiKey');
    return !!apiKey && apiKey.length > 0;
  }

  getE2BApiKey(): string | undefined {
    return configStore.get('e2bApiKey');
  }

  setE2BApiKey(apiKey: string): void {
    configStore.set('e2bApiKey', apiKey);
  }
}

export const configManager = new ConfigManager();
