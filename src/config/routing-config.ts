/**
 * Default routing configuration
 * Maps task complexity to model candidates with priorities and costs
 */

import { TaskComplexity, type RoutingConfig } from '../types/routing.js';

/**
 * Default routing table
 * Models are listed in priority order (lower priority number = preferred)
 * Costs are per 1M tokens (average of prompt + completion)
 */
export const DEFAULT_ROUTING_TABLE: RoutingConfig = {
  [TaskComplexity.SIMPLE]: [
    {
      model: 'openai/gpt-4o-mini',
      cost: 0.375, // (0.15 + 0.6) / 2
      priority: 1,
    },
    {
      model: 'anthropic/claude-3-5-haiku',
      cost: 3, // (1 + 5) / 2
      priority: 2,
    },
  ],

  [TaskComplexity.MODERATE]: [
    {
      model: 'openai/gpt-4o',
      cost: 10, // (5 + 15) / 2
      priority: 1,
    },
    {
      model: 'anthropic/claude-3.5-sonnet',
      cost: 9, // (3 + 15) / 2
      priority: 2,
    },
  ],

  [TaskComplexity.COMPLEX]: [
    {
      model: 'anthropic/claude-sonnet-4-5',
      cost: 9, // (3 + 15) / 2
      priority: 1,
    },
    {
      model: 'openai/gpt-4o',
      cost: 10, // (5 + 15) / 2
      priority: 2,
    },
    {
      model: 'anthropic/claude-3-opus',
      cost: 45, // (15 + 75) / 2
      priority: 3,
    },
  ],
};

/**
 * Strategy-specific adjustments to routing table
 */
export function getRoutingTableForStrategy(strategy: 'cost' | 'performance' | 'balanced'): RoutingConfig {
  const table = JSON.parse(JSON.stringify(DEFAULT_ROUTING_TABLE)) as RoutingConfig;

  switch (strategy) {
    case 'cost':
      // Prefer cheaper models - sort by cost ascending
      for (const complexity of Object.keys(table) as TaskComplexity[]) {
        table[complexity].sort((a, b) => a.cost - b.cost);
        // Reassign priorities
        table[complexity].forEach((candidate, index) => {
          candidate.priority = index + 1;
        });
      }
      break;

    case 'performance':
      // Prefer more expensive (usually better) models
      for (const complexity of Object.keys(table) as TaskComplexity[]) {
        table[complexity].sort((a, b) => b.cost - a.cost);
        // Reassign priorities
        table[complexity].forEach((candidate, index) => {
          candidate.priority = index + 1;
        });
      }
      break;

    case 'balanced':
    default:
      // Use default priorities (already balanced)
      break;
  }

  return table;
}
