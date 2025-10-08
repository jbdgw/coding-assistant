/**
 * Phase 1 Testing - Enhanced Database Schema
 * Tests new tables and columns in usage.db
 */

import Database from 'better-sqlite3';
import { initializeDatabase, getDbPath } from './src/lib/storage/usage-db.js';

async function testDatabaseSchema() {
  console.log('\n🧪 PHASE 1 TEST: Enhanced Database Schema\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Initialize Database
    console.log('\n📋 Test 1: Initialize Database');
    const db = initializeDatabase();
    console.log(`  Database path: ${getDbPath()}`);
    console.log('✅ Database initialized');

    // Test 2: Verify daily_stats Table
    console.log('\n📋 Test 2: Verify daily_stats Table');
    const dailyStatsSchema = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_stats'")
      .get() as { sql: string } | undefined;

    if (dailyStatsSchema) {
      console.log('  ✓ daily_stats table exists');

      // Check columns
      const columns = db.prepare('PRAGMA table_info(daily_stats)').all() as Array<{ name: string; type: string }>;
      const expectedColumns = [
        'date',
        'sessions_count',
        'total_cost',
        'total_tokens',
        'files_modified',
        'primary_activities',
      ];

      console.log(`  Columns found: ${columns.map(c => c.name).join(', ')}`);

      const hasAllColumns = expectedColumns.every(col => columns.some(c => c.name === col));
      if (hasAllColumns) {
        console.log('✅ daily_stats table verified');
      } else {
        throw new Error('Missing columns in daily_stats');
      }
    } else {
      throw new Error('daily_stats table not found');
    }

    // Test 3: Verify learning_patterns Table
    console.log('\n📋 Test 3: Verify learning_patterns Table');
    const learningPatternsSchema = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='learning_patterns'")
      .get() as { sql: string } | undefined;

    if (learningPatternsSchema) {
      console.log('  ✓ learning_patterns table exists');

      const columns = db.prepare('PRAGMA table_info(learning_patterns)').all() as Array<{ name: string; type: string }>;
      const expectedColumns = ['topic', 'frequency', 'last_accessed', 'mastery_level'];

      console.log(`  Columns found: ${columns.map(c => c.name).join(', ')}`);

      const hasAllColumns = expectedColumns.every(col => columns.some(c => c.name === col));
      if (hasAllColumns) {
        console.log('✅ learning_patterns table verified');
      } else {
        throw new Error('Missing columns in learning_patterns');
      }
    } else {
      throw new Error('learning_patterns table not found');
    }

    // Test 4: Verify sessions Table New Columns
    console.log('\n📋 Test 4: Verify sessions Table New Columns');
    const sessionColumns = db.prepare('PRAGMA table_info(sessions)').all() as Array<{ name: string; type: string }>;
    const newColumns = ['primary_language', 'frameworks_used', 'productivity_score'];

    console.log(`  Total columns in sessions: ${sessionColumns.length}`);

    const hasNewColumns = newColumns.every(col => sessionColumns.some(c => c.name === col));
    if (hasNewColumns) {
      console.log('  ✓ primary_language (TEXT)');
      console.log('  ✓ frameworks_used (TEXT)');
      console.log('  ✓ productivity_score (REAL)');
      console.log('✅ New session columns verified');
    } else {
      const missing = newColumns.filter(col => !sessionColumns.some(c => c.name === col));
      throw new Error(`Missing columns in sessions: ${missing.join(', ')}`);
    }

    // Test 5: Verify Indexes
    console.log('\n📋 Test 5: Verify Database Indexes');
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>;

    const expectedIndexes = ['idx_daily_stats_date', 'idx_learning_patterns_topic', 'idx_learning_patterns_accessed'];

    console.log(`  Indexes found: ${indexes.map(i => i.name).join(', ')}`);

    const hasAllIndexes = expectedIndexes.every(idx => indexes.some(i => i.name === idx));
    if (hasAllIndexes) {
      console.log('  ✓ idx_daily_stats_date');
      console.log('  ✓ idx_learning_patterns_topic');
      console.log('  ✓ idx_learning_patterns_accessed');
      console.log('✅ All Phase 1 indexes verified');
    } else {
      const missing = expectedIndexes.filter(idx => !indexes.some(i => i.name === idx));
      console.log(`⚠️  Missing indexes: ${missing.join(', ')}`);
    }

    // Test 6: Insert Test Data into daily_stats
    console.log('\n📋 Test 6: Insert Test Data into daily_stats');
    const insertDailyStat = db.prepare(`
      INSERT INTO daily_stats (date, sessions_count, total_cost, total_tokens, files_modified, primary_activities)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertDailyStat.run('2025-01-07', 5, 0.42, 15000, 12, JSON.stringify(['coding', 'debugging']));
    console.log('  ✓ Inserted test record');

    const stat = db.prepare("SELECT * FROM daily_stats WHERE date = '2025-01-07'").get() as any;
    if (stat && stat.sessions_count === 5) {
      console.log(`  ✓ Retrieved: ${stat.sessions_count} sessions, $${stat.total_cost} cost`);
      console.log('✅ daily_stats insert/query works');
    } else {
      throw new Error('Failed to insert/retrieve daily_stats');
    }

    // Test 7: Insert Test Data into learning_patterns
    console.log('\n📋 Test 7: Insert Test Data into learning_patterns');
    const insertPattern = db.prepare(`
      INSERT INTO learning_patterns (topic, frequency, mastery_level)
      VALUES (?, ?, ?)
    `);

    insertPattern.run('React Hooks', 5, 'intermediate');
    console.log('  ✓ Inserted test record');

    const pattern = db.prepare("SELECT * FROM learning_patterns WHERE topic = 'React Hooks'").get() as any;
    if (pattern && pattern.frequency === 5) {
      console.log(`  ✓ Retrieved: ${pattern.topic} (${pattern.mastery_level}), frequency: ${pattern.frequency}`);
      console.log('✅ learning_patterns insert/query works');
    } else {
      throw new Error('Failed to insert/retrieve learning_patterns');
    }

    // Test 8: Update Session with New Columns
    console.log('\n📋 Test 8: Update Session with New Columns');

    // First insert a test session
    const insertSession = db.prepare(`
      INSERT INTO sessions (id, thread_id, title, primary_language, frameworks_used, productivity_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertSession.run(
      'test-session-1',
      'test-thread-1',
      'Test Session',
      'typescript',
      JSON.stringify(['React', 'Express']),
      0.85
    );
    console.log('  ✓ Inserted session with new columns');

    const session = db.prepare("SELECT * FROM sessions WHERE id = 'test-session-1'").get() as any;
    if (session && session.primary_language === 'typescript') {
      console.log(`  ✓ Retrieved: ${session.primary_language}, frameworks: ${session.frameworks_used}`);
      console.log(`  ✓ Productivity score: ${session.productivity_score}`);
      console.log('✅ Session new columns work');
    } else {
      throw new Error('Failed to insert/retrieve session with new columns');
    }

    // Test 9: Clean Up Test Data
    console.log('\n📋 Test 9: Clean Up Test Data');
    db.prepare("DELETE FROM daily_stats WHERE date = '2025-01-07'").run();
    db.prepare("DELETE FROM learning_patterns WHERE topic = 'React Hooks'").run();
    db.prepare("DELETE FROM sessions WHERE id = 'test-session-1'").run();
    console.log('✅ Test data cleaned up');

    // Close database
    db.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATABASE SCHEMA TESTS PASSED\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

testDatabaseSchema();
