# Tech Stack

## Core Dependencies

- **TypeScript**: v5.8.3 - Type-safe development with strict mode enabled
- **Node.js**: >=20.0.0 - Runtime requirement
- **Mastra AI**: latest - Agent framework with memory and streaming support
  - `@mastra/core`: Core agent functionality
  - `@mastra/loggers`: PinoLogger for logging
  - `@mastra/memory`: Memory management for agents
- **OpenRouter**: Unified API for 200+ AI models (via axios HTTP client)

## CLI Framework

- **Commander.js**: v12.1.0 - Command-line interface framework
- **Inquirer**: v10.2.2 - Interactive command-line prompts
- **Chalk**: v5.3.0 - Terminal string styling and colors
- **Ora**: v8.1.0 - Elegant terminal spinners

## Display & Formatting

- **Marked**: v14.1.2 - Markdown parser
- **Marked-Terminal**: v7.1.0 - Terminal renderer for markdown
- **Highlight.js**: v11.10.0 - Syntax highlighting for code blocks

## Data & Validation

- **Zod**: v3.23.8 - TypeScript-first schema validation
- **Conf**: v13.0.1 - Secure configuration storage
- **Axios**: v1.7.2 - HTTP client for OpenRouter API

## Build Tools

- **tsx**: v4.19.3 - TypeScript execution for development
- **tsc**: TypeScript compiler for production builds

## Development Tools

### Code Quality

- **ESLint**: v9.37.0 - Linter with TypeScript support
  - `@eslint/js`: ESLint JavaScript configuration
  - `typescript-eslint`: v8.46.0 - TypeScript ESLint plugin and parser
  - `eslint-plugin-import`: v2.32.0 - Import/export validation
  - `eslint-config-prettier`: v10.1.8 - Disable conflicting rules with Prettier

- **Prettier**: v3.6.2 - Code formatter
  - Configuration: `.prettierrc.json`
  - Rules: 2 spaces, single quotes, 120 char width, semicolons

### Testing

- **Vitest**: v3.2.4 - Unit testing framework
  - `@vitest/ui`: v3.2.4 - Interactive UI for tests
  - `happy-dom`: v19.0.2 - DOM environment for testing
  - Coverage provider: v8
  - Configuration: `vitest.config.ts`

### Git Hooks

- **Husky**: v9.1.7 - Git hooks management
  - Pre-commit hook configuration: `.husky/pre-commit`
- **lint-staged**: v16.2.3 - Run linters on staged files
  - Auto-fix ESLint errors
  - Auto-format with Prettier
  - Run tests before commit

### Type Definitions

- `@types/node`: v20.17.57 - Node.js type definitions
- `@types/inquirer`: v9.0.7 - Inquirer type definitions
- `@types/marked-terminal`: v3.1.3 - Marked-terminal type definitions

## Module System

- ES Modules (type: "module" in package.json)
- Module resolution: "bundler"
- Target: ES2022

## CI/CD

- **GitHub Actions**: Continuous integration
  - Workflow: `.github/workflows/ci.yml`
  - Tests on Node.js 20.x and 22.x
  - Runs: lint, format check, tests, build
  - Coverage reporting with Codecov

## Development Environment

### VS Code Integration

- Recommended extensions (`.vscode/extensions.json`):
  - ESLint (dbaeumer.vscode-eslint)
  - Prettier (esbenp.prettier-vscode)
  - Vitest Explorer (vitest.explorer)
  - TypeScript (ms-vscode.vscode-typescript-next)
  - Error Lens (usernamehw.errorlens)
  - Code Spell Checker (streetsidesoftware.code-spell-checker)

- Workspace settings (`.vscode/settings.json`):
  - Format on save with Prettier
  - ESLint auto-fix on save
  - Vitest integration enabled
  - TypeScript workspace version

## Scripts

### Development

- `npm run dev` - Run TypeScript directly with tsx
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled JavaScript

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Run tests with coverage report

### Git

- `npm run prepare` - Install Husky hooks (runs automatically)

## Configuration Files

- `tsconfig.json` - TypeScript compiler configuration
- `eslint.config.js` - ESLint flat config
- `.prettierrc.json` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `vitest.config.ts` - Vitest test configuration
- `package.json` - Dependencies and scripts
- `.gitignore` - Git ignore patterns
- `.vscode/` - VS Code workspace settings
- `.github/workflows/` - GitHub Actions workflows
- `.husky/` - Git hooks

## External APIs

- **OpenRouter API**: https://openrouter.ai/api/v1
  - Authentication: Bearer token
  - Endpoints:
    - `/models` - List available models
    - `/chat/completions` - Chat completion (streaming and non-streaming)
  - Response format: OpenAI-compatible
  - SSE streaming support
