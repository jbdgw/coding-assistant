import Conf from 'conf';
import { z } from 'zod';

// Configuration schema
const _configSchema = z.object({
  openrouterApiKey: z.string().optional(),
  e2bApiKey: z.string().optional(),
  defaultModel: z.string().default('anthropic/claude-3.5-sonnet'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4000),
  budgetLimit: z.number().positive().optional(),
});

export type ConfigType = z.infer<typeof _configSchema>;

class ConfigStore {
  private store: Conf<ConfigType>;

  constructor() {
    this.store = new Conf<ConfigType>({
      projectName: 'ai-coding-cli',
      schema: {
        openrouterApiKey: {
          type: 'string',
        },
        e2bApiKey: {
          type: 'string',
        },
        defaultModel: {
          type: 'string',
          default: 'anthropic/claude-3.5-sonnet',
        },
        temperature: {
          type: 'number',
          default: 0.7,
          minimum: 0,
          maximum: 2,
        },
        maxTokens: {
          type: 'number',
          default: 4000,
        },
        budgetLimit: {
          type: 'number',
        },
      },
    });
  }

  get<K extends keyof ConfigType>(key: K): ConfigType[K] | undefined {
    return this.store.get(key);
  }

  set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
    this.store.set(key, value);
  }

  setAll(config: Partial<ConfigType>): void {
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined) {
        this.store.set(key as keyof ConfigType, value);
      }
    });
  }

  getAll(): ConfigType {
    return this.store.store;
  }

  has(key: keyof ConfigType): boolean {
    return this.store.has(key);
  }

  delete(key: keyof ConfigType): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getPath(): string {
    return this.store.path;
  }
}

export const configStore = new ConfigStore();
