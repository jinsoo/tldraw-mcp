import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('distribution config (universal npx-github)', () => {
  it('.mcp.json registers tldraw via npx github', () => {
    const cfg = JSON.parse(readFileSync(new URL('../../../.mcp.json', import.meta.url), 'utf8'))
    expect(cfg.mcpServers.tldraw.command).toBe('npx')
    expect(cfg.mcpServers.tldraw.args).toContain('github:jinsoo/tldraw-mcp')
  })
})
