# Architecture and Design Patterns

## Project Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│     CLI Interface (index.ts)        │  ← Entry point
├─────────────────────────────────────┤
│     Commands Layer (commands/)      │  ← User interactions
├─────────────────────────────────────┤
│  Business Logic Layer (lib/)        │  ← Core functionality
├─────────────────────────────────────┤
│  External APIs (OpenRouter)         │  ← API integration
├─────────────────────────────────────┤
│  Utilities & Display (utils/)       │  ← Helper functions
└─────────────────────────────────────┘
```

## Design Patterns

### 1. Singleton Pattern

- **ConfigManager**: Single instance manages all configuration
- **CostTracker**: Session-level singleton for cost tracking
- **Display**: Static utility class for terminal output

### 2. Factory Pattern

- **createChatAgent()**: Factory function for creating Mastra agents
- Allows dynamic model configuration

### 3. Strategy Pattern

- **OpenRouter Client**: Different strategies for streaming vs. non-streaming
- **chatStream()** returns object with stream generator and usage getter
- **chat()** returns simple promise with content and usage

### 4. Repository Pattern

- **ConfigStore**: Abstracts configuration storage
- Uses `conf` package for cross-platform config management
- Provides clean interface for get/set operations

## Key Components

### OpenRouter Client (`src/lib/openrouter.ts`)

**Purpose**: Abstraction layer over OpenRouter API
**Pattern**: Streaming with closure for token tracking

```typescript
async chatStream(): Promise<{
  stream: AsyncGenerator<string>,
  getUsage: () => TokenUsage
}>
```

**Design Choice**: Returns object with stream and usage getter because:

- AsyncGenerator return values are tricky in TypeScript
- Closure captures token counts during streaming
- Clean separation of streaming content and metadata

### Chat Loop (`src/lib/chat-loop.ts`)

**Purpose**: Main interactive loop for chat sessions
**Responsibilities**:

- User input handling
- Command parsing (slash commands)
- Response streaming
- Cost tracking
- Conversation history management

**Design Choice**: Class-based for state management

- Maintains conversation history
- Holds references to client, tracker, readline interface

### Cost Tracker (`src/lib/cost-tracker.ts`)

**Purpose**: Token usage and cost calculation
**Pattern**: Accumulator with model-specific pricing
**Data Structure**: Array of CostInfo objects for per-message tracking

### Display Utilities (`src/utils/display.ts`)

**Purpose**: Terminal output formatting
**Pattern**: Static utility class
**Features**:

- Markdown rendering with syntax highlighting
- Color-coded messages (info, success, error, warning)
- Consistent formatting across application

## Data Flow

### Chat Session Flow

```
User Input
    ↓
Chat Loop (handleMessage)
    ↓
OpenRouter Client (chatStream)
    ↓
Stream Chunks → Display
    ↓
getUsage() → Cost Tracker
    ↓
Display Usage Info
    ↓
Update History
```

### Configuration Flow

```
Init Command
    ↓
Inquirer Prompts
    ↓
Validate API Key (OpenRouter)
    ↓
ConfigManager.setConfig()
    ↓
ConfigStore (conf package)
    ↓
File System (~/.config/ai-coding-cli-nodejs/)
```

## Async Patterns

### Streaming with Token Tracking

**Challenge**: Need token count after streaming completes
**Solution**: Closure pattern

```typescript
let tokenCount = 0;
const generator = async function* () {
  // yield chunks
  tokenCount += estimateTokens(chunk);
};
const getUsage = () => ({ tokens: tokenCount });
return { stream: generator(), getUsage };
```

### Error Handling

- All async operations wrapped in try-catch
- Specific handling for axios errors
- User-friendly error messages via Display class
- Graceful degradation when possible

## Extension Points

### Adding New Commands

1. Create file in `src/commands/`
2. Export async function
3. Register in `src/index.ts` with Commander
4. Add to help command

### Adding New Models/Providers

- Handled automatically via OpenRouter
- No code changes needed for new models
- Model list fetched dynamically from API

### Custom Display Formatters

- Extend `Display` class with new static methods
- Use chalk for consistent styling
- Follow existing patterns for info/success/error

## Performance Considerations

### Token Estimation

- Rough approximation: 4 chars ≈ 1 token
- Acceptable for cost estimation
- Real usage from API when available

### Memory Management

- Conversation history kept in memory during session
- Cleared on `/clear` command or session end
- No persistence between sessions

### Streaming Efficiency

- Chunks written directly to stdout
- No buffering of full response
- Immediate feedback to user
