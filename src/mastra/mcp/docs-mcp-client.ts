/**
 * MCP Client for accessing documentation (Mastra docs, Ref docs, etc.)
 */

import { MCPClient } from '@mastra/mcp';

export const docsMcpClient = new MCPClient({
  id: 'docs-mcp-client',
  servers: {
    mastra: {
      command: 'npx',
      args: ['-y', '@mastra/mcp-docs-server@latest'],
    },
  },
});
