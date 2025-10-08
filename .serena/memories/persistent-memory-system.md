# Persistent Memory System

## Overview

The CLI now features a comprehensive persistent memory system that maintains user context across all chat sessions. This enables the AI to remember user preferences, past conversations, and learned insights indefinitely.

## Architecture

### Two-Database Approach

**usage.db** (Custom SQLite)
- Session metadata and tracking
- User preferences with confidence scoring
- Learned insights and patterns
- Project information
- Usage analytics

**memory.db** (Mastra LibSQL)
- Conversation threads and messages
- Resource-scoped working memory
- Vector embeddings for semantic search
- Managed automatically by @mastra/memory

## Key Components

### 1. Session Management

**File**: `src/lib/session-manager.ts`

**Purpose**: CRUD operations for chat sessions

**Features**:
- Create, read, update, delete sessions
- Link sessions to Mastra thread IDs
- Search and filter with pagination
- Track message counts and costs
- Tag sessions for organization

**Key Methods**:
```typescript
createSession(options: { threadId: string; title?: string }): Session
getSession(sessionId: string): Session | null
getSessionByThreadId(threadId: string): Session | null
updateSession(sessionId: string, options: UpdateSessionOptions): void
listSessions(options?: ListSessionsOptions): Session[]
searchSessions(query: string, limit?: number): Session[]
deleteSession(sessionId: string): void
```

**Database Schema**:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- nanoid generated
  thread_id TEXT UNIQUE NOT NULL,   -- Links to memory.db threads
  title TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  message_count INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,
  tags TEXT,                        -- JSON array
  summary TEXT,
  context_loaded TEXT               -- JSON array of context sources
);
```

### 2. Mastra Memory Configuration

**File**: `src/lib/memory-instance.ts`

**Purpose**: Shared Mastra Memory instance with LibSQL storage

**Features**:
- Conversation history (last 20 messages)
- Semantic recall with vector search (requires OPENAI_API_KEY)
- Resource-scoped working memory
- Thread-based conversation isolation

**Configuration**:
```typescript
new Memory({
  storage: new LibSQLStore({ url: 'file:~/.config/.../memory.db' }),
  vector: hasOpenAI ? new LibSQLVector({ ... }) : false,
  embedder: hasOpenAI ? openai.embedding('text-embedding-3-small') : undefined,
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,
      messageRange: 3,
      scope: 'resource'  // Cross-session recall
    },
    workingMemory: {
      enabled: true,
      scope: 'resource',  // Persistent across all sessions
      template: `# User Profile...`
    }
  }
})
```

**Graceful Degradation**:
- Without OPENAI_API_KEY: Working memory + conversation history still work
- Semantic recall disabled but other features remain functional
- Clear messaging about what's available

### 3. Thread and Resource IDs

**Thread ID**: Unique per conversation session
- Generated using nanoid (16 chars, alphanumeric)
- One thread = one chat session
- Stored in `sessions` table for linking
- Used to retrieve conversation history

**Resource ID**: Unique per user/machine
- Based on machine hostname: `user-${os.hostname()}`
- Consistent across all sessions
- Used for cross-session working memory
- Enables persistent user profiling

**Usage in Chat Loop**:
```typescript
const result = await this.agent.generate(userMessage, {
  memory: {
    thread: this.threadId,    // Session-specific conversation
    resource: this.resourceId  // Cross-session user profile
  }
});
```

### 4. Working Memory Template

**Purpose**: Structure for AI to maintain user profile

**Template Sections**:
- Personal Information (name, role)
- Coding Preferences (languages, style, conventions)
- Current Projects (tech stack, active work)
- Learning & Goals
- Common Mistakes to Avoid
- Important Notes

**Agent Instructions**:
The agent is instructed to:
- Update working memory with user preferences using `<working_memory>` tags
- Reference past conversations when relevant
- Apply known coding style automatically
- Avoid suggesting things the user dislikes
- Build on previous work and solutions

### 5. User Preferences Storage

**Table**: `user_preferences`

**Purpose**: Explicit preference storage with confidence tracking

**Schema**:
```sql
CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,           -- e.g., 'coding_style', 'tools', 'languages'
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,      -- 0.0 to 1.0
  source_session_id TEXT,           -- Where this was learned
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);
```

**Command**: `remember <key> <value> --category <cat> --confidence <0-1>`

**Examples**:
```bash
remember preferred_language typescript --category languages --confidence 1.0
remember indentation "2 spaces" --category coding_style
remember framework nextjs --category tools
```

### 6. Additional Learning Tables

**learnings**:
```sql
CREATE TABLE learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  insight TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  evidence TEXT,                    -- Supporting evidence
  created_at DATETIME,
  updated_at DATETIME
);
```

**projects**:
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  tech_stack TEXT,                  -- JSON array
  context TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

**common_patterns**:
```sql
CREATE TABLE common_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL,       -- e.g., 'error_handling', 'api_design'
  pattern_name TEXT NOT NULL,
  description TEXT,
  code_snippet TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(pattern_type, pattern_name)
);
```

## New Commands

### sessions
**Purpose**: List recent chat sessions

**Usage**:
```bash
my-cli sessions [options]
```

**Options**:
- `-l, --limit <number>`: Number of sessions to show (default: 20)
- `-s, --search <query>`: Search sessions by title or content
- `-t, --tags <tags>`: Filter by tags (comma-separated)

**Output**: Table with session ID, title, messages, cost, and date

### resume
**Purpose**: Resume a previous chat session

**Usage**:
```bash
my-cli resume <session-id>
```

**Behavior**:
- Loads session from database
- Retrieves thread ID
- Continues conversation with full context
- Working memory automatically loaded

### forget
**Purpose**: Delete a session

**Usage**:
```bash
my-cli forget <session-id> [-y|--yes]
```

**Behavior**:
- Prompts for confirmation (unless --yes flag)
- Deletes session from usage.db
- Keeps memory.db threads (for potential recovery)

### remember
**Purpose**: Store explicit user preference

**Usage**:
```bash
my-cli remember <key> <value> [options]
```

**Options**:
- `-c, --category <category>`: Category (default: 'general')
- `--confidence <number>`: Confidence level 0-1 (default: 1.0)

**Examples**:
```bash
my-cli remember framework nextjs -c tools
my-cli remember tabs_vs_spaces "2 spaces" -c coding_style --confidence 1.0
```

### recall
**Purpose**: Search past sessions

**Usage**:
```bash
my-cli recall <query> [options]
```

**Options**:
- `-l, --limit <number>`: Number of results (default: 10)
- `--semantic`: Use semantic search (requires OPENAI_API_KEY)

**Search Methods**:
1. Text search: Session titles and summaries
2. Semantic search: Vector similarity across all messages

## Memory Flow

### Session Creation

```
User starts chat
    ↓
