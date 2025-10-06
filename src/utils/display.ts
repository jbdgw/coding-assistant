import chalk from 'chalk';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import hljs from 'highlight.js';

// Configure marked to use terminal renderer
marked.setOptions({
  renderer: new TerminalRenderer({
    code: (code: string, lang?: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(code, { language: lang }).value;
          return chalk.cyan('```' + lang + '\n') + highlighted + chalk.cyan('\n```\n');
        } catch (e) {
          return chalk.cyan('```\n') + code + chalk.cyan('\n```\n');
        }
      }
      return chalk.cyan('```\n') + code + chalk.cyan('\n```\n');
    },
  }),
});

export class Display {
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  static header(title: string): void {
    console.log();
    console.log(chalk.bold.cyan('═'.repeat(title.length + 4)));
    console.log(chalk.bold.cyan(`  ${title}  `));
    console.log(chalk.bold.cyan('═'.repeat(title.length + 4)));
    console.log();
  }

  static section(title: string): void {
    console.log();
    console.log(chalk.bold.white(title));
    console.log(chalk.gray('─'.repeat(title.length)));
  }

  static markdown(content: string): void {
    console.log(marked(content));
  }

  static modelPrompt(model: string): string {
    return chalk.cyan(`[${model}]`) + chalk.white(' > ');
  }

  static assistant(content: string): void {
    console.log();
    console.log(chalk.green('Assistant:'));
    this.markdown(content);
    console.log();
  }

  static usage(promptTokens: number, completionTokens: number, cost: number): void {
    const usageStr = chalk.gray(
      `Tokens: ${promptTokens} in, ${completionTokens} out | Cost: $${cost.toFixed(4)}`
    );
    console.log(usageStr);
  }

  static sessionSummary(messageCount: number, totalCost: number): void {
    console.log();
    this.section('Session Summary');
    console.log(chalk.white(`  Messages: ${chalk.cyan(messageCount.toString())}`));
    console.log(chalk.white(`  Total Cost: ${chalk.green('$' + totalCost.toFixed(4))}`));
    console.log();
  }

  static modelList(models: Array<{ id: string; name: string; pricing: { prompt: string; completion: string } }>): void {
    console.log();
    console.log(chalk.bold('Available Models:'));
    console.log();

    models.forEach(model => {
      console.log(chalk.cyan(`  ${model.id}`));
      console.log(chalk.gray(`    Name: ${model.name}`));
      console.log(
        chalk.gray(`    Pricing: $${model.pricing.prompt}/M prompt, $${model.pricing.completion}/M completion`)
      );
      console.log();
    });
  }

  static commands(): void {
    this.section('Available Commands');
    const commands = [
      { cmd: '/model <model-name>', desc: 'Switch to a different model' },
      { cmd: '/models', desc: 'Show available models' },
      { cmd: '/clear', desc: 'Clear conversation history' },
      { cmd: '/cost', desc: 'Show session cost summary' },
      { cmd: '/help', desc: 'Show this help message' },
      { cmd: '/exit', desc: 'End the chat session' },
    ];

    commands.forEach(({ cmd, desc }) => {
      console.log(`  ${chalk.cyan(cmd).padEnd(30)} ${chalk.gray(desc)}`);
    });
    console.log();
  }

  static clear(): void {
    console.clear();
  }

  static newline(): void {
    console.log();
  }
}
