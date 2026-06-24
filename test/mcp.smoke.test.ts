import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { handleTool, listTools } from '../src/index.js'

describe('MCP tools (logic-level smoke, few-shot pattern)', () => {
  it('lists the three core tools with embedded instructions', () => {
    const tools = listTools()
    expect(tools.map(t => t.name).sort()).toEqual(['read_tldr', 'validate_tldr', 'write_tldr'])
    expect(tools.find(t => t.name === 'write_tldr')!.description).toContain('scene-spec')
  })

  it('write → validate → read round-trips through the tool layer', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tldr-'))
    const path = join(dir, 'd.tldr')
    const scene = { nodes: [{ id: 'a', kind: 'box', text: 'Hi', x: 0, y: 0 }] }
    expect((await handleTool('validate_tldr', { scene })).valid).toBe(true)
    await handleTool('write_tldr', { path, scene })
    expect(readFileSync(path, 'utf8')).toContain('tldrawFileFormatVersion')
    const back = await handleTool('read_tldr', { path })
    expect(back.scene.nodes[0].text).toBe('Hi')
  })
})
