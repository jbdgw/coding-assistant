/**
 * Strategy command - View and configure routing strategies
 */

import { getRoutingTableForStrategy } from '../config/routing-config.js';
import { Display } from '../utils/display.js';
import { TaskComplexity, type RoutingStrategy } from '../types/routing.js';
import chalk from 'chalk';

export interface StrategyCommandOptions {
  strategy?: RoutingStrategy;
}

export function strategyCommand(options: StrategyCommandOptions = {}): void {
  const { strategy } = options;

  // If strategy is provided, show details for that strategy
  if (strategy) {
    if (!['cost', 'performance', 'balanced'].includes(strategy)) {
      Display.error(`Invalid strategy: ${strategy}. Must be one of: cost, performance, balanced`);
      return;
    }

    Display.header(`Routing Strategy: ${strategy.toUpperCase()}`);
    displayRoutingTable(strategy);
  } else {
    // Show overview of all strategies
    Display.header('Routing Strategies');

    console.log(chalk.bold('\n📋 Available Strategies:\n'));

    console.log(chalk.cyan('1. cost') + ' - Minimize API costs');
    console.log('   Prioritizes cheaper models for all complexity levels');
    console.log('   Best for: High-volume usage, budget-conscious scenarios\n');

    console.log(chalk.cyan('2. performance') + ' - Maximize response quality');
    console.log('   Prioritizes more powerful (expensive) models');
    console.log('   Best for: Critical tasks, maximum accuracy needed\n');

    console.log(chalk.cyan('3. balanced') + ' (default) - Balance cost and performance');
    console.log('   Carefully selected models for each complexity level');
    console.log('   Best for: General use, reasonable costs with good quality\n');

    console.log(chalk.dim('Use `strategy show <name>` to see routing details'));
    console.log(chalk.dim('Use `chat --strategy <name>` to use a specific strategy\n'));
  }
}

function displayRoutingTable(strategy: RoutingStrategy): void {
  const routingTable = getRoutingTableForStrategy(strategy);

  console.log(chalk.dim(`\nThis strategy determines which models are selected for different task complexities.\n`));

  const complexities: TaskComplexity[] = [TaskComplexity.SIMPLE, TaskComplexity.MODERATE, TaskComplexity.COMPLEX];

  for (const complexity of complexities) {
    const candidates = routingTable[complexity];

    console.log(chalk.bold(`\n${complexity}:`));

    if (!candidates || candidates.length === 0) {
      console.log(chalk.dim('  No models configured'));
      continue;
    }

    // Sort by priority
    const sorted = [...candidates].sort((a, b) => a.priority - b.priority);

    sorted.forEach((candidate, index) => {
      const isPrimary = index === 0;
      const prefix = isPrimary ? chalk.green('  ●') : chalk.yellow('  ○');
      const label = isPrimary ? ' (primary)' : ' (fallback)';

      console.log(`${prefix} ${candidate.model.padEnd(30)} $${candidate.cost.toFixed(2)}/1M tokens${chalk.dim(label)}`);
    });
  }

  console.log();
}

/**
 * Show strategy details subcommand
 */
export function showStrategyCommand(strategyName: string): void {
  if (!['cost', 'performance', 'balanced'].includes(strategyName)) {
    Display.error(`Invalid strategy: ${strategyName}. Must be one of: cost, performance, balanced`);
    return;
  }

  strategyCommand({ strategy: strategyName as RoutingStrategy });
}
