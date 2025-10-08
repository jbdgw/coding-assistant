# Architecture and Design Patterns

## Project Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────┐
│     CLI Interface (index.ts)                    │  ← Entry point
├─────────────────────────────────────────────────┤
│     Commands Layer (commands/)                  │  ← User interactions
│     - chat, init, sessions, resume, etc.        │
├─────────────────────────────────────────────────┤
│  Business Logic Layer (lib/)                    │  ← Core functionality
│  - chat-loop-mastra.ts (main chat loop)         │
│  - session-manager.ts (session CRUD)            │
│  - memory-instance.ts (Mastra Memory)           │
│  - provider-manager.ts (smart routing)          │
│  - e2b-sandbox-manager.ts (code execution)      │
├─────────────────────────────────────────────────┤
│  Mastra Layer (mastra/)                         │  ← AI framework
│  - agents/ (chat agent configuration)           │
│  - tools/ (E2B, RAG, docs tools)                │
│  - mcp/ (documentation MCP client)              │
├─────────────────────────────────────────────────┤
│  Storage Layer                                  │  ← Data persistence
│  - usage.db (sessions, preferences, analytics)  │
│  - memory.db (Mastra threads & messages)        │
│  - chroma/ (vector embeddings for RAG)          │
├─────────────────────────────────────────────────┤
│  External APIs                                  │  ← External services
│  - OpenRouter (multi-model LLM access)          │
│  - E2B (code sandboxes)                         │
│  - OpenAI (embeddings for semantic search)      │
│  - MCP Servers (documentation access)           │
└─────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Singleton Pattern

- **ConfigManager**: Single instance manages all configuration
- **CostTracker**: Session-level singleton for cost tracking
- **E2BSandboxManager**: Lazy-loaded singleton for sandbox management
- **Memory Instance**: Single shared Mastra Memory instance across all sessions
- **Display**: Static utility class for terminal output

### 2. Factory Pattern

- **createChatAgent()**: Async factory function for creating Mastra agents with MCP tools
- **createMemory()**: Factory for Mastra Memory configuration
- Allows dynamic model and tool configuration

### 3. Strategy Pattern

- **ProviderManager**: Different routing strategies (cost-optimized, balanced, performance)
- **Smart Routing**: Complexity-based model selection
- **Memory Scope**: Thread-scoped vs resource-scoped memory

### 4. Repository Pattern

- **ConfigStore**: Abstracts configuration storage
- **SessionManager**: CRUD operations for chat sessions
- **UsageDb**: SQLite operations for usage tracking and preferences
- Uses `better-sqlite3` for synchronous SQLite access

### 5. Lazy Loading Pattern

- **Agent initialization**: Agent created on first message to avoid startup delay
- **E2B Sandbox**: Only initialized when first used
- **MCP Tools**: Loaded asynchronously during agent creation

## Key Components

### Chat Loop (`src/lib/chat-loop-mastra.ts`)

**Purpose**: Main interactive loop for chat sessions with persistent memory
**Pattern**: Class-based with lazy initialization
**Responsibilities**:

- User input handling and command parsing
- Agent initialization with MCP tools
- Session management (create, resume, track)
- Memory context (thread + resource IDs)
- Smart model routing (optional)
- Cost tracking and budget limits
- Error recovery with graceful handling

**Design Choices**:
- Agent initialized lazily on first message (avoids MCP loading delay at startup)
- Null-safe agent property (`Agent | null`)
- Resource ID based on hostname for consistent cross-session memory
- Thread ID per session for conversation isolation

### Session Manager (`src/lib/session-manager.ts`)

**Purpose**: CRUD operations for chat sessions
**Pattern**: Repository pattern with SQLite backend
**Features**:

- Create, read, update, delete sessions
- Link to Mastra thread IDs
- Search and filtering with pagination
- Cost and message count tracking
- Session tagging and summaries

**Database Schema**:
```sql
sessions (
  id, thread_id, title, started_at, ended_at,
  message_count, total_cost, tags, summary, context_loaded
)
user_preferences (category, key, value, confidence, source_session_id)
learnings (category, insight, confidence, evidence)
projects (name, tech_stack, context)
common_patterns (pattern_type, pattern_name, code_snippet, usage_count)
```

### Memory Instance (`src/lib/memory-instance.ts`)

**Purpose**: Shared Mastra Memory configuration
**Pattern**: Singleton with factory
**Features**:

- LibSQL storage for threads and messages
- OpenAI embeddings for semantic recall (optional)
- Resource-scoped working memory (persistent user profile)
- Conversation history (last 20 messages)
- Cross-session semantic search (requires OPENAI_API_KEY)

**Design Choices**:
- Graceful degradation without OpenAI key (working memory still works)
- Database in user config directory (~/.config/ai-coding-cli-nodejs/memory.db)
- Working memory template for structured user profiling

### Chat Agent (`src/mastra/agents/chat-agent.ts`)

**Purpose**: Async factory for Mastra Agent with dynamic tools
**Pattern**: Factory with conditional composition
**Features**:

- Loads MCP documentation tools from docs server
- E2B tools (execute_code, write_file, etc.) if configured
- RAG search tool if Ollama configured
- OpenRouter integration for multi-model access
- Memory-aware instructions for persistent learning

**Design Choice**: Made async to load MCP tools via `await docsMcpClient.getTools()`

### MCP Documentation Client (`src/mastra/mcp/docs-mcp-client.ts`)

