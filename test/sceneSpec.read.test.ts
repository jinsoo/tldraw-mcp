import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fromScene, toScene, SceneSpec } from '../src/sceneSpec.js'
import { readTldrFile } from '../src/tldrFile.js'

describe('toScene (read path)', () => {
  it('round-trips a scene-spec: write store → toScene equals input semantics', () => {
    const spec: SceneSpec = {
      nodes: [
        { id: 'a', kind: 'box', text: 'A', x: 0, y: 0 },
        { id: 'b', kind: 'box', text: 'B', x: 300, y: 0 },
      ],
      edges: [{ from: 'a', to: 'b', text: 'MIR' }],
    }
    const { scene } = toScene(fromScene(spec))
    expect(scene.nodes.filter(n => n.kind === 'box').map(n => n.text).sort()).toEqual(['A', 'B'])
    expect(scene.edges?.length).toBe(1)
    expect(scene.edges?.[0].text).toBe('MIR')
  })

  it('reports unmodeled shapes instead of dropping them', () => {
    const json = readFileSync(
      new URL('./fixtures/custom-shape.tldr', import.meta.url),
      'utf8',
    )
    const { store } = readTldrFile(json)
    const { unmodeled } = toScene(store)
    expect(unmodeled.some(u => u.type === 'frame')).toBe(true)
  })
})
