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

## Module System

- ES Modules (type: "module" in package.json)
- Module resolution: "bundler"
- Target: ES2022
