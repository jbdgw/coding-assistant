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
- **Exports**: Use named exports, avoid default exports

## Type Safety

- **Zod Schemas**: Use for runtime validation
  ```typescript
  const configSchema = z.object({
    openrouterApiKey: z.string().optional(),
    defaultModel: z.string().default('anthropic/claude-3.5-sonnet'),
  });
  ```
- **Type Inference**: Derive types from Zod schemas
  ```typescript
  export type ConfigType = z.infer<typeof configSchema>;
  ```
- **Explicit Return Types**: Specify return types for public functions
- **Async/Await**: Use async/await over promises

## Error Handling

- Use try-catch blocks for async operations
- Check for axios errors specifically: `axios.isAxiosError(error)`
- Provide user-friendly error messages via `Display.error()`
- Don't expose sensitive information in error messages

## Comments and Documentation

- **No JSDoc**: Code is self-documenting through TypeScript types
- **Inline Comments**: Used sparingly for complex logic only
- **README**: Comprehensive documentation in README.md

## Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Used consistently
- **Line Length**: No strict limit, but keep readable
- **Trailing Commas**: Not enforced
