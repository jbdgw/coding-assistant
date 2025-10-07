import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { E2BSandboxManager } from '../../lib/e2b-sandbox-manager.js';

/**
 * Execute Code Tool
 * Runs code in an E2B sandbox and returns the results
 */
export const executeCodeTool = createTool({
  id: 'execute_code',
  description: `Execute code in a secure E2B sandbox environment.

  Use this tool when:
  - The user asks you to run, execute, or test code
  - You want to verify code functionality
  - The user wants to see the output of code
  - You need to test a solution before presenting it

  Supports Python, JavaScript, and TypeScript code execution.
  The sandbox persists across multiple executions in the same session, so you can build upon previous code.`,

  inputSchema: z.object({
    code: z.string().describe('The code to execute'),
    language: z
      .enum(['python', 'javascript', 'typescript'])
      .default('python')
      .describe('The programming language of the code'),
  }),

  outputSchema: z.object({
    stdout: z.string().describe('Standard output from the code execution'),
    stderr: z.string().describe('Standard error from the code execution'),
    error: z.string().optional().describe('Error message if execution failed'),
    results: z.array(z.record(z.unknown())).describe('Structured results from the execution (charts, data, etc.)'),
    exitCode: z.number().describe('Exit code: 0 for success, 1 for error'),
  }),

  execute: async ({ context }) => {
    const { code, language } = context;

    // Check if E2B API key is configured
    const e2bApiKey = process.env.E2B_API_KEY;
    if (!e2bApiKey) {
      return {
        stdout: '',
        stderr: '',
        error: 'E2B_API_KEY not configured. Please set up E2B in your environment or run the init command.',
        results: [],
        exitCode: 1,
      };
    }

    try {
      // Get or create sandbox manager
      const timeout = parseInt(process.env.E2B_TIMEOUT_MS || '300000', 10);
      const sandboxManager = E2BSandboxManager.getInstance({
        apiKey: e2bApiKey,
        timeoutMs: timeout,
        autoCleanup: process.env.E2B_AUTO_CLEANUP !== 'false',
      });

      // Execute the code
      const result = await sandboxManager.executeCode(code, language);

      // Determine exit code based on whether there was an error
      const exitCode = result.error ? 1 : 0;

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error,
        results: result.results,
        exitCode,
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : 'Unknown error during code execution',
        results: [],
        exitCode: 1,
      };
    }
  },
});
