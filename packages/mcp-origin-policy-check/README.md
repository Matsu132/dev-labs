# mcp-origin-policy-check

Offline TypeScript developer utility for reviewing a proposed Remote MCP Host/Origin allowlist using independent synthetic cases. Unlike full MCP conformance suites, it runs without an endpoint, credentials, or tool invocation. It is not a server, middleware, or proof of deployed security.

## Usage

Node.js 26+:

```sh
npm install
npm test
node examples/check.mjs
```

Import evaluate or matrix from dist/index.js. Hosts are exact authorities (including explicit ports), case insensitive; origins are exact canonical HTTP(S) origins, with no trailing slash. Missing Origin is accepted only when Host passes. Empty origin allowlist rejects all present origins. Invalid configuration throws. The matrix uses reserved .invalid domains; do not allowlist those fixtures. No network access, no runtime dependencies, no secret storage. This is a deliberately strict example policy, not a universal SDK compatibility policy; extension origins are unsupported. Authentication, CORS, reverse proxy behavior, duplicate raw headers and DNS are outside scope.

## References

- https://github.com/modelcontextprotocol/conformance/issues/535 — independent Host and Origin cases
- https://github.com/modelcontextprotocol/modelcontextprotocol/issues/3370 — browser interoperability discussion
- https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-w48q-cv73-mx4w — SDK advisory

## 日本語

Remote MCPのHost/Origin許可リストを、実サーバーへ通信せずに検証する開発用ライブラリです。npm install、npm test、node examples/check.mjs の順で実行してください。実環境の安全性を保証するものではありません。MITライセンス、TypeScript開発依存もMITです。npm公開はしていません。
