#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { lintCatalog } from './lint.js';

const server = new McpServer({ name: 'mcp-catalog-lint', version: '0.1.0' });

server.registerTool(
  'lint_catalog',
  {
    description: 'Check a JSON snapshot of MCP tools, resources, and prompts and return lint findings.',
    inputSchema: { catalog: z.json().describe('The catalog snapshot to check') },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  ({ catalog }) => {
    const result = { findings: lintCatalog(catalog) };
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
);

await server.connect(new StdioServerTransport());
