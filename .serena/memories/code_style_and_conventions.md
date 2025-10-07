# Code Style and Conventions

## TypeScript Configuration

- **Strict Mode**: Enabled (`"strict": true`)
- **Target**: ES2022
- **Module System**: ES2022 with bundler resolution
- **Import Style**: ES6 imports with `.js` extensions required
  ```typescript
  import { configStore } from '../utils/storage.js';
  ```

## Naming Conventions

- **Files**: kebab-case (e.g., `chat-loop.ts`, `cost-tracker.ts`)
- **Test Files**: `*.test.ts` or `*.spec.ts` (e.g., `cost-tracker.test.ts`)
- **Classes**: PascalCase (e.g., `ConfigManager`, `OpenRouterClient`)
- **Functions**: camelCase (e.g., `validateApiKey`, `chatStream`)
- **Constants**: camelCase for objects, UPPER_SNAKE_CASE for primitives
- **Interfaces**: PascalCase (e.g., `TokenUsage`, `OpenRouterMessage`)
- **Types**: PascalCase (e.g., `ConfigType`)

## Code Organization

### Directory Structure

```
src/
├── commands/     # CLI command implementations
├── lib/          # Core business logic
├── mastra/       # Mastra AI agent configurations
├── utils/        # Utility functions and helpers
└── index.ts      # CLI entry point
```

### File Patterns

- **Commands**: One command per file in `src/commands/`
- **Libraries**: Core logic grouped by functionality in `src/lib/`
- **Utilities**: Helper functions and display logic in `src/utils/`
- **Tests**: Co-located with source files (e.g., `cost-tracker.ts` + `cost-tracker.test.ts`)
- **Exports**: Use named exports, avoid default exports

## Formatting (Prettier)

Automated via Prettier with the following rules:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: 120 characters max
- **Trailing Commas**: ES5 style
- **Arrow Parens**: Avoid when possible

Configuration file: `.prettierrc.json`

Run formatting:

```bash
npm run format        # Format all files
npm run format:check  # Check formatting without changes
```

## Linting (ESLint)

ESLint v9 with flat config and TypeScript support.

### Key Rules

- **Type Safety**: All type-checking rules enabled
- **Unused Variables**: Error, except for `_` prefix
- **Explicit Any**: Warning only
- **Floating Promises**: Error (must handle async)
- **Import Extensions**: Required for `.ts` files (use `.js`)
- **Console**: Allowed (needed for CLI output)

### Test-Specific Rules

- `@typescript-eslint/unbound-method`: Disabled for `*.test.ts` files
- `@typescript-eslint/require-await`: Disabled for `*.test.ts` files

Configuration file: `eslint.config.js`

Run linting:

```bash
npm run lint      # Check for errors
npm run lint:fix  # Auto-fix where possible
```

## Type Safety

- **Zod Schemas**: Use for runtime validation
  ```typescript
  const _configSchema = z.object({
    openrouterApiKey: z.string().optional(),
    defaultModel: z.string().default('anthropic/claude-3.5-sonnet'),
  });
  ```
- **Type Inference**: Derive types from Zod schemas
  ```typescript
  export type ConfigType = z.infer<typeof _configSchema>;
  ```
- **Explicit Return Types**: Required for public functions
- **Async/Await**: Use async/await over raw promises
- **Type Assertions**: Use `as Type` when necessary for external APIs
  ```typescript
  const parsed = JSON.parse(jsonStr) as OpenRouterStreamChunk;
  const errorData = error.response?.data as { error?: { message?: string } } | undefined;
  ```

## Error Handling

- Use try-catch blocks for async operations
- Check for axios errors specifically: `axios.isAxiosError(error)`
- Provide user-friendly error messages via `Display.error()`
- Don't expose sensitive information in error messages
- Handle different error types appropriately:
  ```typescript
  catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { error?: { message?: string } } | undefined;
      const errorMsg = errorData?.error?.message || error.message;
      throw new Error(`OpenRouter API error: ${errorMsg}`);
    }
    throw error;
  }
  ```

## Testing

### Test Structure

- Use Vitest for unit tests
- Mock external dependencies (axios, configStore)
- Use `describe` blocks for grouping related tests
- Use `beforeEach` for test setup
- Clear mocks between tests

### Naming Conventions

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

### Mocking

```typescript
vi.mock('axios');
vi.mock('../utils/storage.js', () => ({
  configStore: {
    get: vi.fn(),
    set: vi.fn(),
    // ... other methods
  },
}));
```

### Assertions

- Use `expect().toBe()` for primitives
- Use `expect().toEqual()` for objects/arrays
- Use `expect().toBeCloseTo()` for floating point numbers
- Use `expect().toHaveBeenCalledWith()` for function calls

Run tests:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage
```

## Comments and Documentation

- **No JSDoc**: Code is self-documenting through TypeScript types
- **Inline Comments**: Used sparingly for complex logic only
- **TODO Comments**: Discouraged; use GitHub issues instead
- **README**: Comprehensive documentation in README.md

## Git Workflow

### Pre-commit Automation

Husky and lint-staged automatically run on every commit:

1. ESLint with auto-fix on staged `.ts` files
2. Prettier formatting on staged `.ts`, `.json`, `.md` files
3. All unit tests must pass

### Commit Messages

Follow conventional commit style:

- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issues when applicable
- Include co-author attribution for AI assistance:

  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

## Best Practices

### Async Patterns

- Always handle promises (avoid floating promises)
- Use `void` operator for intentionally ignored promises:
  ```typescript
  void this.handleCommand(trimmed).then(() => {
    this.rl.prompt();
  });
  ```

### Function Organization

- Keep functions small and focused
- Extract complex logic into separate functions
- Use early returns to reduce nesting
- Prefer composition over inheritance

### Performance

- Avoid unnecessary re-renders
- Use streaming for large responses
- Estimate tokens efficiently (~4 chars per token)
- Don't buffer entire responses in memory

### Security

- Never commit API keys or secrets
- Store sensitive data in `.env` (gitignored)
- Use environment variables for configuration
- Sanitize user input before API calls
