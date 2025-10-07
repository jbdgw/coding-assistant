# Project Instructions for AI Coding CLI

## Documentation-First Protocol

**CRITICAL: Always check documentation before implementing anything.**

### 1. Check Available Documentation Tools FIRST

Before writing any code or proposing solutions:

- ✅ **For Mastra questions**: Use `mcp__mastra__mastraDocs`
  - Search for relevant keywords
  - Read the official implementation guide
  - Check examples in `mcp__mastra__mastraExamples`

- ✅ **For other frameworks/libraries**: Use `mcp__Ref__ref_search_documentation`
  - Search public documentation
  - Read implementation guides
  - Verify API usage

- ✅ **For E2B Sandbox**: Check E2B documentation via Ref tool
  - Official API reference
  - Best practices
  - Code examples

### 2. Implementation Order

1. **Search docs** for the specific feature/integration
2. **Read the official approach** completely
3. **Check for examples** in the documentation
4. **Verify compatibility** with current setup
5. **Implement following the official pattern**
6. **Only deviate** if there's a documented reason

### 3. What NOT to Do

❌ Don't guess implementation approaches
❌ Don't try alternative methods without checking docs first
❌ Don't mix different provider SDKs without verifying compatibility
❌ Don't assume patterns from other frameworks apply here

### 4. When Stuck

If encountering errors or issues:

1. **Re-check the documentation** for the specific error
2. **Search for the exact error message** in docs
3. **Look for troubleshooting sections**
4. **Check version compatibility**
5. **Ask user to verify** before proceeding with workarounds

## Project-Specific Guidelines

### Architecture

This project uses:

- **Mastra AI Framework** for agents and tools
- **OpenRouter** for LLM access (via `@openrouter/ai-sdk-provider`)
- **E2B Sandbox** for safe code execution
- **TypeScript** with ES Modules

### Key Files

- `src/mastra/agents/chat-agent.ts` - Main agent with E2B tools
- `src/mastra/tools/` - E2B tool implementations
- `src/lib/e2b-sandbox-manager.ts` - Sandbox lifecycle management
- `src/lib/chat-loop-mastra.ts` - Mastra-powered chat loop
- `.env` - Configuration (OPENROUTER_API_KEY, E2B_API_KEY)

### Configuration Sources

1. **Environment variables** (`.env`) - Primary source
2. **Config store** (`~/.config/ai-coding-cli/`) - Fallback
3. **Defaults** in code

Priority: `.env` > config store > defaults

### Testing

Before claiming something works:

1. Run `npm run dev -- chat`
2. Test the specific feature
3. Verify E2B tools are loaded
4. Confirm execution works

## Remember

**The MCP documentation tools are there for a reason - USE THEM FIRST!**

Don't waste time debugging issues that the official docs already solve.
