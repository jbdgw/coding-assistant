import { configManager } from '../lib/config.js';
import { MastraChatLoop } from '../lib/chat-loop-mastra.js';
import { Display } from '../utils/display.js';

export interface ChatCommandOptions {
  model?: string;
}

export function chatCommand(options: ChatCommandOptions): void {
  // Check for API key in environment first, then config
  const apiKey = process.env.OPENROUTER_API_KEY || configManager.getApiKey();

  if (!apiKey) {
    Display.error('API key not configured. Please run: my-cli init or set OPENROUTER_API_KEY in .env');
    process.exit(1);
  }

  const model = options.model || process.env.DEFAULT_MODEL || configManager.getDefaultModel();

  // Start Mastra chat loop with E2B tools
  const chatLoop = new MastraChatLoop({
    model,
  });

  chatLoop.start();
}
