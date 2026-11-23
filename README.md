# dev-labs

A collection of independent TypeScript MCP and developer-tool OSS projects.

## Packages

- [mcp-catalog-lint](packages/mcp-catalog-lint/README.md) — offline MCP catalog snapshot linter.

Packages have their own scripts and tests and share a root npm workspace lockfile. No npm publication is performed automatically.

## Use from Codex

With Git and Node.js 22.13+ (22.x) or 24+ installed, register the MCP server directly from GitHub:

```sh
codex mcp add mcp-catalog-lint -- npm exec --yes --package=git+https://github.com/Matsu132/dev-labs.git#main -- mcp-catalog-lint
```

npm fetches, builds, and caches the package, then Codex starts it locally over stdio. See the [package README](packages/mcp-catalog-lint/README.md#codex) for desktop setup and tool inputs.
