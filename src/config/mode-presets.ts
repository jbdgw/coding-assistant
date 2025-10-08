import { AgentMode, ModePreset } from '../types/mode.js';

/**
 * Pre-defined agent mode configurations
 */
export const MODE_PRESETS: ModePreset = {
  [AgentMode.QUICK_FIX]: {
    name: 'quick-fix',
    description: 'Fast edits and small fixes using cost-effective models',
    model: 'openai/gpt-4o-mini',
    maxSteps: 3,
    verbosity: 'low',
    autoApply: true,
    budgetLimit: 0.01,
    temperature: 0.3,
  },

  [AgentMode.DEEP_DIVE]: {
    name: 'deep-dive',
    description: 'Thorough analysis and complex refactoring with top-tier models',
    model: 'anthropic/claude-sonnet-4-5',
    maxSteps: 20,
    verbosity: 'high',
    autoApply: false,
    budgetLimit: 1.0,
    temperature: 0.7,
  },

  [AgentMode.LEARNING]: {
    name: 'learning',
    description: 'Educational mode with detailed explanations of every step',
    model: 'anthropic/claude-3.5-sonnet',
    maxSteps: 10,
    verbosity: 'verbose',
    autoApply: false,
    explainSteps: true,
    temperature: 0.5,
  },

  [AgentMode.REVIEW]: {
    name: 'review',
    description: 'Code review mode focused on quality, security, and best practices',
    model: 'anthropic/claude-3.5-sonnet',
    maxSteps: 15,
    verbosity: 'high',
    autoApply: false,
    focusAreas: ['security', 'performance', 'maintainability', 'best-practices'],
    systemPrompt: `You are a senior code reviewer focusing on:
- Security vulnerabilities and potential exploits
- Performance bottlenecks and optimization opportunities
- Code maintainability and readability
- Adherence to best practices and design patterns
- Test coverage and edge cases

Provide constructive feedback with specific examples and suggestions.`,
    temperature: 0.4,
  },

  [AgentMode.DEFAULT]: {
    name: 'default',
    description: 'Balanced mode for general-purpose coding tasks',
    model: 'anthropic/claude-3.5-sonnet',
    maxSteps: 10,
    verbosity: 'medium',
    autoApply: false,
    budgetLimit: 0.5,
    temperature: 0.5,
  },
};

/**
 * Get mode configuration by name
 */
export function getModeConfig(modeName: string): ModePreset[string] | undefined {
  return MODE_PRESETS[modeName];
}

/**
 * List all available modes
 */
export function listModes(): string[] {
  return Object.keys(MODE_PRESETS);
}

/**
 * Get mode descriptions for help text
 */
export function getModeDescriptions(): string {
  return Object.values(MODE_PRESETS)
    .map(mode => `  ${mode.name.padEnd(12)} - ${mode.description}`)
    .join('\n');
}
