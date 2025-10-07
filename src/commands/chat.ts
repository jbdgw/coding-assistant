import { configManager } from '../lib/config.js';
import { OpenRouterClient } from '../lib/openrouter.js';
import { ChatLoop } from '../lib/chat-loop.js';
import { Display } from '../utils/display.js';

export interface ChatCommandOptions {
  model?: string;
}

export function chatCommand(options: ChatCommandOptions): void {
  // Check if API key is configured
  if (!configManager.hasApiKey()) {
    Display.error('API key not configured. Please run: my-cli init');
    process.exit(1);
  }

  const apiKey = configManager.getApiKey()!;
  const model = options.model || configManager.getDefaultModel();

  // Create OpenRouter client
  const client = new OpenRouterClient(apiKey);

  // Start chat loop
  const chatLoop = new ChatLoop({
    model,
    openRouterClient: client,
  });

  chatLoop.start();
}
