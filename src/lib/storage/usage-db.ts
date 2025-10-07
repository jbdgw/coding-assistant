/**
 * SQLite database schema and initialization for usage tracking
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the database path (in user's config directory)
 */
export function getDbPath(): string {
  const configDir = path.join(os.homedir(), '.config', 'ai-coding-cli-nodejs');

  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  return path.join(configDir, 'usage.db');
}

/**
 * Initialize the database with schema
 */
export function initializeDatabase(dbPath?: string): Database.Database {
  const db = new Database(dbPath || getDbPath());

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables if they don't exist
  db.exec(`
    -- Usage logs table
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL,
      completion_tokens INTEGER NOT NULL,
      total_tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      task_complexity TEXT,
      session_id TEXT,
      success BOOLEAN DEFAULT 1
    );

    -- Budget configuration table (single row)
    CREATE TABLE IF NOT EXISTS budget_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      daily_limit REAL,
      weekly_limit REAL,
      monthly_limit REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Failure logs table
    CREATE TABLE IF NOT EXISTS failure_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      model TEXT NOT NULL,
      error_message TEXT,
      fallback_model TEXT,
      fallback_succeeded BOOLEAN DEFAULT 0
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_logs(model);
    CREATE INDEX IF NOT EXISTS idx_usage_session ON usage_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_failure_timestamp ON failure_logs(timestamp);
  `);

  // Initialize budget config if not exists
  const budgetExists = db.prepare('SELECT COUNT(*) as count FROM budget_config').get() as { count: number };
  if (budgetExists.count === 0) {
    db.prepare('INSERT INTO budget_config (id) VALUES (1)').run();
  }

  return db;
}

/**
 * Database schema type definitions
 */
export interface UsageLogRow {
  id: number;
  timestamp: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  task_complexity: string | null;
  session_id: string | null;
  success: number;
}

export interface BudgetConfigRow {
  id: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  monthly_limit: number | null;
  updated_at: string;
}

export interface FailureLogRow {
  id: number;
  timestamp: string;
  model: string;
  error_message: string | null;
  fallback_model: string | null;
  fallback_succeeded: number;
}
