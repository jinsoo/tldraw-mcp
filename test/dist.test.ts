import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'

describe('distribution config', () => {
  it('.mcp.json registers tldraw → dist/index.js', () => {
    // Resolve from tools/tldraw-mcp/test/dist.test.ts: up 3 levels to repo root
    const mcpJsonPath = resolve(fileURLToPath(import.meta.url), '../../../../.mcp.json')
    const cfg = JSON.parse(readFileSync(mcpJsonPath, 'utf8'))
    expect(cfg.mcpServers.tldraw.command).toBe('node')
    expect(cfg.mcpServers.tldraw.args[0]).toContain('tools/tldraw-mcp/dist/index.js')
  })
})
