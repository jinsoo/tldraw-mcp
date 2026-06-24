import { describe, it, expect } from 'vitest'
import { fromScene, SceneSpec } from '../src/sceneSpec.js'

describe('edges → arrow + two bindings', () => {
  it('produces exactly two binding records, terminals start/end, correct from/to', () => {
    const spec: SceneSpec = {
      nodes: [ { id: 'a', kind: 'box', text: 'A', x: 0, y: 0 }, { id: 'b', kind: 'box', text: 'B', x: 300, y: 0 } ],
      edges: [ { from: 'a', to: 'b', text: 'MIR', arrowheadEnd: 'arrow' } ],
    }
    const store = fromScene(spec)
    const recs = store.allRecords()
    const arrows = recs.filter((r: any) => r.typeName === 'shape' && r.type === 'arrow')
    const bindings = recs.filter((r: any) => r.typeName === 'binding')
    expect(arrows.length).toBe(1)
    expect(bindings.length).toBe(2)
    const terminals = bindings.map((b: any) => b.props.terminal).sort()
    expect(terminals).toEqual(['end', 'start'])
    // every binding's fromId is the arrow; toId points at a real shape
    const arrowId = arrows[0].id
    const shapeIds = new Set(recs.filter((r: any) => r.typeName === 'shape').map((r: any) => r.id))
    for (const bnd of bindings) {
      expect(bnd.fromId).toBe(arrowId)
      expect(shapeIds.has(bnd.toId)).toBe(true)
    }
  })
})
