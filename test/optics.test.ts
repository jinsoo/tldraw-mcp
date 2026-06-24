import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { readTldrFile } from '../src/tldrFile.js'
import { toScene } from '../src/sceneSpec.js'

describe('docs/neaSCAN_optics.tldr', () => {
  it('parses and contains the core optical components', () => {
    const json = readFileSync(
      new URL('../../../docs/neaSCAN_optics.tldr', import.meta.url),
      'utf8',
    )
    const { scene } = toScene(readTldrFile(json).store)
    const texts = scene.nodes.map((n) => (n as any).text).join(' | ')
    for (const needle of ['ZnSe', 'Kolmar', 'IRA', 'tip']) {
      expect(texts).toContain(needle)
    }
  })

  it('has the expected node and edge counts', () => {
    const json = readFileSync(
      new URL('../../../docs/neaSCAN_optics.tldr', import.meta.url),
      'utf8',
    )
    const { scene } = toScene(readTldrFile(json).store)
    expect(scene.nodes.length).toBe(9)
    expect(scene.edges?.length).toBe(7)
  })
})
