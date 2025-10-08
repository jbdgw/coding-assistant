# AI Coding CLI - Project Overview

## Purpose

A personal AI coding assistant CLI tool that provides interactive chat sessions with multiple AI models through OpenRouter. The tool features persistent memory across sessions, code execution capabilities, and access to documentation through MCP (Model Context Protocol).

## Key Features

### Core Features
- **Multi-Model Support**: Access to 200+ AI models via OpenRouter API
- **Interactive Chat**: Real-time streaming responses with syntax highlighting
- **Cost Tracking**: Per-message and session-level token usage and cost tracking
- **Model Switching**: Change models mid-conversation without losing context
- **Budget Controls**: Optional spending limits per session

### Persistent Memory System (New)
- **Session Management**: Save and resume conversations across sessions
- **Working Memory**: Cross-session user profile with coding preferences, projects, and patterns
- **Semantic Search**: Vector-based search across conversation history (requires OpenAI API key)
- **Session Commands**: List, resume, search, and delete past sessions
- **User Preferences**: Explicit preference storage with confidence scoring

### Code Execution (E2B Integration)
- **Sandbox Execution**: Run Python, JavaScript, and TypeScript in isolated E2B environments
- **File Operations**: Create, read, and list files in the sandbox
- **Iterative Development**: Test code, fix errors, and iterate in real-time

### Documentation Access (MCP Integration)
- **Mastra Docs**: Direct access to Mastra.ai documentation and examples
- **MCP Protocol**: Model Context Protocol for connecting to external tools and resources
- **Documentation Search**: Agent can search and retrieve official documentation

### Smart Model Routing
- **Complexity-Based Routing**: Automatically selects appropriate models based on task complexity
- **Cost Optimization**: Balance performance and cost with configurable strategies
- **Usage Analytics**: Track model performance and costs in SQLite database

### RAG Code Search
- **Codebase Indexing**: Index and search through local codebases
- **Vector Search**: ChromaDB integration for semantic code search
- **Context Retrieval**: Find relevant code examples from past projects

## Target Users

Developers who want a flexible, cost-aware AI coding assistant with:
- Persistent memory of preferences and past conversations
- Code execution and verification capabilities
- Access to documentation and indexed codebases
- Multi-model support through a single interface

## Architecture

- **Frontend**: Terminal-based CLI with rich formatting
- **Backend**: TypeScript with Mastra AI framework
- **API Integration**: OpenRouter for unified multi-model access
- **Memory**: Mastra Memory with LibSQL storage + OpenAI embeddings for semantic recall
- **Session Storage**: SQLite databases (usage.db for metadata, memory.db for Mastra storage)
- **Code Execution**: E2B sandboxed environments
- **Documentation**: MCP client for Mastra documentation server
- **Vector Search**: ChromaDB for RAG capabilities
- **Configuration**: Secure local storage via `conf` package
- **Streaming**: Real-time response streaming with AI SDK