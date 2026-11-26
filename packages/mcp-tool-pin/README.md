# MCP Tool Pin

A zero-runtime-dependency TypeScript helper for pinning approved MCP tool declarations to a locally assigned server identity. Unlike catalog linting or pagination validation, this checks an individual declaration against an independently approved snapshot before a caller chooses to invoke it.

Run `npm install && npm test`, then `node examples/check.mjs`. Use pinTool(serverId, tool) only after independent review; persist the returned pin in trusted configuration. Use matchesPin before invocation. Any changed field requires review. Inputs must be parsed JSON values; arrays retain order. The server identity must be assigned by the trusted caller, not supplied by the remote peer. This is not authentication, authorization, or proof of actual behavior; a server can change behavior without changing its declaration. Do not automatically approve new pins. No network calls.

References: https://github.com/modelcontextprotocol/typescript-sdk/issues/2777 and https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/servers/tools.md

## 日本語
承認済みのMCPツール定義をSHA-256で固定し、説明・スキーマ・アノテーション等の変更を検知する補助ライブラリです。npm install、npm testで導入確認できます。承認済みハッシュは信頼できる設定に保存してください。実際のツール動作や認可の安全性を保証するものではありません。
