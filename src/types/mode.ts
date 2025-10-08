/**
 * Agent mode configuration types
 */

export interface ModeConfig {
  /** Mode name */
  name: string;

  /** Mode description */
  description: string;

  /** Model to use in this mode */
  model: string;

  /** Maximum steps for agent execution */
  maxSteps: number;

  /** Verbosity level */
  verbosity: 'low' | 'medium' | 'high' | 'verbose';

  /** Auto-apply changes without confirmation */
  autoApply: boolean;

  /** Budget limit for this mode (in USD) */
  budgetLimit?: number;

  /** Whether to explain each step */
  explainSteps?: boolean;

  /** Focus areas for this mode (used in review mode) */
  focusAreas?: string[];

  /** Custom system prompt override */
  systemPrompt?: string;

  /** Temperature setting for model */
  temperature?: number;

  /** Enable/disable specific tools */
  enabledTools?: string[];
  disabledTools?: string[];
}

/**
 * Pre-defined mode names
 */
export enum AgentMode {
  QUICK_FIX = 'quick-fix',
  DEEP_DIVE = 'deep-dive',
  LEARNING = 'learning',
  REVIEW = 'review',
  DEFAULT = 'default',
}

/**
 * Mode preset interface for configuration storage
 */
export interface ModePreset {
  [key: string]: ModeConfig;
}
