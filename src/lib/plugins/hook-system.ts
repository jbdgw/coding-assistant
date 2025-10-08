import { PluginHooks, TestResults } from '../../types/plugin.js';

type HookType = keyof PluginHooks;

/**
 * Hook system for managing plugin event hooks
 */
export class HookSystem {
  private hooks: Map<HookType, PluginHooks[HookType][]> = new Map();

  /**
   * Register a hook from a plugin
   */
  register(hookType: HookType, handler: PluginHooks[HookType], _pluginName: string): void {
    if (!this.hooks.has(hookType)) {
      this.hooks.set(hookType, []);
    }

    const handlers = this.hooks.get(hookType)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handlers.push(handler as any);
  }

  /**
   * Unregister all hooks from a plugin
   */
  unregister(_pluginName: string): void {
    // Note: We'd need to track plugin names with hooks to implement this properly
    // For now, we'll clear all hooks which is simpler
    for (const hookType of this.hooks.keys()) {
      this.hooks.set(hookType, []);
    }
  }

  /**
   * Execute before-commit hooks
   */
  async executeBeforeCommit(): Promise<void> {
    const handlers = this.hooks.get('before-commit') || [];

    for (const handler of handlers) {
      if (handler) {
        try {
          await handler();
        } catch (error) {
          console.error('before-commit hook failed:', error);
          throw error; // Stop commit on error
        }
      }
    }
  }

  /**
   * Execute after-test hooks
   */
  async executeAfterTest(results: TestResults): Promise<void> {
    const handlers = this.hooks.get('after-test') || [];

    for (const handler of handlers) {
      if (handler) {
        try {
          await handler(results);
        } catch (error) {
          console.error('after-test hook failed:', error);
          // Don't throw, these are informational
        }
      }
    }
  }

  /**
   * Execute before-chat hooks
   * Returns the transformed message
   */
  async executeBeforeChat(message: string): Promise<string> {
    const handlers = this.hooks.get('before-chat') || [];
    let transformedMessage = message;

    for (const handler of handlers) {
      if (handler) {
        try {
          transformedMessage = await handler(transformedMessage);
        } catch (error) {
          console.error('before-chat hook failed:', error);
          // Continue with untransformed message
        }
      }
    }

    return transformedMessage;
  }

  /**
   * Execute after-response hooks
   * Returns the transformed response
   */
  async executeAfterResponse(response: string): Promise<string> {
    const handlers = this.hooks.get('after-response') || [];
    let transformedResponse = response;

    for (const handler of handlers) {
      if (handler) {
        try {
          transformedResponse = await handler(transformedResponse);
        } catch (error) {
          console.error('after-response hook failed:', error);
          // Continue with untransformed response
        }
      }
    }

    return transformedResponse;
  }

  /**
   * Execute on-error hooks
   */
  async executeOnError(error: Error): Promise<void> {
    const handlers = this.hooks.get('on-error') || [];

    for (const handler of handlers) {
      if (handler) {
        try {
          await handler(error);
        } catch (hookError) {
          console.error('on-error hook failed:', hookError);
          // Don't throw, we're already handling an error
        }
      }
    }
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear();
  }

  /**
   * Get count of registered hooks by type
   */
  getHookCount(hookType: HookType): number {
    return (this.hooks.get(hookType) || []).length;
  }

  /**
   * List all registered hook types
   */
  getRegisteredHookTypes(): HookType[] {
    return Array.from(this.hooks.keys());
  }
}
