# AI Coding CLI - Project Overview

## Purpose

A personal AI coding assistant CLI tool that provides interactive chat sessions with multiple AI models through OpenRouter. The tool helps developers write, debug, and improve code with real-time streaming responses, cost tracking, and model switching capabilities.

## Key Features

- **Multi-Model Support**: Access to 200+ AI models via OpenRouter API
- **Interactive Chat**: Real-time streaming responses with syntax highlighting
- **Cost Tracking**: Per-message and session-level token usage and cost tracking
- **Model Switching**: Change models mid-conversation without losing context
- **Conversation History**: Maintains context throughout the session
- **Budget Controls**: Optional spending limits per session
- **In-Chat Commands**: Built-in commands for model management, history clearing, and cost reporting

## Target Users

Developers who want a flexible, cost-aware AI coding assistant with access to multiple LLM providers through a single interface.

## Architecture

- **Frontend**: Terminal-based CLI with rich formatting
- **Backend**: TypeScript with Mastra AI framework
- **API Integration**: OpenRouter for unified multi-model access
- **Configuration**: Secure local storage via `conf` package
- **Streaming**: Real-time response streaming with SSE (Server-Sent Events)
