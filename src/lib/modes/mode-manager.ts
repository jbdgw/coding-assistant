import { AgentMode, ModeConfig } from '../../types/mode.js';
import { MODE_PRESETS, getModeConfig } from '../../config/mode-presets.js';
import { ConfigStore } from '../config.js';

/**
 * Mode manager for handling agent mode configurations
 */
export class ModeManager {
  private config: ConfigStore;
  private currentMode: ModeConfig;

  constructor(config: ConfigStore) {
    this.config = config;

    // Load current mode from config or use default
    const savedMode = config.get('currentMode');
    const modeName = typeof savedMode === 'string' ? savedMode : AgentMode.DEFAULT;
    this.currentMode = getModeConfig(modeName) || MODE_PRESETS[AgentMode.DEFAULT];
  }

  /**
   * Get current mode configuration
   */
  getCurrentMode(): ModeConfig {
    return this.currentMode;
  }

  /**
   * Set current mode
   */
  setMode(modeName: string): void {
    const modeConfig = getModeConfig(modeName);

    if (!modeConfig) {
      throw new Error(`Mode "${modeName}" not found. Available modes: ${this.listModeNames().join(', ')}`);
    }

    this.currentMode = modeConfig;
    this.config.set('currentMode', modeName);
  }

  /**
   * Get mode configuration by name
   */
  getMode(modeName: string): ModeConfig | undefined {
    return getModeConfig(modeName);
  }

  /**
   * List all available mode names
   */
  listModeNames(): string[] {
    return Object.keys(MODE_PRESETS);
  }

  /**
   * List all mode configurations
   */
  listModes(): ModeConfig[] {
    return Object.values(MODE_PRESETS);
  }

  /**
   * Check if mode exists
   */
  hasMode(modeName: string): boolean {
    return modeName in MODE_PRESETS;
  }

  /**
   * Create or update custom mode
   */
  setCustomMode(modeName: string, modeConfig: Partial<ModeConfig>): void {
    const storedModes = this.config.get('customModes');
    const customModes: Record<string, ModeConfig> =
      typeof storedModes === 'object' && storedModes !== null ? (storedModes as Record<string, ModeConfig>) : {};

    // Merge with default config
    const baseMode = MODE_PRESETS[AgentMode.DEFAULT];
    const fullConfig: ModeConfig = {
      ...baseMode,
      ...modeConfig,
      name: modeName,
    };

    customModes[modeName] = fullConfig;
    this.config.set('customModes', customModes);
  }

  /**
   * Delete custom mode
   */
  deleteCustomMode(modeName: string): void {
    const storedModes = this.config.get('customModes');
    const customModes: Record<string, ModeConfig> =
      typeof storedModes === 'object' && storedModes !== null ? (storedModes as Record<string, ModeConfig>) : {};

    if (customModes[modeName]) {
      delete customModes[modeName];
      this.config.set('customModes', customModes);
    }
  }

  /**
   * Get custom modes
   */
  getCustomModes(): Record<string, ModeConfig> {
    const storedModes = this.config.get('customModes');
    return typeof storedModes === 'object' && storedModes !== null ? (storedModes as Record<string, ModeConfig>) : {};
  }

  /**
   * Apply mode configuration to chat options
   */
  applyModeToOptions<T extends Record<string, unknown>>(
    baseOptions: T
  ): T & {
    model: string;
    maxSteps: number;
    temperature?: number;
  } {
    return {
      ...baseOptions,
      model: this.currentMode.model,
      maxSteps: this.currentMode.maxSteps,
      temperature: this.currentMode.temperature,
    };
  }

  /**
   * Get mode information for display
   */
  getModeInfo(): string {
    const mode = this.currentMode;
    return [
      `Mode: ${mode.name}`,
      `Model: ${mode.model}`,
      `Max Steps: ${mode.maxSteps}`,
      `Verbosity: ${mode.verbosity}`,
      `Auto-apply: ${mode.autoApply ? 'Yes' : 'No'}`,
      mode.budgetLimit ? `Budget Limit: $${mode.budgetLimit.toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }
}
