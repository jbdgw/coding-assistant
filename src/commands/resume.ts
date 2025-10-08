/**
 * Resume command - Resume a previous chat session
 */

import { Command } from 'commander';
import { SessionManager } from '../lib/session-manager.js';
import { MastraChatLoop } from '../lib/chat-loop-mastra.js';
import { configManager } from '../lib/config.js';
import { Display } from '../utils/display.js';

export function resumeCommand() {
  const command = new Command('resume');

  command
    .description('Resume a previous chat session')
    .argument('<session-id>', 'ID of the session to resume')
    .action(async (sessionId: string) => {
      const sessionManager = new SessionManager();

      try {
        // Verify session exists
        const session = sessionManager.getSession(sessionId);
        if (!session) {
          Display.error(`Session not found: ${sessionId}`);
          Display.info('Use "my-cli sessions" to list available sessions');
          process.exit(1);
        }

        // Get model from config
        const model = configManager.getDefaultModel();

        // Create chat loop with existing session
        const chatLoop = new MastraChatLoop({
          model,
          sessionId,
        });

        chatLoop.start();
      } catch (error) {
        Display.error(
          `Failed to resume session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        process.exit(1);
      } finally {
        sessionManager.close();
      }
    });

  return command;
}
