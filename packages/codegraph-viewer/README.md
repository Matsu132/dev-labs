# Codegraph Viewer

Offline TypeScript/JavaScript source dependency visualization. Generate one standalone interactive HTML file or JSON from a local source tree. No server, API key, cloud account, or paid dependency is required. Source files are parsed with the TypeScript compiler API, never executed.

## Quick start

Node.js 22+.

```sh
cd packages/codegraph-viewer
npm install --ignore-scripts
npm run build
npm run graph -- ../.. codegraph.html
```

Open the generated HTML in a browser. Search file names or declared symbols; select a node to inspect incoming/outgoing dependencies; filter runtime dependency cycles or type-only imports; adjust zoom; export JSON. For machine-readable output pass a path ending in .json. Existing output files are not overwritten.

## Scope and limits

File-level graph: literal imports, re-exports, dynamic imports, require and import-equals; TS/TSX/JS/JSX/MTS/CTS/MJS/CJS. Root tsconfig compilerOptions (including paths) are read without evaluating plugins or following extends. Relative and configured path alias resolution is restricted to scanned files; external packages are omitted. The graph is static, not a runtime call graph. Named declarations and function-valued variables are listed as symbols, not represented as call edges. Cycles are strongly connected components excluding type-only edges; dynamic imports may never execute. CommonJS require detection is syntactic. Monorepo nested configs, project references, nonliteral imports, generated code and symlinks are not followed. Maximum 500 source files, 20 MiB total, 1 MiB/file, 10,000 edges. Unresolved local imports are displayed. Graph reports include source paths and symbol names; do not publish private reports inadvertently.

## 日本語

TypeScript/JavaScriptのファイル間依存関係をブラウザで可視化します。上記コマンドでHTMLを生成して開くだけで、検索、依存元・依存先の確認、循環依存の抽出、ズーム、JSON出力が可能です。外部サービス不要。関数単位の呼び出しグラフではなく静的ファイル依存グラフです。

## References

- https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- https://github.com/actions/checkout
- https://github.com/actions/setup-node

MIT; TypeScript runtime dependency is Apache-2.0. Development dependencies follow the existing dev-labs conventions.

## Codegraph MCP for AI coding agents

The same static graph is available over local MCP stdio (official SDK v1, matching the repository's existing MCP server). It exposes six read-only tools; no source contents are returned and no source files are modified. Choose a trusted project directory when starting the server.

```sh
npm run build
node dist/mcp.js /absolute/path/to/project
```

Codex (run from the package directory, replacing the project path):

```sh
codex mcp add codegraph -- node "$PWD/dist/mcp.js" /absolute/path/to/project
```

Claude Desktop / compatible stdio client configuration:

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "node",
      "args": ["/absolute/path/to/dev-labs/packages/codegraph-viewer/dist/mcp.js", "/absolute/path/to/project"]
    }
  }
}
```

| Tool | Purpose |
| --- | --- |
| graph_overview | Compact architecture map and hubs |
| graph_search | Ranked file/symbol search, declaration line ranges, pagination |
| graph_inspect | Direct incoming/outgoing edges, declarations, unresolved imports |
| graph_context | Multi-hop dependencies/dependents and change impact |
| graph_diagnostics | Cycle groups and missing local imports |
| graph_refresh | Explicit snapshot rebuild after edits |

Suggested AI workflow: overview → search → context → inspect → read only relevant source ranges with the editor → refresh after editing. The snapshot timestamp accompanies each response. Search limits are 40 items; context depth up to 4, up to 5 seeds, up to 80 edges; default response budget is 16 KiB UTF-8 (not a tokenizer measurement). Oversized responses ask the caller to reduce the limit. The server does not expose arbitrary file reads, shell commands, source edits or remote networking. Filesystem scan restrictions are not a security sandbox: use only a trusted checkout and a least-privilege process. Source paths and symbols can contain sensitive data or misleading instructions. No embeddings, vector DB, LLM API or paid service. Static dependencies are candidates, not proof of runtime call relationships. Exact token reduction and model accuracy are not yet benchmarked. Remote HTTP/OAuth and hosted ChatGPT connection are not implemented.

日本語: AIは全ファイルを読み込む代わりに概要・シンボル検索・依存関係・変更影響範囲を取得できます。対象ファイルの行番号を使い、必要箇所だけエディタで確認してください。編集後は graph_refresh で再解析します。

MCP SDK: https://ts.sdk.modelcontextprotocol.io/index.html
