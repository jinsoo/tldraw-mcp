import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

describe('publish-ready for npx github install', () => {
  it('is not private and exposes a bin', () => {
    expect(pkg.private).toBeUndefined()
    expect(pkg.bin['tldraw-mcp']).toBe('dist/index.js')
  })
  it('builds dist on install via prepare', () => {
    expect(pkg.scripts.prepare).toBe('npm run build')
  })
  it('points at the standalone repo', () => {
    expect(pkg.repository.url).toContain('jinsoo/tldraw-mcp')
    expect(pkg.files).toContain('dist')
  })
})
