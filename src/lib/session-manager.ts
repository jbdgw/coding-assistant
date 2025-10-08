/**
 * Session Manager - Handles CRUD operations for chat sessions
 */

import Database from 'better-sqlite3';
import { customAlphabet } from 'nanoid';
import { initializeDatabase, type SessionRow } from './storage/usage-db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

export interface Session {
  id: string;
  threadId: string;
  title: string | null;
  startedAt: Date;
  endedAt: Date | null;
  messageCount: number;
  totalCost: number;
  tags: string[];
  summary: string | null;
  contextLoaded: Record<string, any> | null;
}

export interface CreateSessionOptions {
  threadId: string;
  title?: string;
  tags?: string[];
  contextLoaded?: Record<string, any>;
}

export interface UpdateSessionOptions {
  title?: string;
  messageCount?: number;
  totalCost?: number;
  tags?: string[];
  summary?: string;
  endedAt?: Date;
}

export interface ListSessionsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
}

export class SessionManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    this.db = initializeDatabase(dbPath);
  }

  /**
   * Create a new session
   */
  createSession(options: CreateSessionOptions): Session {
    const sessionId = nanoid();
    const tags = JSON.stringify(options.tags || []);
    const contextLoaded = options.contextLoaded ? JSON.stringify(options.contextLoaded) : null;

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, thread_id, title, tags, context_loaded)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(sessionId, options.threadId, options.title || null, tags, contextLoaded);

    return this.getSession(sessionId)!;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(sessionId) as SessionRow | undefined;

    return row ? this.rowToSession(row) : null;
  }

  /**
   * Get a session by thread ID
   */
  getSessionByThreadId(threadId: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE thread_id = ?');
    const row = stmt.get(threadId) as SessionRow | undefined;

    return row ? this.rowToSession(row) : null;
  }

  /**
   * Update a session
   */
  updateSession(sessionId: string, options: UpdateSessionOptions): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (options.title !== undefined) {
      updates.push('title = ?');
      values.push(options.title);
    }

    if (options.messageCount !== undefined) {
      updates.push('message_count = ?');
      values.push(options.messageCount);
    }

    if (options.totalCost !== undefined) {
      updates.push('total_cost = ?');
      values.push(options.totalCost);
    }

    if (options.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(options.tags));
    }

    if (options.summary !== undefined) {
      updates.push('summary = ?');
      values.push(options.summary);
    }

    if (options.endedAt !== undefined) {
      updates.push('ended_at = ?');
      values.push(options.endedAt.toISOString());
    }

    if (updates.length === 0) return;

    values.push(sessionId);

    const stmt = this.db.prepare(`
      UPDATE sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
  }

  /**
   * Increment message count for a session
   */
  incrementMessageCount(sessionId: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET message_count = message_count + 1
      WHERE id = ?
    `);

    stmt.run(sessionId);
  }

  /**
   * Add cost to session
   */
  addCost(sessionId: string, cost: number): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET total_cost = total_cost + ?
      WHERE id = ?
    `);

    stmt.run(cost, sessionId);
  }

  /**
   * List sessions with optional filtering
   */
  listSessions(options: ListSessionsOptions = {}): Session[] {
    const { limit = 20, offset = 0, search, tags } = options;

    let query = 'SELECT * FROM sessions';
    const conditions: string[] = [];
    const values: any[] = [];

    if (search) {
      conditions.push('(title LIKE ? OR summary LIKE ?)');
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern);
    }

    if (tags && tags.length > 0) {
      // Search for tags in JSON array
      const tagConditions = tags.map(() => 'tags LIKE ?');
      conditions.push(`(${tagConditions.join(' OR ')})`);
      tags.forEach((tag) => values.push(`%"${tag}"%`));
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...values) as SessionRow[];

    return rows.map((row) => this.rowToSession(row));
  }

  /**
   * Get total session count (optionally filtered)
   */
  getSessionCount(options: { search?: string; tags?: string[] } = {}): number {
    let query = 'SELECT COUNT(*) as count FROM sessions';
    const conditions: string[] = [];
    const values: any[] = [];

    if (options.search) {
      conditions.push('(title LIKE ? OR summary LIKE ?)');
      const searchPattern = `%${options.search}%`;
      values.push(searchPattern, searchPattern);
    }

    if (options.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'tags LIKE ?');
      conditions.push(`(${tagConditions.join(' OR ')})`);
      options.tags.forEach((tag) => values.push(`%"${tag}"%`));
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...values) as { count: number };
    return result.count;
  }

  /**
   * Delete a session and all related data
   */
  deleteSession(sessionId: string): void {
    // Delete related learnings first (foreign key constraint)
    this.db.prepare('DELETE FROM learnings WHERE session_id = ?').run(sessionId);

    // Delete the session
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  /**
   * Get recent sessions
   */
  getRecentSessions(limit: number = 10): Session[] {
    return this.listSessions({ limit });
  }

  /**
   * Search sessions by text
   */
  searchSessions(query: string, limit: number = 20): Session[] {
    return this.listSessions({ search: query, limit });
  }

  /**
   * Convert database row to Session object
   */
  private rowToSession(row: SessionRow): Session {
    return {
      id: row.id,
      threadId: row.thread_id,
      title: row.title,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : null,
      messageCount: row.message_count,
      totalCost: row.total_cost,
      tags: row.tags ? JSON.parse(row.tags) : [],
      summary: row.summary,
      contextLoaded: row.context_loaded ? JSON.parse(row.context_loaded) : null,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
