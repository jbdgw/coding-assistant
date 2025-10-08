# Phase 1 Testing Guide

This document outlines what needs to be tested for Phase 1: Core Infrastructure.

## Overview

Phase 1 introduced:

- Plugin system (loader, registry, hooks)
- Agent mode manager
- Enhanced analytics database schema
- Code quality analyzer
- Ink + React dependencies

## Testing Checklist

### 1. Plugin System

#### Plugin Registry Tests

```bash
# Test location: Create test file
touch src/lib/plugins/plugin-registry.test.ts
```

**What to test:**

- [ ] Register a plugin successfully
- [ ] Unregister a plugin
- [ ] List all plugins
- [ ] List only enabled plugins
- [ ] Enable/disable a plugin
- [ ] Load registry from disk
- [ ] Save registry to disk
- [ ] Initialize all plugins
- [ ] Cleanup all plugins

**Manual test:**

```bash
# 1. Create a test plugin
mkdir -p ~/.config/ai-coding-cli-nodejs/plugins/test-plugin
cat > ~/.config/ai-coding-cli-nodejs/plugins/test-plugin/package.json << 'EOF'
{
  "name": "test-plugin",
  "version": "1.0.0",
  "main": "index.js"
}
EOF

cat > ~/.config/ai-coding-cli-nodejs/plugins/test-plugin/index.js << 'EOF'
export default {
  name: "test-plugin",
  version: "1.0.0",
  description: "Test plugin",
  init: async () => {
    console.log("Test plugin initialized");
  },
  cleanup: async () => {
    console.log("Test plugin cleaned up");
  }
};
EOF

# 2. Test plugin loading (add to a command or integration test)
```

#### Hook System Tests

```bash
# Test location
touch src/lib/plugins/hook-system.test.ts
```

**What to test:**

- [ ] Register hooks for different types
- [ ] Execute before-commit hook
- [ ] Execute after-test hook
- [ ] Execute before-chat hook (returns transformed message)
- [ ] Execute after-response hook (returns transformed response)
- [ ] Execute on-error hook
- [ ] Clear all hooks
- [ ] Get hook counts

**Manual test:**

```typescript
// Example hook registration
const hookSystem = new HookSystem();

hookSystem.register(
  'before-commit',
  async () => {
    console.log('Before commit hook executed');
  },
  'test-plugin'
);

await hookSystem.executeBeforeCommit();
```

#### Plugin Loader Tests

```bash
# Test location
touch src/lib/plugins/plugin-loader.test.ts
```

**What to test:**

- [ ] Load all plugins from directory
- [ ] Load single plugin by name
- [ ] Handle ESM plugin imports
- [ ] Handle CommonJS plugin imports
- [ ] Handle missing plugins gracefully
- [ ] Install plugin from directory
- [ ] Uninstall plugin
- [ ] Reload all plugins

**Edge cases to test:**

- Plugin with no default export
- Plugin missing required fields (name, version)
- Plugin with invalid module path
- Plugin with syntax errors

---

### 2. Agent Mode System

#### Mode Manager Tests

```bash
# Test location
touch src/lib/modes/mode-manager.test.ts
```

**What to test:**

- [ ] Get current mode (default on first load)
- [ ] Set mode to a different pre-defined mode
- [ ] List all mode names
- [ ] List all mode configurations
- [ ] Check if mode exists
- [ ] Create custom mode
- [ ] Delete custom mode
- [ ] Get custom modes
- [ ] Apply mode config to options
- [ ] Get mode info string
- [ ] Load mode from config on initialization

**Manual test:**

```bash
# 1. Test mode switching via CLI (when mode command exists)
npm run dev -- mode list
npm run dev -- mode show quick-fix
npm run dev -- mode set quick-fix

# 2. Test in chat session (when integrated)
npm run dev -- chat --mode=quick-fix
# Verify: uses gpt-4o-mini, max 3 steps, budget $0.01
```

#### Mode Presets Tests

**What to test:**

- [ ] All 5 modes are defined (quick-fix, deep-dive, learning, review, default)
- [ ] Each mode has required fields
- [ ] getModeConfig returns correct config
- [ ] listModes returns all mode names
- [ ] getModeDescriptions returns formatted string

**Verification:**

```typescript
import { MODE_PRESETS, listModes, getModeConfig } from './src/config/mode-presets';

console.log('Modes:', listModes());
console.log('Quick Fix:', getModeConfig('quick-fix'));
```

---

### 3. Enhanced Analytics Database

#### Database Schema Tests

**What to test:**

