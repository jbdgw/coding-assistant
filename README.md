# AI Coding CLI

A powerful personal AI coding assistant CLI tool built with **Mastra AI** and **OpenRouter** for multi-model access.

## Features

- 🤖 **Multi-Model Support**: Access 200+ AI models through OpenRouter
- 💬 **Interactive Chat**: Stream responses in real-time with syntax highlighting
- 💰 **Cost Tracking**: Track token usage and costs per message and session
- 🔄 **Model Switching**: Switch models mid-conversation
- 📊 **Budget Limits**: Set optional budget limits to control spending
- 🎨 **Syntax Highlighting**: Beautiful code formatting in terminal
- 💾 **Conversation History**: Maintain context throughout the session

## Prerequisites

- Node.js 20 or higher
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

### 1. Initialize Configuration

```bash
npm run dev -- init
```

This will prompt you to configure:

- OpenRouter API key
- Default model selection
- Temperature and max tokens
- Optional budget limit

### 2. Start Chatting

```bash
# Start with default model
npm run dev -- chat

# Start with specific model
npm run dev -- chat --model anthropic/claude-3-opus
```

### 3. List Available Models

```bash
npm run dev -- models
```

## Usage

### CLI Commands

| Command                        | Description                       |
| ------------------------------ | --------------------------------- |
| `my-cli init`                  | Configure API key and preferences |
| `my-cli chat [--model <name>]` | Start interactive chat session    |
| `my-cli models`                | List all available models         |
| `my-cli help`                  | Show help information             |

### In-Chat Commands

| Command               | Description                 |
| --------------------- | --------------------------- |
| `/model <model-name>` | Switch to a different model |
| `/models`             | Show available models       |
| `/clear`              | Clear conversation history  |
| `/cost`               | Show session cost summary   |
| `/help`               | Show available commands     |
| `/exit`               | End chat session            |

## Project Structure

```
src/
├── commands/          # CLI command implementations
│   ├── init.ts       # Initialize configuration
│   ├── chat.ts       # Chat session
│   ├── models.ts     # List models
│   └── help.ts       # Help command
├── lib/
│   ├── config.ts     # Configuration manager
│   ├── openrouter.ts # OpenRouter API client
│   ├── chat-loop.ts  # Chat loop handler
│   └── cost-tracker.ts # Cost tracking
├── mastra/
│   ├── agents/       # Mastra agents
│   └── index.ts      # Mastra instance
├── utils/
│   ├── display.ts    # Terminal display utilities
│   └── storage.ts    # Config storage
└── index.ts          # CLI entry point
```

## Configuration

Configuration is stored in your system's config directory:

- macOS: `~/Library/Preferences/ai-coding-cli-nodejs/`
- Linux: `~/.config/ai-coding-cli-nodejs/`
- Windows: `%APPDATA%\ai-coding-cli-nodejs\`

## Tech Stack

- **Mastra AI**: Agent framework with memory and streaming support
- **OpenRouter**: Unified API for 200+ AI models
- **TypeScript**: Type-safe development
- **Commander.js**: CLI framework
- **Inquirer**: Interactive prompts
- **Chalk**: Terminal styling
- **Ora**: Loading spinners
- **Marked + Highlight.js**: Markdown and code syntax highlighting

## Development

### Prerequisites

- Node.js 20 or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build
```

### Code Quality

This project uses several tools to maintain code quality:

#### Linting

```bash
# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint:fix
```

#### Formatting

```bash
# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

#### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Git Hooks

Pre-commit hooks are configured with Husky and lint-staged to automatically:

- Run ESLint and fix issues
- Format code with Prettier
- Run all tests

### CI/CD

GitHub Actions workflows run on every push and pull request:

- Lint checking
- Code formatting validation
- Unit tests
- Build verification
- Coverage reporting

Workflows test against Node.js versions 20.x and 22.x.

### VS Code

Recommended extensions are configured in `.vscode/extensions.json`:

- ESLint
- Prettier
- Vitest Explorer
- Error Lens
- Code Spell Checker

Settings are pre-configured for:

- Format on save
- ESLint auto-fix
- Vitest integration

## License

MIT
