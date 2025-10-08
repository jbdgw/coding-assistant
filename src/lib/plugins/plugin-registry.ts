import fs from 'fs/promises';
import path from 'path';
import { Plugin, PluginMetadata } from '../../types/plugin.js';

/**
 * Plugin registry for managing installed plugins
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private metadata: Map<string, PluginMetadata> = new Map();
  private registryPath: string;

  constructor(configDir: string) {
    this.registryPath = path.join(configDir, 'plugins', 'registry.json');
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin, pluginPath: string): Promise<void> {
    const metadata: PluginMetadata = {
      name: plugin.name,
      version: plugin.version,
      path: pluginPath,
      enabled: true,
      installedAt: new Date().toISOString(),
    };

    this.plugins.set(plugin.name, plugin);
    this.metadata.set(plugin.name, metadata);

    await this.saveRegistry();
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);

    if (plugin?.cleanup) {
      await plugin.cleanup();
    }

    this.plugins.delete(pluginName);
    this.metadata.delete(pluginName);

    await this.saveRegistry();
  }

  /**
   * Get a plugin by name
   */
  get(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Get plugin metadata
   */
  getMetadata(pluginName: string): PluginMetadata | undefined {
    return this.metadata.get(pluginName);
  }

  /**
   * List all registered plugins
   */
  listAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * List enabled plugins
   */
  listEnabled(): Plugin[] {
    return Array.from(this.plugins.entries())
      .filter(([name]) => this.metadata.get(name)?.enabled)
      .map(([, plugin]) => plugin);
  }

  /**
   * Enable a plugin
   */
  async enable(pluginName: string): Promise<void> {
    const meta = this.metadata.get(pluginName);
    if (meta) {
      meta.enabled = true;
      meta.updatedAt = new Date().toISOString();
      await this.saveRegistry();
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginName: string): Promise<void> {
    const meta = this.metadata.get(pluginName);
    if (meta) {
      meta.enabled = false;
      meta.updatedAt = new Date().toISOString();
      await this.saveRegistry();
    }
  }

  /**
   * Initialize all registered plugins
   */
  async initializeAll(): Promise<void> {
    const enabledPlugins = this.listEnabled();

    for (const plugin of enabledPlugins) {
      if (plugin.init) {
        try {
          await plugin.init();
        } catch (error) {
          console.error(`Failed to initialize plugin ${plugin.name}:`, error);
        }
      }
    }
  }

  /**
   * Cleanup all plugins
   */
  async cleanupAll(): Promise<void> {
    const allPlugins = this.listAll();

    for (const plugin of allPlugins) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup();
        } catch (error) {
          console.error(`Failed to cleanup plugin ${plugin.name}:`, error);
        }
      }
    }
  }

  /**
   * Load registry from disk
   */
  async loadRegistry(): Promise<void> {
    try {
      const data = await fs.readFile(this.registryPath, 'utf-8');
      const metadataArray = JSON.parse(data) as PluginMetadata[];

      for (const meta of metadataArray) {
        this.metadata.set(meta.name, meta);
      }
    } catch (error) {
      // Registry file doesn't exist yet, that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Save registry to disk
   */
  private async saveRegistry(): Promise<void> {
    const registryDir = path.dirname(this.registryPath);

    await fs.mkdir(registryDir, { recursive: true });

    const metadataArray = Array.from(this.metadata.values());
    await fs.writeFile(this.registryPath, JSON.stringify(metadataArray, null, 2), 'utf-8');
  }
}
