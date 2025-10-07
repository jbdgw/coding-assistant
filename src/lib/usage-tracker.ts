/**
 * Usage tracker - Tracks model usage, costs, and budget limits using SQLite
 */

import Database from 'better-sqlite3';
import { initializeDatabase } from './storage/usage-db.js';
import type {
  TokenUsage,
  UsageLog,
  FailureLog,
  BudgetConfig,
  ModelStats,
  TaskComplexity,
} from '../types/routing.js';

export class UsageTracker {
  private db: Database.Database;
  private sessionId: string;

  constructor(dbPath?: string, sessionId?: string) {
    this.db = initializeDatabase(dbPath);
    this.sessionId = sessionId || Date.now().toString();
  }

  /**
   * Log successful usage
   */
  logUsage(
    model: string,
    usage: TokenUsage,
    complexity: TaskComplexity,
    cost: number,
    success: boolean = true,
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO usage_logs (model, prompt_tokens, completion_tokens, total_tokens, cost, task_complexity, session_id, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      model,
      usage.promptTokens,
      usage.completionTokens,
      usage.totalTokens,
      cost,
      complexity,
      this.sessionId,
      success ? 1 : 0,
    );
  }

  /**
   * Log model failure
   */
  logFailure(
    model: string,
    errorMessage: string,
    fallbackModel?: string,
    fallbackSucceeded: boolean = false,
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO failure_logs (model, error_message, fallback_model, fallback_succeeded)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(model, errorMessage, fallbackModel || null, fallbackSucceeded ? 1 : 0);
  }

  /**
   * Get budget remaining for a period
   */
  getBudgetRemaining(period: 'daily' | 'weekly' | 'monthly'): number | null {
    // Get the budget limit
    const config = this.getBudgetConfig();
    const limitKey = `${period}Limit` as keyof BudgetConfig;
    const limit = config[limitKey];

    if (!limit || typeof limit !== 'number') {
      return null; // No limit set
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'weekly': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'monthly': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
    }

    // Get total spending in period
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total_cost
      FROM usage_logs
      WHERE timestamp >= ?
    `);

    const result = stmt.get(startDate.toISOString()) as { total_cost: number };
    const spent = result.total_cost;

    return limit - spent;
  }

  /**
   * Set budget limit
   */
  setBudgetLimit(period: 'daily' | 'weekly' | 'monthly', amount: number): void {
    const column = `${period}_limit`;
    const stmt = this.db.prepare(`
      UPDATE budget_config
      SET ${column} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(amount);
  }

  /**
   * Get budget configuration
   */
  getBudgetConfig(): BudgetConfig {
    const stmt = this.db.prepare('SELECT * FROM budget_config WHERE id = 1');
    const row = stmt.get() as any;

    return {
      dailyLimit: row.daily_limit,
      weeklyLimit: row.weekly_limit,
      monthlyLimit: row.monthly_limit,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  /**
   * Clear budget limits
   */
  clearBudgetLimits(): void {
    const stmt = this.db.prepare(`
      UPDATE budget_config
      SET daily_limit = NULL, weekly_limit = NULL, monthly_limit = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run();
  }

  /**
   * Get model statistics
   */
  getModelStats(): ModelStats[] {
    const stmt = this.db.prepare(`
      SELECT
        model,
        COUNT(*) as total_calls,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
        AVG(cost) as avg_cost,
        SUM(cost) as total_cost
      FROM usage_logs
      GROUP BY model
      ORDER BY total_calls DESC
    `);

    const rows = stmt.all() as any[];

    return rows.map((row) => ({
      model: row.model,
      totalCalls: row.total_calls,
      successRate: row.success_rate,
      avgCost: row.avg_cost,
      totalCost: row.total_cost,
    }));
  }

  /**
   * Get usage history
   */
  getUsageHistory(limit: number = 100, fromDate?: Date): UsageLog[] {
    let query = `
      SELECT * FROM usage_logs
      ${fromDate ? 'WHERE timestamp >= ?' : ''}
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const stmt = this.db.prepare(query);
    const params = fromDate ? [fromDate.toISOString(), limit] : [limit];
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      model: row.model,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      cost: row.cost,
      taskComplexity: row.task_complexity,
      sessionId: row.session_id,
      success: row.success === 1,
    }));
  }

  /**
   * Get failure history
   */
  getFailureHistory(limit: number = 50): FailureLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM failure_logs
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];

    return rows.map((row) => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      model: row.model,
      errorMessage: row.error_message,
      fallbackModel: row.fallback_model,
      fallbackSucceeded: row.fallback_succeeded === 1,
    }));
  }

  /**
   * Get total cost for current session
   */
  getSessionCost(): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total_cost
      FROM usage_logs
      WHERE session_id = ?
    `);

    const result = stmt.get(this.sessionId) as { total_cost: number };
    return result.total_cost;
  }

  /**
   * Get total cost for all time
   */
  getTotalCost(): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total_cost
      FROM usage_logs
    `);

    const result = stmt.get() as { total_cost: number };
    return result.total_cost;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
