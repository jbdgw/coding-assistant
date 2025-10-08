import { createTool } from '@mastra/core';
import { z } from 'zod';
import { CodebaseRetrieval } from '../../lib/retrieval.js';

/**
 * RAG search tool for retrieving relevant code snippets from indexed projects
 */
export const ragSearchTool = createTool({
  id: 'search_indexed_code',
  description:
    'Search through indexed codebases to find relevant code snippets. ' +
    'Use this when the user asks about patterns, examples, or code from their past projects. ' +
    'This tool searches local indexed projects and returns relevant code with file paths and context.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The search query. Describe what code or pattern you are looking for. Be specific about the programming language, framework, or concepts.'
      ),
    collection: z
      .string()
      .optional()
      .default('default')
      .describe('The name of the collection to search. Use "default" if not specified.'),
    topK: z.number().optional().default(5).describe('Number of results to return (default: 5, max: 20)'),
    minScore: z.number().optional().default(0.6).describe('Minimum similarity score threshold (0-1, default: 0.6)'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        filePath: z.string().describe('Relative path to the file'),
        language: z.string().describe('Programming language'),
        code: z.string().describe('The code snippet'),
        score: z.number().describe('Similarity score (0-1)'),
      })
    ),
    context: z.string().describe('Formatted context string for LLM consumption'),
    message: z.string().describe('Human-readable message'),
  }),
  execute: async ({ context: { query, collection, topK, minScore } }) => {
    try {
      // Limit topK to prevent excessive token usage
      const limitedTopK = Math.min(topK || 5, 20);

      // Initialize retrieval
      const retrieval = new CodebaseRetrieval({ collectionName: collection || 'default' });

      // Check if collection exists
      const exists = await retrieval.collectionExists();
      if (!exists) {
        return {
          results: [],
          context: '',
          message: `Collection "${collection}" does not exist. Ask the user to index a codebase first with the 'index' command.`,
        };
      }

      // Perform search
      const results = await retrieval.retrieve(query, {
        topK: limitedTopK,
        minScore: minScore || 0.6,
      });

      if (results.length === 0) {
        return {
          results: [],
          context: '',
          message: 'No relevant code snippets found in indexed projects.',
        };
      }

      // Format results
      const formattedResults = results.map(r => ({
        filePath: r.metadata.filePath,
        language: r.metadata.language || 'unknown',
        code: r.metadata.text,
        score: r.score,
      }));

      // Generate context string
      const context = await retrieval.retrieveAsContext(query, {
        topK: limitedTopK,
        minScore: minScore || 0.6,
      });

      return {
        results: formattedResults,
        context,
        message: `Found ${results.length} relevant code snippet(s) from indexed projects.`,
      };
    } catch (error) {
      return {
        results: [],
        context: '',
        message: `Error searching indexed code: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
