import { Command } from 'commander';
import type { Tool } from '@mastra/core';

/**
 * Plugin hook types for extending CLI behavior
 */
export interface PluginHooks {
  'before-commit'?: () => Promise<void>;
  'after-test'?: (results: TestResults) => Promise<void>;
  'before-chat'?: (message: string) => Promise<string>;
  'after-response'?: (response: string) => Promise<string>;
  'on-error'?: (error: Error) => Promise<void>;
}

/**
 * MCP Server configuration for plugins
 */
export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Test results interface
 */
export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

/**
 * Plugin interface definition
 */
export interface Plugin {
  /** Unique plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin description */
  description?: string;

  /** Plugin author */
  author?: string;

  /** Mastra tools provided by the plugin */
  tools?: Tool[];

  /** Commander commands provided by the plugin */
  commands?: Command[];

  /** Event hooks */
  hooks?: PluginHooks;

  /** MCP servers to register */
  mcpServers?: MCPServerConfig[];

  /** Plugin initialization function */
  init?: () => Promise<void>;

  /** Plugin cleanup function */
  cleanup?: () => Promise<void>;
}

/**
 * Plugin metadata stored in registry
 */
export interface PluginMetadata {
  name: string;
  version: string;
  path: string;
  enabled: boolean;
  installedAt: string;
  updatedAt?: string;
}

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
  pluginsDir: string;
  autoLoad?: boolean;
  verbose?: boolean;
}
