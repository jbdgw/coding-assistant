import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
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

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: `file:${getMemoryDbPath()}`,
  }),
  logger: new PinoLogger({
    name: 'AI-Coding-CLI',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
});
