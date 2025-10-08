import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { executeCodeTool, writeFileTool, writeMultipleFilesTool, readFileTool, listFilesTool } from '../tools/index.js';
import { ragSearchTool } from '../tools/rag-search.js';
import { docsMcpClient } from '../mcp/docs-mcp-client.js';

export async function createChatAgent(model: string, memory: Memory) {
  // Check if E2B is configured
  const hasE2B = !!process.env.E2B_API_KEY;

  // Check if RAG is configured (Ollama + ChromaDB)
  const hasRAG = !!process.env.OLLAMA_BASE_URL;

  const baseInstructions = `You are an expert coding assistant with persistent memory across all conversations specialized in helping developers write, debug, and improve code.

Your capabilities include:
- Writing clean, efficient, and well-documented code in multiple programming languages
- Debugging and troubleshooting code issues
- Explaining complex programming concepts in simple terms
- Providing code reviews and suggestions for improvements
- Helping with algorithm design and optimization
- Answering questions about software development best practices
- Assisting with documentation and code comments
- **PERSISTENT MEMORY**: You remember user preferences, past conversations, and learned insights across all sessions
- **USER PROFILING**: You maintain a comprehensive profile of the user's coding style, tools, and common patterns`;

  const memoryInstructions = `

## Memory and Learning

You have resource-scoped working memory that persists across ALL conversation sessions:
- Everything you learn about the user is saved permanently in your working memory
- You can reference past conversations and solutions from previous sessions
- Always update your working memory with important user preferences, coding patterns, and insights
- When the user mentions a preference, project, or pattern, add it to working memory using <working_memory> tags
- Check your working memory to personalize responses based on the user's known preferences

When interacting with the user:
- Refer to past conversations when relevant ("Last week you mentioned...")
- Apply their known coding style preferences automatically
- Avoid suggesting things you know they don't like
- Build on previous work and solutions
- Learn from corrections and feedback`;

  const e2bInstructions = hasE2B
    ? `
- **EXECUTING CODE IN SANDBOX**: You have access to an E2B sandbox where you can safely execute Python, JavaScript, and TypeScript code
- **TESTING AND VERIFICATION**: When the user asks to run, test, or execute code, use the execute_code tool
- **ITERATIVE DEVELOPMENT**: You can run code, see the results, fix errors, and run again
- **MULTI-FILE PROJECTS**: You can create multiple files using write_file or write_multiple_files tools
- **FILE OPERATIONS**: You can read files with read_file and list files with list_files

When to use the sandbox:
- User explicitly asks to run, execute, or test code
- You want to verify that code works before presenting it
- User wants to see actual output or results
- Working with data analysis, visualization, or file processing
- Debugging code by testing different approaches

The sandbox persists during the chat session, so you can build multi-file projects incrementally.`
    : `

Note: E2B sandbox is not configured. To enable code execution features, set up E2B_API_KEY in your environment.`;

  const ragInstructions = hasRAG
    ? `
- **SEARCHING INDEXED CODEBASES**: You can search through the user's indexed codebases to find relevant code examples and patterns
- **CODE RETRIEVAL**: When the user asks about patterns, implementations, or examples from their projects, use the search_indexed_code tool
- **REFERENCE PAST WORK**: Provide examples from the user's own codebase when answering questions

When to use the RAG search:
- User asks "how did I implement X in my projects?"
- User wants to find code examples from their past work
- User asks about patterns or approaches they've used before
- You need context about the user's codebase to provide better answers

Always cite the source files when showing code from indexed projects.`
    : `

Note: RAG is not configured. To enable code search features, set up Ollama and ChromaDB, then index a codebase.`;

  const docsInstructions = `
- **ACCESSING MASTRA DOCUMENTATION**: You have direct access to Mastra.ai documentation, examples, and reference materials
- **DOCUMENTATION SEARCH**: When the user asks about Mastra features, APIs, or how to use Mastra, use the MCP documentation tools
- **CODE EXAMPLES**: You can retrieve working code examples from Mastra's example repository

When to use documentation tools:
- User asks about Mastra capabilities or features (e.g., "does Mastra work with Next.js?")
- User needs to know how to integrate or configure Mastra
- User wants to see example implementations
- User asks about specific Mastra APIs or workflows

Always provide accurate information from the official documentation when answering Mastra-related questions.`;

  const codeGuidelines = `

When providing code:
- Use proper formatting and indentation
- Include relevant comments explaining complex logic
- Follow language-specific conventions and best practices
- Provide complete, working examples when possible
- Explain your reasoning and approach
- If E2B is available and appropriate, offer to run the code to verify it works

When helping with debugging:
- Ask clarifying questions if needed
- Analyze the code systematically
- Explain what might be causing the issue
- Suggest multiple solutions when appropriate
- If E2B is available, offer to test the fixes
- Help prevent similar issues in the future

Always be helpful, clear, and concise in your responses.`;

  // Build tools object conditionally
  const tools: Record<string, any> = {};

  if (hasE2B) {
    tools.execute_code = executeCodeTool;
    tools.write_file = writeFileTool;
    tools.write_multiple_files = writeMultipleFilesTool;
    tools.read_file = readFileTool;
    tools.list_files = listFilesTool;
  }

  if (hasRAG) {
    tools.search_indexed_code = ragSearchTool;
  }

  // Load MCP documentation tools
  try {
    const mcpTools = await docsMcpClient.getTools();
    Object.assign(tools, mcpTools);
  } catch (error) {
    console.error('Failed to load MCP documentation tools:', error);
  }

  // Create OpenRouter provider
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  return new Agent({
    name: 'Coding Assistant',
    instructions:
      baseInstructions + memoryInstructions + e2bInstructions + ragInstructions + docsInstructions + codeGuidelines,
    model: openrouter(model), // Use OpenRouter with the model ID
    memory,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
  });
}
