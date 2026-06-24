# tldraw-mcp — headless tldraw MCP server

Node-only MCP server exposing `read_tldr`, `write_tldr`, and `validate_tldr` tools.
No browser, no DOM, no React — runs in plain Node v24.

## Pinned version

```
@tldraw/editor    5.1.1
@tldraw/store     5.1.1
@tldraw/tlschema  5.1.1
```

## Verified import surface (tldraw 5.1.1)

| Symbol | Package | Notes |
|--------|---------|-------|
| `Store` (class) | `@tldraw/store` | Use directly — `createTLStore` from `@tldraw/editor` hangs the process |
| `createTLSchema` | `@tldraw/tlschema` | NOT in `@tldraw/editor` for 5.x |
| `createShapeId` | `@tldraw/tlschema` | |
| `createBindingId` | `@tldraw/tlschema` | |
| `parseTldrawJsonFile` | `@tldraw/tlschema` | For reading `.tldr` files |
| `toRichText` | `@tldraw/tlschema` | Convert plain text → ProseMirror richText doc |

> **NEVER** import the `tldraw` umbrella package at runtime.
> **NEVER** call `new Editor()` or `createTLStore` from `@tldraw/editor` in read/write/validate paths.
> `@tldraw/tlschema` is CJS — load via `createRequire` in `.mjs` files (named ESM imports fail).

## Tools exposed

- **`read_tldr`** — parse a `.tldr` file, return records + schema version
- **`write_tldr`** — accept a scene spec, build a `.tldr` file envelope
- **`validate_tldr`** — validate a `.tldr` JSON blob against the live schema

## Provisioning

Requires Node v24.

```bash
npm ci
npm run build
```

Built output: `dist/index.js` (ESM, produced by `tsc`).

## MCP registration (LOCAL dev form)

Add to your repo's `.mcp.json` (already committed at repo root):

```json
{
  "mcpServers": {
    "tldraw": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/tldraw-mcp/dist/index.js"]
    }
  }
}
```

> The universal `npx -y github:jinsoo/tldraw-mcp` form (see below) can also be used here once the standalone repo is published.

## Upstream tracking

To upgrade to a newer tldraw release:

```bash
./track-upstream.sh
```

This bumps `@tldraw/*` in `package.json`, re-extracts `src/defaults.json`
via `npm run probe-defaults`, vendors a fresh `llms-docs.txt`, rebuilds,
and runs the full test suite. Do NOT run during active development.

## llms-docs.txt

`llms-docs.txt` is the tldraw LLM reference doc vendored at the pinned version.
It is fetched by `track-upstream.sh` from `https://tldraw.dev/llms-docs.txt`.

## .tldr file envelope

The correct write shape (do NOT use `serializeTldrawJson` — needs `Editor`):

```ts
{
  tldrawFileFormatVersion: 1,
  schema: store.schema.serialize(),
  records: store.allRecords()   // flat ARRAY, not a map
}
```

`schemaVersion` is `2` for tldraw 5.1.1.

## Universal install (any agent)

Runs straight from GitHub — no npm account, no local checkout:

```bash
npx -y github:jinsoo/tldraw-mcp
```

Claude Code (`.mcp.json`):

```json
{ "mcpServers": { "tldraw": { "type": "stdio", "command": "npx", "args": ["-y", "github:jinsoo/tldraw-mcp"] } } }
```

Any MCP host that registers stdio servers (`config.yaml` `mcp_servers` example):

```yaml
tldraw: { type: stdio, command: npx, args: ["-y", "github:jinsoo/tldraw-mcp"], enabled: true }
```

Tools: `read_tldr`, `write_tldr`, `validate_tldr`.
