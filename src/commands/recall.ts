/**
 * Recall command - Search past sessions and conversations
 */

import { Command } from 'commander';
import { SessionManager } from '../lib/session-manager.js';
import { getMemory } from '../lib/memory-instance.js';
import chalk from 'chalk';
import { Display } from '../utils/display.js';
import os from 'os';

/**
 * Get resource ID (same as in chat loop)
 */
function getResourceId(): string {
  return `user-${os.hostname()}`;
}

export function recallCommand() {
  const command = new Command('recall');

  command
    .description('Search past conversations and retrieve relevant information')
    .argument('<query>', 'Search query')
    .option('-l, --limit <number>', 'Number of results to show', '10')
    .option('--semantic', 'Use semantic search (requires Ollama)', false)
    .action(async (query: string, options) => {
      const sessionManager = new SessionManager();
      const memory = getMemory();

      try {
        const limit = parseInt(options.limit, 10);

        if (options.semantic) {
          // Semantic search using Mastra Memory
          if (!process.env.OLLAMA_BASE_URL) {
            Display.warning('Semantic search requires Ollama to be configured');
            Display.info('Falling back to text search...\n');
          } else {
            await performSemanticSearch(query, limit, memory);
            return;
          }
        }

        // Text-based search in sessions
        const sessions = sessionManager.searchSessions(query, limit);

        if (sessions.length === 0) {
          console.log(chalk.yellow(`\nNo sessions found matching: "${query}"\n`));
          return;
        }

        console.log(chalk.bold.cyan(`\n🔍 Found ${sessions.length} session(s) matching "${query}":\n`));

        for (const session of sessions) {
          const title = session.title || chalk.dim('Untitled');
          const startedAt = session.startedAt.toLocaleString();
          const messageCount = chalk.dim(`${session.messageCount} msgs`);

          console.log(`${chalk.bold(session.id)} - ${title}`);
          console.log(chalk.dim(`   ${startedAt} | ${messageCount}`));

          if (session.summary) {
            console.log(
              chalk.dim(`   ${session.summary.substring(0, 150)}${session.summary.length > 150 ? '...' : ''}`),
            );
          }

          console.log();
        }

        console.log(chalk.gray('Resume a session: ') + chalk.cyan('my-cli resume <session-id>\n'));
      } catch (error) {
        Display.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      } finally {
        sessionManager.close();
      }
    });

  return command;
}

/**
 * Perform semantic search using Mastra Memory
 */
async function performSemanticSearch(query: string, limit: number, memory: any) {
  try {
    const resourceId = getResourceId();

    // Get all threads for this resource
    const threads = await memory.getThreadsByResourceId({ resourceId });

    if (threads.length === 0) {
      console.log(chalk.yellow('\nNo conversation history found.\n'));
      return;
    }

    console.log(chalk.bold.cyan(`\n🔍 Semantic search for: "${query}"\n`));
    console.log(chalk.dim(`Searching across ${threads.length} conversation(s)...\n`));

    // Search each thread
    const results: any[] = [];
    for (const thread of threads.slice(0, 5)) {
      // Limit to last 5 threads
      try {
        const queryResult = await memory.query({
          threadId: thread.id,
          selectBy: {
            vectorSearchString: query,
          },
          threadConfig: {
            semanticRecall: {
              topK: 3,
              messageRange: 1,
            },
          },
        });

        if (queryResult.messages && queryResult.messages.length > 0) {
          results.push({
            thread,
            messages: queryResult.messages,
          });
        }
      } catch (err) {
        // Skip threads with errors
        continue;
      }
    }

    if (results.length === 0) {
      console.log(chalk.yellow(`No relevant messages found.\n`));
      return;
    }

    // Display results
    for (const result of results.slice(0, limit)) {
      console.log(chalk.bold(`Thread: ${result.thread.title || result.thread.id}`));
      console.log(chalk.dim(`Created: ${new Date(result.thread.createdAt).toLocaleString()}\n`));

      for (const message of result.messages.slice(0, 3)) {
        const role = message.role === 'user' ? chalk.blue('User') : chalk.green('Assistant');
        const content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content);
        const preview = content.substring(0, 200) + (content.length > 200 ? '...' : '');

        console.log(`${role}: ${chalk.white(preview)}`);
        console.log();
      }

      console.log(chalk.dim('─'.repeat(80)));
      console.log();
    }
  } catch (error) {
    Display.error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