- [ ] Database initializes with all tables
- [ ] `sessions` table has new columns (primary_language, frameworks_used, productivity_score)
- [ ] `daily_stats` table created
- [ ] `learning_patterns` table created
- [ ] All indexes created
- [ ] Foreign key constraints work

**Manual test:**

```bash
# 1. Delete existing database
rm ~/.config/ai-coding-cli-nodejs/usage.db

# 2. Run any command to trigger initialization
npm run dev -- models

# 3. Verify schema
sqlite3 ~/.config/ai-coding-cli-nodejs/usage.db

# In SQLite:
.schema sessions
.schema daily_stats
.schema learning_patterns
.indexes

# Verify columns exist
PRAGMA table_info(sessions);
# Should show: primary_language, frameworks_used, productivity_score
```

#### Usage Tracker Tests

**What to test:**

- [ ] Log usage with all fields
- [ ] Log failure
- [ ] Get budget remaining
- [ ] Set budget limit
- [ ] Get budget config
- [ ] Clear budget limits
- [ ] Get model stats
- [ ] Get usage history
- [ ] Get failure history
- [ ] Get session cost

**Type safety verification:**

- [ ] No TypeScript errors in usage-tracker.ts
- [ ] All database row types properly defined
- [ ] No `any` types used

---

### 4. Code Quality Analyzer

#### ESLint Integration Tests

```bash
# Test location
touch src/lib/quality/code-analyzer.test.ts
```

**What to test:**

- [ ] Analyze files with no issues
- [ ] Analyze files with errors
- [ ] Analyze files with warnings
- [ ] Detect code smells (long files, high complexity, etc.)
- [ ] Auto-fix issues
- [ ] Generate analysis summary
- [ ] Handle non-existent files
- [ ] Handle non-code files

**Manual test:**

```typescript
// 1. Create test file with issues
// test-file.ts
function test() {
  var x = 1; // ESLint error: use const
  console.log(x);
}

// 2. Run analyzer
import { CodeAnalyzer } from './src/lib/quality/code-analyzer';

const analyzer = new CodeAnalyzer();
const result = await analyzer.analyze(['test-file.ts']);
console.log(result);

// 3. Test auto-fix
const fixed = await analyzer.fix(['test-file.ts']);
console.log(`Fixed ${fixed} files`);
```

---

### 5. Integration Tests

#### Plugin + Mode Integration

**Test scenario:**

```typescript
// 1. Create plugin that adds custom mode
const plugin = {
  name: 'custom-modes-plugin',
  version: '1.0.0',
  init: async () => {
    const modeManager = new ModeManager(config);
    modeManager.setCustomMode('ultra-fast', {
      name: 'ultra-fast',
      description: 'Ultra fast mode',
      model: 'openai/gpt-4o-mini',
      maxSteps: 1,
      verbosity: 'low',
      autoApply: true,
      budgetLimit: 0.001,
    });
  },
};

// 2. Register plugin
// 3. Verify custom mode is available
```

#### Analytics + Mode Integration

**Test scenario:**

```typescript
// 1. Start chat session with specific mode
// 2. Send multiple messages
// 3. Verify analytics tracks mode usage
// 4. Check database for correct mode in usage_logs
```

---

### 6. Dependency Installation Verification

#### Ink Dependencies

**Verify installed:**

```bash
npm list ink
npm list ink-text-input
npm list ink-select-input
npm list ink-spinner
npm list ink-table
npm list ink-gradient
npm list ink-big-text
npm list react
```

**Expected versions:**

- ink: ^5.2.1
- ink-text-input: ^6.0.0
- ink-select-input: ^6.2.0
- ink-spinner: ^5.0.0
- ink-table: ^3.1.0
- ink-gradient: ^3.0.0
- ink-big-text: ^2.0.0
- react: ^18.3.1

---

### 7. Type Safety Checks

#### No TypeScript Errors

```bash
# Run TypeScript compiler in check mode
npx tsc --noEmit

# Expected: No errors in Phase 1 files
```

#### ESLint Checks

```bash
# Run ESLint on Phase 1 files only
npm run lint src/lib/plugins/*.ts
npm run lint src/lib/modes/*.ts
npm run lint src/lib/quality/*.ts
npm run lint src/types/plugin.ts
npm run lint src/types/mode.ts
npm run lint src/config/mode-presets.ts

# Expected: No errors (warnings are acceptable)
```

---

### 8. Build Verification

```bash
# Clean build
rm -rf dist
npm run build

# Expected: Build succeeds without errors
# Verify Phase 1 files are compiled
ls -la dist/lib/plugins/
ls -la dist/lib/modes/
ls -la dist/lib/quality/
ls -la dist/types/
ls -la dist/config/
```

