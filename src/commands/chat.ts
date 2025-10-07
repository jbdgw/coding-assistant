import { configManager } from '../lib/config.js';
import { MastraChatLoop } from '../lib/chat-loop-mastra.js';
import { Display } from '../utils/display.js';
import type { RoutingStrategy } from '../types/routing.js';

export interface ChatCommandOptions {
  model?: string;
  strategy?: RoutingStrategy;
  budgetLimit?: number;
}

export function chatCommand(options: ChatCommandOptions): void {
  // Check for API key in environment first, then config
  const apiKey = process.env.OPENROUTER_API_KEY || configManager.getApiKey();

  if (!apiKey) {
    Display.error('API key not configured. Please run: my-cli init or set OPENROUTER_API_KEY in .env');
    process.exit(1);
  }

  // If model is specified, use it; otherwise use smart routing
  const model = options.model || process.env.DEFAULT_MODEL || configManager.getDefaultModel();
  const useSmartRouting = !options.model; // Only use smart routing if no specific model requested

  // Start Mastra chat loop with routing options
  const chatLoop = new MastraChatLoop({
    model,
    useSmartRouting,
    strategy: options.strategy,
    budgetLimit: options.budgetLimit,
  });

  chatLoop.start();
}
