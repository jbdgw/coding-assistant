import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Plugin, PluginLoaderOptions } from '../../types/plugin.js';
import { PluginRegistry } from './plugin-registry.js';
import { HookSystem } from './hook-system.js';

/**
 * Plugin loader for dynamic plugin loading
 */
export class PluginLoader {
  private registry: PluginRegistry;
  private hookSystem: HookSystem;
  private pluginsDir: string;
  private verbose: boolean;

  constructor(options: PluginLoaderOptions, registry: PluginRegistry, hookSystem: HookSystem) {
    this.pluginsDir = options.pluginsDir;
    this.verbose = options.verbose ?? false;
    this.registry = registry;
    this.hookSystem = hookSystem;
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadAll(): Promise<void> {
    try {
      await fs.mkdir(this.pluginsDir, { recursive: true });

      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
      const pluginDirs = entries.filter(entry => entry.isDirectory());

      for (const pluginDir of pluginDirs) {
        await this.loadPlugin(pluginDir.name);
      }

      if (this.verbose) {
        console.log(`Loaded ${this.registry.listAll().length} plugins`);
      }
    } catch (error) {
      if (this.verbose) {
        console.error('Failed to load plugins:', error);
      }
    }
  }

  /**
   * Load a single plugin by name
   */
  async loadPlugin(pluginName: string): Promise<Plugin | null> {
    const pluginPath = path.join(this.pluginsDir, pluginName);

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(pluginPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // Find the entry point
      const entryPoint = packageJson.main || 'index.js';
      const pluginModulePath = path.join(pluginPath, entryPoint);

      // Check if file exists
      await fs.access(pluginModulePath);

      // Dynamic import of the plugin
      const pluginModule = await this.importPlugin(pluginModulePath);

      if (!pluginModule?.default) {
        if (this.verbose) {
          console.warn(`Plugin ${pluginName} has no default export`);
        }
        return null;
      }

      const plugin = pluginModule.default;

      // Validate plugin structure
      if (!plugin.name || !plugin.version) {
        if (this.verbose) {
          console.warn(`Plugin ${pluginName} is missing required fields (name, version)`);
        }
        return null;
      }

      // Register the plugin
      await this.registry.register(plugin, pluginPath);

      // Register hooks
      if (plugin.hooks) {
        for (const [hookType, handler] of Object.entries(plugin.hooks)) {
          if (handler) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
            this.hookSystem.register(hookType as any, handler, plugin.name);
          }
        }
      }

      if (this.verbose) {
        console.log(`Loaded plugin: ${plugin.name}@${plugin.version}`);
      }

      return plugin;
    } catch (error) {
      if (this.verbose) {
        console.error(`Failed to load plugin ${pluginName}:`, error);
      }
      return null;
    }
  }

  /**
   * Import a plugin module (handles both ESM and CommonJS)
   */
  private async importPlugin(modulePath: string): Promise<{ default?: Plugin }> {
    const moduleUrl = pathToFileURL(modulePath).href;

    try {
      // Try ESM import first
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await import(moduleUrl);
    } catch (esmError) {
      // Fall back to CommonJS require (if applicable)
      try {
        if (modulePath.endsWith('.js')) {
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);

          // Use dynamic require for CommonJS
          const module = await import('module');
          const require = module.createRequire(__dirname);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const pluginExport = require(modulePath);
          return { default: pluginExport as Plugin };
        }
      } catch {
        if (this.verbose) {
          console.error('Failed to import plugin:', esmError);
        }
      }
      throw esmError;
    }
  }

  /**
   * Install a plugin from a package or directory
   */
  async installPlugin(source: string): Promise<void> {
    // For simplicity, we'll assume source is a local directory for now
    // In a full implementation, this would handle npm packages, git repos, etc.

    const pluginName = path.basename(source);
    const targetPath = path.join(this.pluginsDir, pluginName);

    try {
      // Copy plugin to plugins directory
      await this.copyDirectory(source, targetPath);

      // Load the plugin
      await this.loadPlugin(pluginName);

      if (this.verbose) {
        console.log(`Installed plugin: ${pluginName}`);
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Failed to install plugin from ${source}:`, error);
      }
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<void> {
    const metadata = this.registry.getMetadata(pluginName);

    if (!metadata) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Unregister from registry
    await this.registry.unregister(pluginName);

    // Remove plugin directory
    try {
      await fs.rm(metadata.path, { recursive: true, force: true });

      if (this.verbose) {
        console.log(`Uninstalled plugin: ${pluginName}`);
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Failed to remove plugin directory for ${pluginName}:`, error);
      }
      throw error;
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, target: string): Promise<void> {
    await fs.mkdir(target, { recursive: true });

    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * Reload all plugins
   */
  async reload(): Promise<void> {
    await this.registry.cleanupAll();
    this.hookSystem.clear();
    await this.loadAll();
  }
}
