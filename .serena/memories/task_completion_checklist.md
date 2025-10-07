# Task Completion Checklist

## Before Committing Code

### 1. Code Quality

- [ ] Linting passes: `npm run lint`
- [ ] Formatting is correct: `npm run format:check`
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No unused imports or variables
- [ ] All `.js` extensions added to import statements
- [ ] Error handling implemented for async operations
- [ ] User-facing error messages are clear and helpful

### 2. Testing

- [ ] All tests pass: `npm test`
- [ ] Unit tests written for new functionality
- [ ] Manual testing completed for affected features
- [ ] Test the CLI commands work as expected
- [ ] Verify streaming responses work correctly
- [ ] Check cost tracking displays properly
- [ ] Test error scenarios (invalid API key, network errors, etc.)

### 3. Code Style

- [ ] Following ESLint rules (runs automatically via pre-commit hook)
- [ ] Prettier formatting applied (runs automatically via pre-commit hook)
- [ ] Following TypeScript strict mode requirements
- [ ] Consistent naming conventions (camelCase, PascalCase, kebab-case)
- [ ] Proper type annotations on public functions
- [ ] Zod schemas used for validation where appropriate

### 4. Documentation

- [ ] Update README.md if adding new features
- [ ] Add inline comments for complex logic
- [ ] Update CLI help text if commands changed

### 5. Git Workflow

- [ ] Changes staged: `git add .`
- [ ] Meaningful commit message prepared
- [ ] Pre-commit hooks pass (automatic: lint, format, test)
- [ ] Commit pushed to GitHub: `git push origin main`
- [ ] GitHub Actions CI passes

## When Adding New Features

### New CLI Command

1. Create command file in `src/commands/`
2. Implement command logic
3. Register command in `src/index.ts`
4. Update `src/commands/help.ts`
5. Update README.md usage section
6. **Write unit tests in `src/commands/*.test.ts`**
7. Test command execution
8. Run `npm run lint` and fix any issues

### New OpenRouter Integration

1. Update `src/lib/openrouter.ts`
2. Update cost tracking if needed
3. **Update or add tests in `src/lib/openrouter.test.ts`**
4. Test API integration
5. Handle new error cases
6. Update token usage calculations

### New Display/UI Component

1. Add to `src/utils/display.ts`
2. Use chalk for consistent styling
3. Test in different terminal widths
4. Ensure accessibility (readable colors)
5. **Write tests if logic is testable**

### New Library/Utility

1. Create file in appropriate directory (`src/lib/` or `src/utils/`)
2. Implement functionality with proper TypeScript types
3. **Create corresponding `.test.ts` file**
4. Write comprehensive unit tests
5. Export types and functions
6. Update documentation

## Common Issues to Check

### Import Errors

- Ensure all imports have `.js` extension
- Check module resolution in tsconfig.json

### Runtime Errors

- Verify API key is configured: `npm run dev -- init`
- Check network connectivity
- Verify OpenRouter API status

### Build Errors

- Clear dist folder: `rm -rf dist`
- Rebuild: `npm run build`
- Check TypeScript version compatibility

### Linting Errors

- Run `npm run lint` to see all errors
- Run `npm run lint:fix` to auto-fix where possible
- Check ESLint config in `eslint.config.js`

### Test Failures

- Run `npm test` to see failures
- Run `npm run test:watch` for interactive debugging
- Check test mocks and assertions
- Verify test file naming: `*.test.ts` or `*.spec.ts`

## Automated Quality Tools

✅ **This project includes:**

### Linting (ESLint)

- TypeScript-first linting with type checking
- Flat config system (eslint.config.js)
- Auto-fix on commit via pre-commit hook
- Run manually: `npm run lint` or `npm run lint:fix`

### Formatting (Prettier)

- Consistent code style (2 spaces, single quotes, 120 char width)
- Auto-format on commit via pre-commit hook
- Run manually: `npm run format` or `npm run format:check`

### Testing (Vitest)

- Unit tests with Vitest
- Coverage reporting with v8
- Run manually: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Tests run automatically on commit

### Pre-commit Hooks (Husky + lint-staged)

- Automatically runs on every commit:
  1. ESLint with auto-fix
  2. Prettier formatting
  3. All unit tests
- Located in `.husky/pre-commit`

### CI/CD (GitHub Actions)

- Runs on every push and pull request:
  1. Linting check
  2. Formatting check
  3. Unit tests on Node.js 20.x and 22.x
  4. Build verification
  5. Coverage reporting
- Configuration: `.github/workflows/ci.yml`

## Test Coverage

Current test files:

- `src/lib/cost-tracker.test.ts` - 19 tests
- `src/lib/openrouter.test.ts` - 9 tests
- `src/lib/config.test.ts` - 17 tests

**Total: 45 tests passing** ✓

## VS Code Integration

Recommended extensions (`.vscode/extensions.json`):

- ESLint
- Prettier
- Vitest Explorer
- Error Lens
- Code Spell Checker

Settings (`.vscode/settings.json`):

- Format on save: enabled
- ESLint auto-fix on save: enabled
- Vitest integration: enabled
