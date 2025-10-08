/**
 * Mastra documentation tools - Access Mastra docs, examples, and blog
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * Search Mastra documentation
 */
export const mastraDocsTool = createTool({
  id: 'search_mastra_docs',
  description:
    'Search Mastra.ai documentation for information about features, APIs, and guides. Use this when the user asks about Mastra capabilities, integration, or how to use Mastra features.',
  inputSchema: z.object({
    paths: z
      .array(z.string())
      .describe(
        'Documentation paths to fetch (e.g., ["memory/", "agents/"]). Common paths: memory/, agents/, workflows/, tools-mcp/, rag/, evals/'
      ),
    keywords: z.array(z.string()).optional().describe('Keywords to search for in the documentation'),
  }),
  execute: async ({ context }) => {
    try {
      const { paths, keywords } = context;

      // This will be executed by the MCP server
      // For now, return a message indicating the tool should use MCP
      return {
        content: `Searching Mastra docs for paths: ${paths.join(', ')}${keywords ? ` with keywords: ${keywords.join(', ')}` : ''}`,
        paths,
        keywords,
      };
    } catch (error) {
      return {
        error: `Failed to search Mastra docs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Get Mastra code examples
 */
export const mastraExamplesTool = createTool({
  id: 'get_mastra_examples',
  description:
    'Get code examples from Mastra.ai. Use this when the user wants to see example implementations or needs starter code for Mastra features.',
  inputSchema: z.object({
    example: z
      .string()
      .optional()
      .describe(
        'Specific example name to fetch. If not provided, lists all available examples. Examples include: memory-with-libsql, agent, workflow-with-memory, etc.'
      ),
    keywords: z.array(z.string()).optional().describe('Keywords to search for in examples'),
  }),
  execute: async ({ context }) => {
    try {
      const { example, keywords } = context;

      return {
        content: `Fetching Mastra examples${example ? `: ${example}` : ''}${keywords ? ` with keywords: ${keywords.join(', ')}` : ''}`,
        example,
        keywords,
      };
    } catch (error) {
      return {
        error: `Failed to get Mastra examples: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Search Ref documentation (general web docs)
 */
export const refDocsTool = createTool({
  id: 'search_ref_docs',
  description:
    'Search for documentation from public sources (web, GitHub) or private resources. Use this for non-Mastra documentation like Next.js, React, TypeScript, etc.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Search query. Should include programming language and framework/library names (e.g., "Next.js 14 app router", "React hooks useEffect")'
      ),
  }),
  execute: async ({ context }) => {
    try {
      const { query } = context;

      return {
        content: `Searching documentation for: ${query}`,
        query,
      };
    } catch (error) {
      return {
        error: `Failed to search documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
