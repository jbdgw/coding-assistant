/**
 * Forget command - Delete a chat session
 */

import { Command } from 'commander';
import { SessionManager } from '../lib/session-manager.js';
import { Display } from '../utils/display.js';
import inquirer from 'inquirer';

export function forgetCommand() {
  const command = new Command('forget');

  command
    .description('Delete a chat session')
    .argument('<session-id>', 'ID of the session to delete')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (sessionId: string, options) => {
      const sessionManager = new SessionManager();

      try {
        // Verify session exists
        const session = sessionManager.getSession(sessionId);
        if (!session) {
          Display.error(`Session not found: ${sessionId}`);
          Display.info('Use "my-cli sessions" to list available sessions');
          process.exit(1);
        }

        // Confirm deletion unless --yes flag is used
        if (!options.yes) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete session "${session.title || session.id}" (${session.messageCount} messages)?`,
              default: false,
            },
          ]);

          if (!answers.confirm) {
            Display.info('Deletion cancelled');
            return;
          }
        }

        // Delete the session
        sessionManager.deleteSession(sessionId);

        Display.success(`✓ Session deleted: ${sessionId}`);
        Display.info('Note: Mastra thread and messages remain in memory.db for reference');
      } catch (error) {
        Display.error(
          `Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        process.exit(1);
      } finally {
        sessionManager.close();
      }
    });

  return command;
}
