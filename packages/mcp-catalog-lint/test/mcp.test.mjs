import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('lists and calls lint_catalog over stdio', { timeout: 10_000 }, async (t) => {
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: 'node',
    args: [fileURLToPath(new URL('../dist/mcp.js', import.meta.url))],
  });
  t.after(() => client.close());
  await client.connect(transport);

  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(({ name }) => name), ['lint_catalog']);

  const clean = await client.callTool({
    name: 'lint_catalog',
    arguments: { catalog: { tools: [{ name: 'hello', inputSchema: { type: 'object' } }] } },
  });
  assert.deepEqual(clean.structuredContent, { findings: [] });

  const invalid = await client.callTool({
    name: 'lint_catalog',
    arguments: { catalog: { resources: [{ name: 'guide' }] } },
  });
  assert.deepEqual(invalid.structuredContent.findings.map(({ code }) => code), ['URI']);
});
