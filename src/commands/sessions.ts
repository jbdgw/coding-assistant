/**
 * Sessions command - List recent chat sessions
 */

import { Command } from 'commander';
import { SessionManager } from '../lib/session-manager.js';
import chalk from 'chalk';

export function sessionsCommand() {
  const command = new Command('sessions');

  command
    .description('List recent chat sessions')
    .option('-l, --limit <number>', 'Number of sessions to show', '20')
    .option('-s, --search <query>', 'Search sessions by title or content')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .action(async options => {
      const sessionManager = new SessionManager();

      try {
        const limit = parseInt(options.limit, 10);
        const search = options.search;
        const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined;

        const sessions = sessionManager.listSessions({
          limit,
          search,
          tags,
        });

        if (sessions.length === 0) {
          console.log(chalk.yellow('\nNo sessions found.'));
          console.log(chalk.dim('Start a new chat with: my-cli chat\n'));
          return;
        }

        console.log(chalk.bold.cyan('\n📚 Recent Sessions:\n'));

        for (const session of sessions) {
          const isActive = !session.endedAt;
          const statusIcon = isActive ? chalk.green('●') : chalk.dim('○');
          const title = session.title || chalk.dim('Untitled');
          const messageCount = chalk.dim(`${session.messageCount} msgs`);
          const cost = chalk.dim(`$${session.totalCost.toFixed(4)}`);
          const startedAt = session.startedAt.toLocaleString();

          console.log(`${statusIcon} ${chalk.bold(session.id)} - ${title}`);
          console.log(
            chalk.dim(`   ${startedAt} | ${messageCount} | ${cost}` + (isActive ? chalk.green(' [Active]') : ''))
          );

          if (session.summary) {
            console.log(
              chalk.dim(`   ${session.summary.substring(0, 100)}${session.summary.length > 100 ? '...' : ''}`)
            );
          }

          if (session.tags && session.tags.length > 0) {
            console.log(chalk.dim(`   Tags: ${session.tags.join(', ')}`));
          }

          console.log();
        }

        const totalCount = sessionManager.getSessionCount({ search, tags });
        if (totalCount > sessions.length) {
          console.log(chalk.dim(`Showing ${sessions.length} of ${totalCount} sessions`));
          console.log(chalk.dim(`Use --limit to see more\n`));
        }

        console.log(chalk.gray('Resume a session: ') + chalk.cyan('my-cli resume <session-id>'));
        console.log(chalk.gray('Delete a session: ') + chalk.cyan('my-cli forget <session-id>\n'));
      } finally {
        sessionManager.close();
      }
    });

  return command;
}