**Purpose**: Connect to Mastra documentation MCP server
**Pattern**: MCP client with npx server invocation
**Configuration**:
```typescript
new MCPClient({
  servers: {
    mastra: {
      command: 'npx',
      args: ['-y', '@mastra/mcp-docs-server@latest']
    }
  }
})
```

**Tools Provided**:
- `mcp__mastra__mastraDocs`: Search Mastra documentation
- `mcp__mastra__mastraExamples`: Get code examples
- `mcp__mastra__mastraChanges`: Get changelog information

### E2B Sandbox Manager (`src/lib/e2b-sandbox-manager.ts`)

**Purpose**: Manage E2B code execution sandboxes
**Pattern**: Lazy-loaded singleton with automatic cleanup
**Features**:

- On-demand sandbox creation
- Singleton instance per process
- Automatic cleanup on exit
- Timeout and error handling

### Provider Manager (`src/lib/provider-manager.ts`)

**Purpose**: Smart model routing based on task complexity
**Pattern**: Strategy pattern with pluggable routing algorithms
**Features**:

- Complexity analysis (simple, moderate, complex, expert)
- Cost optimization strategies (cost-optimized, balanced, performance)
- Usage tracking in SQLite
- Budget limits and alerts

### RAG System (`src/lib/vector-store.ts`, `src/mastra/tools/rag-search.ts`)

**Purpose**: Search indexed codebases for relevant examples
**Pattern**: Vector search with ChromaDB
**Features**:

- Codebase indexing with Crawl4AI
- Semantic search with similarity scoring
- Source file citation

## Data Flow

### Chat Session Flow with Memory

```
User Input
    ↓
Chat Loop (handleMessage)
    ↓
Lazy Initialize Agent (first message only)
    ↓
Load MCP Tools (docs server)
    ↓
Smart Routing (optional complexity analysis)
    ↓
Agent.generate(userMessage, {
    memory: { thread, resource },
    maxSteps: 10
})
    ↓
Tool Calls (E2B, RAG, MCP docs)
    ↓
Update Working Memory (automatic)
    ↓
Stream Response → Display
    ↓
Track Usage → Cost Tracker + Database
    ↓
Update Session (message count, cost)
    ↓
Add to Conversation History
```

### Session Resume Flow

```
Resume Command (session ID)
    ↓
SessionManager.getSession()
    ↓
Get thread_id from session
    ↓
Create ChatLoop with sessionId
    ↓
Agent loads memory from thread_id
    ↓
Working memory retrieved by resource_id
    ↓
Continue conversation with full context
```

### Memory Persistence Flow

```
User Message
    ↓
Agent.generate({ memory: { thread, resource } })
    ↓
Mastra Memory System:
  - Store message in thread (memory.db)
  - Update working memory in resource scope
  - Semantic embeddings (if OpenAI key)
    ↓
Next Session:
  - Same resource_id → retrieves working memory
  - Same thread_id → retrieves conversation
  - Different thread_id → new conversation, same profile
```

## Async Patterns

### Lazy Agent Initialization

**Challenge**: MCP tool loading adds startup delay
**Solution**: Defer agent creation until first message

```typescript
private agent: Agent | null = null;

async handleMessage(userMessage: string) {
  if (!this.agent) {
    this.agent = await createChatAgent(this.model, this.memory);
  }
  // use agent
}
```

### Error Handling

- Global `uncaughtException` and `unhandledRejection` handlers prevent crashes
- All async operations wrapped in try-catch
- Specific error messages for common issues (API keys, network, etc.)
- Chat continues after errors with helpful recovery messages
- Graceful shutdown without `process.exit()` for async cleanup

### Token Usage Tracking

**Challenge**: Different providers use different property names
**Solution**: Multi-property fallback

```typescript
const promptTokens = 
  usage.promptTokens ?? 
  usage.inputTokens ?? 
  usage.prompt_tokens ?? 
  0;
```

## Extension Points

### Adding New Commands

1. Create file in `src/commands/` (e.g., `new-command.ts`)
2. Export function returning Commander Command
3. Register in `src/index.ts`
4. Access SessionManager, Memory, etc. as needed

### Adding New Tools

1. Create tool in `src/mastra/tools/` using `createTool()`
2. Add to chat agent in `createChatAgent()`
3. Update agent instructions to explain when to use tool

### Adding New MCP Servers

1. Add server config to `docs-mcp-client.ts`
2. Tools automatically loaded via `getTools()`
3. No changes needed in agent code

### Custom Routing Strategies

1. Extend `ProviderManager` with new strategy
2. Add complexity analysis logic
3. Configure model selection rules

## Performance Considerations

### Database Performance

- SQLite with synchronous operations (better-sqlite3)
- Prepared statements for repeated queries
- Indexes on frequently queried columns
- Separate databases for different concerns (usage.db vs memory.db)

### Memory Management

- Working memory scoped to resource (user/machine)
- Conversation history limited to last 20 messages
- Semantic recall with configurable topK
- Thread isolation prevents cross-contamination

### MCP Tool Loading

- Lazy initialization avoids startup delay
- Tools cached for session duration
- Async loading doesn't block initial UI

### Vector Search (RAG)

- ChromaDB for efficient similarity search
- Embeddings cached in database
- Configurable result limits

## Security Considerations

- API keys stored in user config directory
- No API keys in code or git
- E2B sandboxes isolated from host system
- Database files in user-only accessible directory
- Graceful degradation when optional services unavailable