# MCP Result Contract Check

Offline developer CLI and TypeScript library for checking recorded MCP tool results against JSON Schema 2020-12. No network calls or tool execution. Successful results are schema-checked; tool errors skip the success schema. Missing matching JSON text fallback is a warning, not a failure. This is not a full MCP envelope validator; asynchronous schemas, remote references and unsupported schema keywords fail closed. Use trusted schemas and bounded fixtures.

## Quick start / 日本語導入

Node.js 22+ を用意し、以下を実行してください。

```sh
cd packages/mcp-result-contract-check
npm install --ignore-scripts
npm run build
npm run check -- examples/schema.json examples/result.json
````

Exit codes: 0 no errors, 1 contract violations, 2 invalid input. Pass - instead of a schema file to check without an output schema. Reports omit result values. Not published to npm.

Reference: https://modelcontextprotocol.io/specification/2026-07-28/server/tools

Dependencies: Ajv (MIT); development tooling uses permissive OSS licenses.
