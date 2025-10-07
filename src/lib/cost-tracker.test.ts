import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker, TokenUsage } from './cost-tracker.js';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly for Claude 3.5 Sonnet', () => {
      const usage: TokenUsage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const cost = tracker.calculateCost(usage, 'anthropic/claude-3.5-sonnet');
      // (1000/1M * 3) + (500/1M * 15) = 0.003 + 0.0075 = 0.0105
      expect(cost).toBeCloseTo(0.0105, 6);
    });

    it('should calculate cost correctly for Claude 3.5 Haiku', () => {
      const usage: TokenUsage = {
        promptTokens: 2000,
        completionTokens: 1000,
        totalTokens: 3000,
      };

      const cost = tracker.calculateCost(usage, 'anthropic/claude-3.5-haiku');
      // (2000/1M * 1) + (1000/1M * 5) = 0.002 + 0.005 = 0.007
      expect(cost).toBe(0.007);
    });

    it('should calculate cost correctly for GPT-4o', () => {
      const usage: TokenUsage = {
        promptTokens: 1000,
        completionTokens: 1000,
        totalTokens: 2000,
      };

      const cost = tracker.calculateCost(usage, 'openai/gpt-4o');
      // (1000/1M * 5) + (1000/1M * 15) = 0.005 + 0.015 = 0.02
      expect(cost).toBe(0.02);
    });

    it('should use default pricing for unknown models', () => {
      const usage: TokenUsage = {
        promptTokens: 1000,
        completionTokens: 1000,
        totalTokens: 2000,
      };

      const cost = tracker.calculateCost(usage, 'unknown/model');
      // (1000 * 5 + 1000 * 15) / 1M = 20000 / 1M = 0.02
      expect(cost).toBe(0.02);
    });
  });

  describe('addUsage', () => {
    it('should add usage and return cost info', () => {
      const usage: TokenUsage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const costInfo = tracker.addUsage(usage, 'anthropic/claude-3.5-sonnet');

      expect(costInfo.usage).toEqual(usage);
      expect(costInfo.cost).toBeCloseTo(0.0105, 6);
      expect(costInfo.model).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should track multiple usages', () => {
      const usage1: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
      const usage2: TokenUsage = { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 };

      tracker.addUsage(usage1, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage2, 'anthropic/claude-3.5-haiku');

      expect(tracker.getMessageCount()).toBe(2);
    });
  });

  describe('getTotalCost', () => {
    it('should return 0 for new tracker', () => {
      expect(tracker.getTotalCost()).toBe(0);
    });

    it('should accumulate total cost', () => {
      const usage1: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
      const usage2: TokenUsage = { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 };

      tracker.addUsage(usage1, 'anthropic/claude-3.5-sonnet'); // 0.0105
      tracker.addUsage(usage2, 'anthropic/claude-3.5-haiku'); // 0.007

      expect(tracker.getTotalCost()).toBeCloseTo(0.0175, 6);
    });
  });

  describe('getSessionCosts', () => {
    it('should return empty array for new tracker', () => {
      expect(tracker.getSessionCosts()).toEqual([]);
    });

    it('should return all session costs', () => {
      const usage1: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
      const usage2: TokenUsage = { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 };

      tracker.addUsage(usage1, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage2, 'anthropic/claude-3.5-haiku');

      const costs = tracker.getSessionCosts();
      expect(costs).toHaveLength(2);
      expect(costs[0].model).toBe('anthropic/claude-3.5-sonnet');
      expect(costs[1].model).toBe('anthropic/claude-3.5-haiku');
    });
  });

  describe('getMessageCount', () => {
    it('should return 0 for new tracker', () => {
      expect(tracker.getMessageCount()).toBe(0);
    });

    it('should return correct message count', () => {
      const usage: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };

      tracker.addUsage(usage, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage, 'anthropic/claude-3.5-sonnet');

      expect(tracker.getMessageCount()).toBe(3);
    });
  });

  describe('getTotalTokens', () => {
    it('should return zero tokens for new tracker', () => {
      const totalTokens = tracker.getTotalTokens();
      expect(totalTokens).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should sum up all tokens', () => {
      const usage1: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
      const usage2: TokenUsage = { promptTokens: 2000, completionTokens: 1500, totalTokens: 3500 };

      tracker.addUsage(usage1, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage2, 'anthropic/claude-3.5-haiku');

      const totalTokens = tracker.getTotalTokens();
      expect(totalTokens).toEqual({
        promptTokens: 3000,
        completionTokens: 2000,
        totalTokens: 5000,
      });
    });
  });

  describe('reset', () => {
    it('should clear all session data', () => {
      const usage: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };

      tracker.addUsage(usage, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage, 'anthropic/claude-3.5-haiku');

      tracker.reset();

      expect(tracker.getMessageCount()).toBe(0);
      expect(tracker.getTotalCost()).toBe(0);
      expect(tracker.getSessionCosts()).toEqual([]);
      expect(tracker.getTotalTokens()).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  describe('formatCost', () => {
    it('should format cost with 4 decimal places', () => {
      expect(tracker.formatCost(0.0105)).toBe('$0.0105');
      expect(tracker.formatCost(1.23456)).toBe('$1.2346');
      expect(tracker.formatCost(0)).toBe('$0.0000');
    });
  });

  describe('formatUsage', () => {
    it('should format token usage', () => {
      const usage: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
      expect(tracker.formatUsage(usage)).toBe('1000 in, 500 out');
    });
  });

  describe('getSummary', () => {
    it('should return summary string with all info', () => {
      const usage1: TokenUsage = { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 };
      const usage2: TokenUsage = { promptTokens: 2000, completionTokens: 1000, totalTokens: 3000 };

      tracker.addUsage(usage1, 'anthropic/claude-3.5-sonnet');
      tracker.addUsage(usage2, 'anthropic/claude-3.5-haiku');

      const summary = tracker.getSummary();
      expect(summary).toContain('Messages: 2');
      expect(summary).toContain('3000 in, 1500 out');
      expect(summary).toContain('$0.0175');
    });

    it('should handle empty tracker', () => {
      const summary = tracker.getSummary();
      expect(summary).toContain('Messages: 0');
      expect(summary).toContain('0 in, 0 out');
      expect(summary).toContain('$0.0000');
    });
  });
});
