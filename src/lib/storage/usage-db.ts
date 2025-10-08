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

    -- Sessions table (links to Mastra threads)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      thread_id TEXT UNIQUE NOT NULL,
      title TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      message_count INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      tags TEXT,
      summary TEXT,
      context_loaded TEXT
    );

    -- User preferences table
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL DEFAULT 0.5,
      source_session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, key)
    );

    -- Learnings table
    CREATE TABLE IF NOT EXISTS learnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      category TEXT NOT NULL,
      insight TEXT NOT NULL,
      context TEXT,
      relevance_score REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      tech_stack TEXT,
      repository_url TEXT,
      last_mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Common patterns table
    CREATE TABLE IF NOT EXISTS common_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_type TEXT NOT NULL,
      description TEXT,
      solution TEXT NOT NULL,
      frequency INTEGER DEFAULT 1,
      last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_logs(model);
    CREATE INDEX IF NOT EXISTS idx_usage_session ON usage_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_failure_timestamp ON failure_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_thread ON sessions(thread_id);
    CREATE INDEX IF NOT EXISTS idx_preferences_category ON user_preferences(category);
    CREATE INDEX IF NOT EXISTS idx_learnings_session ON learnings(session_id);
    CREATE INDEX IF NOT EXISTS idx_learnings_category ON learnings(category);
    CREATE INDEX IF NOT EXISTS idx_projects_mentioned ON projects(last_mentioned_at DESC);
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

export interface SessionRow {
  id: string;
  thread_id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  total_cost: number;
  tags: string | null; // JSON array
  summary: string | null;
  context_loaded: string | null; // JSON object
}

export interface UserPreferenceRow {
  id: number;
  category: string;
  key: string;
  value: string;
  confidence: number;
  source_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningRow {
  id: number;
  session_id: string;
  category: string;
  insight: string;
  context: string | null;
  relevance_score: number;
  created_at: string;
}

export interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  tech_stack: string | null; // JSON array
  repository_url: string | null;
  last_mentioned_at: string;
  created_at: string;
}

export interface CommonPatternRow {
  id: number;
  task_type: string;
  description: string | null;
  solution: string;
  frequency: number;
  last_used_at: string;
  created_at: string;
}
