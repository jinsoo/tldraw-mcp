import { describe, it, expect } from 'vitest'
import { fromScene, toScene, indexAt, SceneSpec } from '../src/sceneSpec.js'

describe('fromScene (create mode)', () => {
  it('builds a valid store from box/note/text nodes', () => {
    const spec: SceneSpec = { title: 't', nodes: [
      { id: 'a', kind: 'box', text: 'Sample Box', x: 0, y: 0, w: 90, h: 60, color: 'violet' },
      { id: 'n', kind: 'note', text: 'Hello', x: 200, y: 0, color: 'yellow' },
      { id: 'l', kind: 'text', text: 'label', x: 0, y: 120 },
    ] }
    const store = fromScene(spec)              // store.put validates each record
    const shapes = store.allRecords().filter((r: any) => r.typeName === 'shape')
    expect(shapes.map((s: any) => s.type).sort()).toEqual(['geo', 'note', 'text'])
  })

  it('indexAt is monotonic AND lexicographically sorted past 9 (no a10<a2 bug)', () => {
    const idx = Array.from({ length: 12 }, (_, i) => indexAt(i))
    const sorted = [...idx].sort()
    expect(idx).toEqual(sorted)
  })

  it('applies the size prop to box and note labels, round-trips via toScene', () => {
    const spec: SceneSpec = { nodes: [
      { id: 'b', kind: 'box', text: 'small box', x: 0, y: 0, size: 's' },
      { id: 'n', kind: 'note', text: 'small note', x: 200, y: 0, size: 's' },
    ] }
    const store = fromScene(spec)
    const shapes = store.allRecords().filter((r: any) => r.typeName === 'shape')
    expect(shapes.every((s: any) => s.props.size === 's')).toBe(true)
    const back = toScene(store).scene.nodes  // read-path node ids are shape:* — match by kind
    expect(back.find((n: any) => n.kind === 'box')?.size).toBe('s')
    expect(back.find((n: any) => n.kind === 'note')?.size).toBe('s')
  })
})
