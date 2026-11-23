# mcp-catalog-lint

A tiny TypeScript developer plugin to statically lint MCP `tools/list`, `resources/list`, and `prompts/list` catalog snapshots. Detects duplicate names, malformed schemas, and missing resource URIs before they reach an MCP client.

## Why

The MCP TypeScript SDK has open discussions about validating peer declarations and catalog pagination. This tool addresses a deliberately smaller, offline use case: reviewing a **single JSON snapshot**, without connecting to a live MCP server or executing any tools.

References:
- https://github.com/modelcontextprotocol/typescript-sdk/issues/2777
- https://github.com/modelcontextprotocol/typescript-sdk/issues/2352
- https://github.com/modelcontextprotocol/typescript-sdk

## Install and test

Use Node.js 22.13 or later in the 22.x line, or Node.js 24+. Run these commands from the repository root.

```sh
npm ci
npm run lint --workspace=mcp-catalog-lint
npm run typecheck --workspace=mcp-catalog-lint
npm test --workspace=mcp-catalog-lint
npm audit
npm run lint:example --workspace=mcp-catalog-lint
```

## Codex

Install Git and Node.js 22.13+ (22.x) or 24+. Run this once to register the stdio server:

```sh
codex mcp add mcp-catalog-lint -- npm exec --yes --package=git+https://github.com/Matsu132/dev-labs.git#main -- mcp-catalog-lint
```

In Codex desktop, you can also open Settings → MCP servers → Add server, select STDIO, and set the command to `npm` with these arguments in order:

```text
exec
--yes
--package=git+https://github.com/Matsu132/dev-labs.git#main
--
mcp-catalog-lint
```

Restart Codex after saving. npm fetches and caches the code from GitHub and builds it on first use. Codex runs it locally over stdio. The tool `lint_catalog` accepts a `catalog` JSON value such as `{"tools":[{"name":"hello","inputSchema":{"type":"object"}}]}` and returns `{"findings":[]}` for a clean catalog. The tool checks the supplied snapshot without opening files or connecting to other MCP servers.

## CLI usage

Export or save a JSON object with `tools`, `resources`, and/or `prompts` arrays, then:

```sh
node packages/mcp-catalog-lint/dist/cli.js packages/mcp-catalog-lint/examples/catalog.json
```

Exit codes: `0` clean, `1` lint findings, `2` invalid input/file. The library function `lintCatalog(value)` returns structured findings. Both the CLI and MCP tool validate snapshots and check basic schema shape. They do not verify pagination or remote connectivity.

## 日本語の導入

MCPの `tools/list` などのJSONスナップショットを静的検査する開発用ツールです。ツール名の重複、入力・出力スキーマの基本的な形式、Resource URIの欠落を確認します。MCPサーバーには接続せず、ツールも実行しません。`npm ci && npm test --workspace=mcp-catalog-lint` で検証できます。

## Security and license

The lint tool checks its input locally. npm contacts GitHub and the npm registry to install the server. Review JSON snapshots before sharing; they may contain sensitive descriptions. MIT licensed. CI installs locked development dependencies from npm. No npm package published.
