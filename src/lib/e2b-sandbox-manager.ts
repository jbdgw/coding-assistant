import { Sandbox } from '@e2b/code-interpreter';
import { Display } from '../utils/display.js';

export interface SandboxConfig {
  apiKey: string;
  timeoutMs?: number;
  autoCleanup?: boolean;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
  results: Array<{
    text?: string;
    html?: string;
    markdown?: string;
    svg?: string;
    png?: string;
    jpeg?: string;
    pdf?: string;
    latex?: string;
    json?: unknown;
    javascript?: string;
    [key: string]: unknown;
  }>;
}

/**
 * E2B Sandbox Manager - Handles sandbox lifecycle
 * Implements lazy loading and session-level singleton pattern
 */
export class E2BSandboxManager {
  private static instance: E2BSandboxManager | null = null;
  private sandbox: Sandbox | null = null;
  private config: SandboxConfig;
  private isInitializing: boolean = false;
  private lastActivityTime: number = Date.now();
  private extendTimeoutInterval: NodeJS.Timeout | null = null;

  private constructor(config: SandboxConfig) {
    this.config = {
      timeoutMs: config.timeoutMs || 300000, // 5 minutes default
      autoCleanup: config.autoCleanup !== false, // true by default
      apiKey: config.apiKey,
    };
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(config?: SandboxConfig): E2BSandboxManager {
    if (!E2BSandboxManager.instance) {
      if (!config) {
        throw new Error('Config required for first initialization');
      }
      E2BSandboxManager.instance = new E2BSandboxManager(config);
    }
    return E2BSandboxManager.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    E2BSandboxManager.instance = null;
  }

  /**
   * Initialize the sandbox (lazy loading)
   */
  private async initializeSandbox(): Promise<Sandbox> {
    if (this.sandbox) {
      return this.sandbox;
    }

    if (this.isInitializing) {
      // Wait for ongoing initialization
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.sandbox) {
        return this.sandbox;
      }
    }

    this.isInitializing = true;

    try {
      Display.info('Initializing E2B sandbox...');

      // Set the API key as environment variable for E2B SDK
      process.env.E2B_API_KEY = this.config.apiKey;

      this.sandbox = await Sandbox.create({
        timeoutMs: this.config.timeoutMs,
      });

      Display.success(`E2B sandbox created (ID: ${(await this.sandbox.getInfo()).sandboxId})`);

      // Start timeout extension interval to keep sandbox alive during session
      this.startTimeoutExtension();

      return this.sandbox;
    } catch (error) {
      Display.error(`Failed to initialize E2B sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Start automatic timeout extension to keep sandbox alive
   */
  private startTimeoutExtension(): void {
    if (this.extendTimeoutInterval) {
      return;
    }

    // Extend timeout every 2 minutes to keep sandbox alive
    this.extendTimeoutInterval = setInterval(() => {
      void (async () => {
        if (this.sandbox) {
          try {
            // Extend by the configured timeout
            await this.sandbox.setTimeout(this.config.timeoutMs!);
            this.lastActivityTime = Date.now();
          } catch (error) {
            Display.error(
              `Failed to extend sandbox timeout: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      })();
    }, 120000); // Every 2 minutes
  }

  /**
   * Stop automatic timeout extension
   */
  private stopTimeoutExtension(): void {
    if (this.extendTimeoutInterval) {
      clearInterval(this.extendTimeoutInterval);
      this.extendTimeoutInterval = null;
    }
  }

  /**
   * Execute code in the sandbox
   */
  async executeCode(
    code: string,
    language: 'python' | 'javascript' | 'typescript' = 'python'
  ): Promise<ExecutionResult> {
    const sandbox = await this.initializeSandbox();
    this.lastActivityTime = Date.now();

    try {
      let execution;

      if (language === 'python') {
        execution = await sandbox.runCode(code);
      } else {
        // For JavaScript/TypeScript, wrap in a function
        const wrappedCode = `
(async () => {
  ${code}
})();
`;
        execution = await sandbox.runCode(wrappedCode);
      }

      // Convert execution result to our format
      const result: ExecutionResult = {
        stdout: execution.logs.stdout.join('\n'),
        stderr: execution.logs.stderr.join('\n'),
        results: execution.results.map(r => ({
          text: r.text,
          html: r.html,
          markdown: r.markdown,
          svg: r.svg,
          png: r.png,
          jpeg: r.jpeg,
          pdf: r.pdf,
          latex: r.latex,
          json: r.json,
          javascript: r.javascript,
        })),
      };

      // Add error if execution failed
      if (execution.error) {
        result.error = `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`;
      }

      return result;
    } catch (error) {
      return {
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        results: [],
      };
    }
  }

  /**
   * Write a file to the sandbox
   */
  async writeFile(path: string, content: string): Promise<{ success: boolean; path: string; message: string }> {
    const sandbox = await this.initializeSandbox();
    this.lastActivityTime = Date.now();

    try {
      const result = await sandbox.files.write(path, content);
      return {
        success: true,
        path: result.path,
        message: `File written successfully to ${result.path}`,
      };
    } catch (error) {
      return {
        success: false,
        path,
        message: error instanceof Error ? error.message : 'Unknown error writing file',
      };
    }
  }

  /**
   * Write multiple files to the sandbox
   */
  async writeFiles(
    files: Array<{ path: string; data: string }>
  ): Promise<{ success: boolean; message: string; paths: string[] }> {
    const sandbox = await this.initializeSandbox();
    this.lastActivityTime = Date.now();

    try {
      await sandbox.files.write(files);
      return {
        success: true,
        message: `${files.length} files written successfully`,
        paths: files.map(f => f.path),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error writing files',
        paths: [],
      };
    }
  }

  /**
   * Read a file from the sandbox
   */
  async readFile(path: string): Promise<{ success: boolean; content?: string; message: string }> {
    const sandbox = await this.initializeSandbox();
    this.lastActivityTime = Date.now();

    try {
      const content = await sandbox.files.read(path);
      return {
        success: true,
        content,
        message: `File read successfully from ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error reading file',
      };
    }
  }

  /**
   * List files in the sandbox
   */
  async listFiles(path: string = '/'): Promise<{ success: boolean; files?: string[]; message: string }> {
    const sandbox = await this.initializeSandbox();
    this.lastActivityTime = Date.now();

    try {
      const files = await sandbox.files.list(path);
      return {
        success: true,
        files: files.map(f => f.name),
        message: `Listed ${files.length} files in ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error listing files',
      };
    }
  }

  /**
   * Get sandbox information
   */
  async getInfo(): Promise<{
    sandboxId?: string;
    templateId?: string;
    startedAt?: string;
    endAt?: string;
  }> {
    if (!this.sandbox) {
      return {};
    }

    try {
      const info = await this.sandbox.getInfo();
      return {
        sandboxId: info.sandboxId,
        templateId: info.templateId,
        startedAt: info.startedAt,
        endAt: info.endAt,
      };
    } catch {
      return {};
    }
  }

  /**
   * Check if sandbox is initialized
   */
  isInitialized(): boolean {
    return this.sandbox !== null;
  }

  /**
   * Clean up the sandbox
   */
  async cleanup(): Promise<void> {
    this.stopTimeoutExtension();

    if (this.sandbox) {
      try {
        Display.info('Cleaning up E2B sandbox...');
        await this.sandbox.kill();
        Display.success('E2B sandbox cleaned up successfully');
      } catch (error) {
        Display.error(`Error cleaning up sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        this.sandbox = null;
      }
    }

    E2BSandboxManager.instance = null;
  }
}
