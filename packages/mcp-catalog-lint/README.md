# mcp-catalog-lint

A tiny TypeScript developer plugin to statically lint MCP `tools/list`, `resources/list`, and `prompts/list` catalog snapshots. Detects duplicate names, malformed schemas, and missing resource URIs before they reach an MCP client.

## Why

The MCP TypeScript SDK has open discussions about validating peer declarations and catalog pagination. This tool addresses a deliberately smaller, offline use case: reviewing a **single JSON snapshot**, without connecting to a live MCP server or executing any tools.

References:
- https://github.com/modelcontextprotocol/typescript-sdk/issues/2777
- https://github.com/modelcontextprotocol/typescript-sdk/issues/2352
- https://github.com/modelcontextprotocol/typescript-sdk

## Install and test

Requires Node.js 22+.

```sh
npm install
npm test
npm run lint:example
```

## Usage

Export or save a JSON object with `tools`, `resources`, and/or `prompts` arrays, then:

```sh
node dist/cli.js examples/catalog.json
```

Exit codes: `0` clean, `1` lint findings, `2` invalid input/file. The library function `lintCatalog(value)` returns structured findings. No runtime npm dependencies. This is a static development utility, **not an MCP server**, not a full JSON Schema validator, and does not verify pagination or remote connectivity.

## 日本語の導入

MCPの `tools/list` などのJSONスナップショットを静的検査する開発用ツールです。ツール名の重複、入力・出力スキーマの基本的な形式、Resource URIの欠落を確認します。MCPサーバーには接続せず、ツールも実行しません。`npm install && npm test` で検証できます。

## Security and license

No credentials, network calls, or tool execution. Review JSON snapshots before sharing; they may contain sensitive descriptions. MIT licensed. Development dependencies are TypeScript (MIT); CI installs dependencies from npm. No npm package published.
