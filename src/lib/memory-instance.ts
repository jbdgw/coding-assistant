/**
 * Shared Mastra Memory instance for persistent conversation storage
 */

import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';
import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * Get the memory database path (in user's config directory)
 */
function getMemoryDbPath(): string {
  const configDir = path.join(os.homedir(), '.config', 'ai-coding-cli-nodejs');

  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  return path.join(configDir, 'memory.db');
}

/**
 * Create and configure Mastra Memory instance
 */
export function createMemory(): Memory {
  const dbPath = getMemoryDbPath();
  const dbUrl = `file:${dbPath}`;

  // Semantic recall requires a separate OpenAI API key (not OpenRouter)
  // For now, we'll disable it and rely on conversation history + working memory
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  const memory = new Memory({
    storage: new LibSQLStore({ url: dbUrl }),
    vector: hasOpenAIKey ? new LibSQLVector({ connectionUrl: dbUrl }) : false,
    embedder: hasOpenAIKey ? openai.embedding('text-embedding-3-small') : undefined,
    options: {
      lastMessages: 20,
      semanticRecall: hasOpenAIKey
        ? {
            topK: 5,
            messageRange: 3,
            scope: 'resource', // Cross-session recall
          }
        : false,
      workingMemory: {
        enabled: true,
        scope: 'resource', // Persistent user profile across all sessions
        template: `# User Profile

## Personal Information
- **Name**:
- **Role/Occupation**:

## Coding Preferences
- **Preferred Languages**:
- **Coding Style**: [e.g., functional, OOP, strict typing]
- **Code Conventions**: [e.g., 2 spaces, semicolons, immutable]
- **Favorite Tools/Frameworks**:

## Current Projects
- **Active Projects**:
- **Tech Stack**:

## Learning & Goals
- **Current Learning**:
- **Goals**:

## Common Mistakes to Avoid
- **Known Issues**:

## Important Notes
- **Context**:
`,
      },
      threads: {
        generateTitle: true,
      },
    },
  });

  return memory;
}

/**
 * Singleton memory instance
 */
let memoryInstance: Memory | null = null;

/**
 * Get shared memory instance
 */
export function getMemory(): Memory {
  if (!memoryInstance) {
    memoryInstance = createMemory();
  }
  return memoryInstance;
}

/**
 * Get database file path for debugging
 */
export function getMemoryDbFilePath(): string {
  return getMemoryDbPath();
}