Generate thread_id (nanoid)
    ↓
SessionManager.createSession({ threadId })
    ↓
Save to usage.db
    ↓
Agent.generate({ memory: { thread, resource } })
    ↓
Mastra creates thread in memory.db
```

### Session Resume

```
User runs: my-cli resume <session-id>
    ↓
SessionManager.getSession(sessionId)
    ↓
Get thread_id from session
    ↓
ChatLoop initialized with sessionId
    ↓
Agent loads memory:
  - thread: conversation history
  - resource: working memory (user profile)
    ↓
Continue conversation with full context
```

### Working Memory Update

```
User mentions preference/pattern
    ↓
Agent recognizes important info
    ↓
Agent uses <working_memory> tags
    ↓
Mastra updates resource-scoped memory
    ↓
Available in all future sessions
```

### Semantic Recall (with OpenAI)

```
User asks question
    ↓
Agent.generate({ memory: { thread, resource } })
    ↓
Mastra Memory System:
  1. Load last 20 messages (conversation history)
  2. Search vectors for similar messages (semanticRecall)
  3. Load working memory (resource scope)
    ↓
Combined context sent to LLM
    ↓
Response informed by all memory sources
```

## Best Practices

### For Users

1. **Use descriptive session commands**: The AI learns from every interaction
2. **Explicitly state preferences**: Use `remember` command for important settings
3. **Resume related work**: Use `resume` to continue complex tasks
4. **Search past work**: Use `recall` to find previous solutions
5. **Tag sessions**: Organize work by project or topic

### For Developers

1. **Thread vs Resource**: Use thread for session-specific, resource for user-wide
2. **Graceful degradation**: Always check for optional services (OpenAI, E2B)
3. **Session cleanup**: End sessions properly to save metadata
4. **Memory scope**: Be explicit about thread vs resource scope
5. **Database separation**: Keep custom tables in usage.db, let Mastra manage memory.db

## Configuration Requirements

### Required
- OPENROUTER_API_KEY: For LLM access
- None for basic memory (working memory + history)

### Optional
- OPENAI_API_KEY: Enables semantic search across history
- E2B_API_KEY: Enables code execution features
- OLLAMA_BASE_URL: Enables RAG code search

## File Locations

### Configuration Directory
`~/.config/ai-coding-cli-nodejs/`

### Database Files
- `usage.db`: Custom session and preference data
- `memory.db`: Mastra threads, messages, and working memory

### Access
All files are user-only accessible (proper permissions)

## Troubleshooting

### Memory not persisting
- Check database file exists: `~/.config/ai-coding-cli-nodejs/memory.db`
- Verify resource ID consistent (same hostname)
- Ensure session properly ended (saves metadata)

### Semantic search not working
- Requires OPENAI_API_KEY environment variable
- Check startup message for memory status
- Falls back to text search without OpenAI

### Sessions not found
- Use `my-cli sessions` to list all sessions
- Check session ID format (16 char alphanumeric)
- Verify database not corrupted

## Implementation Details

### Lazy Agent Initialization

The agent is created lazily on first message to avoid MCP tool loading delay at startup:

```typescript
private agent: Agent | null = null;

async handleMessage(userMessage: string) {
  if (!this.agent) {
    this.agent = await createChatAgent(this.model, this.memory);
  }
  // Use agent...
}
```

### Session Lifecycle

1. **Create**: User starts chat or runs resume
2. **Track**: Every message increments count, updates cost
3. **Update**: Session metadata updated throughout conversation
4. **End**: On exit, `endedAt` timestamp saved
5. **Resume**: Can be resumed anytime using session ID

### Memory Synchronization

- Working memory updates automatic (no manual sync needed)
- Messages saved to thread after each turn
- Session metadata saved after each message
- Vector embeddings updated asynchronously

## Future Enhancements

Potential improvements:
- Session tagging and categorization
- Automatic session summarization
- Export/import session data
- Multi-user support with user IDs
- Session sharing and collaboration
- Memory analytics and insights
- Confidence score auto-adjustment based on feedback