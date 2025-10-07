# E2B Sandbox Integration Architecture

## Overview
The CLI now integrates E2B code execution sandbox capabilities through Mastra agent tools, allowing the AI agent to execute code, manage files, and handle multi-file projects in a secure environment.

## Core Components

### E2BSandboxManager (`src/lib/e2b-sandbox-manager.ts`)
- **Pattern**: Singleton with lazy loading
- **Purpose**: Manages E2B sandbox lifecycle for the entire chat session
- **Key Features**:
  - Lazy initialization: Sandbox created only on first code execution
  - Session persistence: Same sandbox reused across multiple executions
  - Automatic timeout extension: Extends sandbox lifetime every 2 minutes
  - Graceful cleanup: Automatically closes sandbox when session ends
  - Error handling: Comprehensive error messages for debugging

**Key Methods**:
- `getInstance(config)`: Returns singleton instance
- `executeCode(code, language)`: Executes Python/JS/TS code
- `writeFile(path, content)`: Creates/overwrites single file
- `writeFiles(files)`: Batch file creation
- `readFile(path)`: Reads file content
- `listFiles(path)`: Lists directory contents
- `cleanup()`: Closes sandbox and releases resources

### Mastra Tools (`src/mastra/tools/`)
Five tools implementing E2B capabilities following Mastra's `createTool()` pattern:

1. **execute_code** (`e2b-execute-code.ts`)
   - Executes code in secure sandbox
   - Returns stdout, stderr, exit code, and structured results
   - Supports Python, JavaScript, TypeScript

2. **write_file** (`e2b-file-operations.ts`)
   - Creates or overwrites single file in sandbox

3. **write_multiple_files** (`e2b-file-operations.ts`)
   - Batch file creation for multi-file projects

4. **read_file** (`e2b-file-operations.ts`)
   - Reads file content from sandbox

5. **list_files** (`e2b-file-operations.ts`)
   - Lists directory contents in sandbox

All tools:
- Check for E2B_API_KEY before execution
- Return user-friendly error messages if E2B not configured
- Use singleton E2BSandboxManager instance
- Follow Mastra's Zod schema pattern for type safety

### Chat Agent Integration (`src/mastra/agents/chat-agent.ts`)
- **OpenRouter Provider**: Uses `@openrouter/ai-sdk-provider` (official package)
- **Conditional Tools**: E2B tools added only if E2B_API_KEY is set
- **Enhanced Instructions**: Agent knows when to use E2B tools
- **Tool Calling**: Supports up to 10 steps for complex multi-tool workflows

### MastraChatLoop (`src/lib/chat-loop-mastra.ts`)
**Critical Fix**: Previous chat loop bypassed Mastra agent, calling OpenRouter directly. New implementation:
- Uses `agent.generate()` instead of direct API calls
- Enables tool calling with `maxSteps: 10`
- Properly tracks token usage from agent results
- Handles E2B sandbox cleanup on session end

## Configuration

### Environment Variables
```bash
E2B_API_KEY=e2b_***              # Required for E2B features
E2B_TIMEOUT_MS=300000            # Optional: Sandbox timeout (default 5min)
E2B_AUTO_CLEANUP=true            # Optional: Auto cleanup on exit
```

### ConfigStore Schema (`src/utils/storage.ts`)
Added `e2bApiKey` field to configuration schema

### Init Command (`src/commands/init.ts`)
Interactive E2B setup:
- Prompts user if they want to set up E2B
- Validates E2B API key format (must start with "e2b_")
- Saves to config store

## Important Implementation Details

### OpenRouter Integration
**CRITICAL**: Must use `@openrouter/ai-sdk-provider`, NOT `@ai-sdk/openai`

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// In agent:
model: openrouter("anthropic/claude-3.5-sonnet")
```

### Entry Point Fix (`src/index.ts`)
**CRITICAL**: Added `import 'dotenv/config';` at top to load .env file

### Session Lifecycle
1. User starts chat with `chat` command
2. First code execution request creates E2B sandbox
3. Sandbox persists for entire session (timeout extended automatically)
4. On exit, `cleanup()` closes sandbox and releases resources

## Display Utilities (`src/utils/e2b-display.ts`)
Helper functions for formatting E2B execution results:
- `executionResult()`: Displays stdout, stderr, errors, structured results
- `fileOperation()`: Shows file operation success/failure
- `fileList()`: Lists files in directory
- `fileContent()`: Displays file contents
- `sandboxInfo()`: Shows sandbox metadata
- `executionStatus()`: Shows execution success/failure with exit code

## Testing Strategy
- E2BSandboxManager tested manually with test-e2b.js
- Verified tools load correctly in agent
- Confirmed agent.generate() uses tools properly
- All existing unit tests pass (45 tests)

## Documentation-First Protocol
Added `.claude/instructions.md` requiring:
1. Always check `mcp__mastra__mastraDocs` before implementing Mastra features
2. Use `mcp__Ref__ref_search_documentation` for other frameworks
3. Never guess implementation approaches
4. Follow official integration patterns

## Known Issues & Limitations
- Type safety: Had to use type assertions for `result.usage` properties due to Mastra's broad typing
- Husky deprecation warning: v10 will break current pre-commit hook format
- E2B sandbox costs money per execution minute (user responsible for billing)
