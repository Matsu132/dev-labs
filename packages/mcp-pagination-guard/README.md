# MCP Pagination Guard

A small dependency-free TypeScript developer library for collecting MCP catalogs safely before publishing a replacement snapshot. It rejects cursor cycles, duplicate identities, malformed page envelopes and page/item budget exhaustion. It never returns a partial catalog on failure.

## Why

MCP lists use opaque cursors. Catalog diff tools such as [mcpdiff](https://github.com/samlader/mcpdiff) focus on contract changes; this library focuses on bounded traversal before diffing or replacing a gateway catalog. [SDK issue #2614](https://github.com/modelcontextprotocol/typescript-sdk/issues/2614) illustrates a related but distinct metadata atomicity problem. This helper does not repair SDK internal caches or validate JSON Schema.

References: [MCP pagination](https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/pagination), [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

## Build

Node.js 26+, from this directory:

```sh
npm install --ignore-scripts
npm test
node examples/check.mjs
```

## SDK adapter example

```ts
import {collectCatalog} from './dist/index.js';
// client is an already connected MCP TypeScript SDK v1 Client
const next = await collectCatalog(async cursor => {
  const page = await client.listTools({cursor}, {timeout: 10000});
  return {items: page.tools, nextCursor: page.nextCursor};
}, tool => tool.name);
// Replace your application-owned catalog only after success.
```

Defaults: 100 pages, 10,000 items. Empty cursors are opaque values. No network, filesystem, credential handling or runtime dependencies in the library itself. The caller must supply transport timeouts, byte limits, schema validation and authorization; the item budget is not a memory-byte limit. This is a developer library, not a remote MCP server. SDK integration example is illustrative, not an integration test.

## 日本語

MCP Gatewayなどで tools/list を全ページ取得する際、カーソル循環や重複ツール、取得上限超過を検知します。途中で失敗した場合は不完全なカタログを返しません。上記の手順でビルドし、SDKのlistToolsをアダプターとして渡してください。通信タイムアウトや認可は呼び出し元で管理します。

MIT. No automatic npm publication.