---

### 9. Known Issues to Fix

#### Existing Lint Errors (Not Phase 1)

The following files have pre-existing lint errors that were not introduced in Phase 1:

- `src/commands/forget.ts` - Unsafe member access
- `src/commands/init.ts` - Unsafe assignments with inquirer
- `src/commands/recall.ts` - Unsafe Mastra Memory calls
- `src/lib/retrieval.ts` - Unused error variable
- `src/lib/session-manager.ts` - Unsafe spread of any[] arrays
- `src/utils/display.ts` - Unsafe assignment in marked config
- `src/utils/rag-display.ts` - Unsafe assignment in marked config

**These should be fixed in a separate cleanup PR.**

#### Phase 1 Exceptions

The following Phase 1 code has intentional ESLint exceptions:

- `plugin-loader.ts:93-94` - Hook registration type coercion (necessary for dynamic hook types)
- `plugin-loader.ts:119` - Dynamic import (necessary for plugin system)
- `plugin-loader.ts:133` - CommonJS require (fallback for CJS plugins)
- `hook-system.ts:20` - Handler type coercion (necessary for hook system)

---

### 10. Performance Tests

#### Plugin Loading Performance

```bash
# Test with 0, 1, 5, 10 plugins
# Measure startup time impact
time npm run dev -- --help
```

#### Mode Switching Performance

```typescript
// Measure mode switch time
console.time('mode-switch');
modeManager.setMode('deep-dive');
console.timeEnd('mode-switch');

// Expected: < 1ms
```

#### Database Query Performance

```bash
# Test with 1k, 10k, 100k usage records
# Measure query times for:
# - getModelStats()
# - getUsageHistory()
# - getBudgetRemaining()

# Expected: < 100ms for 10k records
```

---

### 11. Documentation Tests

#### API Documentation

**Verify all exported functions/classes have JSDoc:**

- [ ] Plugin system classes
- [ ] Mode manager classes
- [ ] Code analyzer classes
- [ ] Hook system classes

#### README Updates

- [ ] Phase 1 features documented
- [ ] Installation instructions include new deps
- [ ] Usage examples for new features

---

## Test Coverage Goals

### Unit Tests

- Target: 80% coverage for Phase 1 code
- Focus on: Plugin system, Mode manager, Code analyzer

### Integration Tests

- Plugin loading + registration
- Mode switching + config persistence
- Analytics schema + queries

### Manual Tests

- Full workflow tests (see scenarios above)
- Edge case testing
- Error handling verification

---

## Testing Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Lint Phase 1 files
npm run lint src/lib/plugins/*.ts src/lib/modes/*.ts src/lib/quality/*.ts src/types/*.ts src/config/*.ts

# Build and verify
npm run build
ls -la dist/lib/plugins/ dist/lib/modes/ dist/lib/quality/
```

---

## Test Results Template

Use this template to document your test results:

```markdown
## Phase 1 Test Results

**Date**: YYYY-MM-DD
**Tester**: [Your Name]

### Plugin System

- [ ] Plugin Registry: PASS/FAIL
- [ ] Hook System: PASS/FAIL
- [ ] Plugin Loader: PASS/FAIL
- Issues found: [list any issues]

### Mode Manager

- [ ] Mode switching: PASS/FAIL
- [ ] Custom modes: PASS/FAIL
- [ ] Config persistence: PASS/FAIL
- Issues found: [list any issues]

### Analytics Database

- [ ] Schema creation: PASS/FAIL
- [ ] New columns: PASS/FAIL
- [ ] New tables: PASS/FAIL
- Issues found: [list any issues]

### Code Quality

- [ ] ESLint integration: PASS/FAIL
- [ ] Code smell detection: PASS/FAIL
- [ ] Auto-fix: PASS/FAIL
- Issues found: [list any issues]

### Build & Type Safety

- [ ] TypeScript compilation: PASS/FAIL
- [ ] ESLint checks: PASS/FAIL (with exceptions noted)
- [ ] Build output: PASS/FAIL
- Issues found: [list any issues]

### Overall Status

- [ ] Ready for Phase 2: YES/NO
- Blockers: [list any blockers]
- Notes: [additional notes]
```

---

## Next Steps After Testing

1. **Document any bugs found** in GitHub Issues
2. **Fix critical bugs** before starting Phase 2
3. **Update this guide** with any new test cases discovered
4. **Create test coverage report** and commit to repo
5. **Begin Phase 2** (Security Scanner) once Phase 1 is validated

---

**Last Updated**: 2025-01-07
**Status**: Ready for testing
