import { describe, it, expect } from 'vitest'
import { validateScene } from '../src/sceneSpec.js'

const cases: [string, any, string][] = [
  ['unknown kind', { nodes: [{ id: 'a', kind: 'blob', x: 0, y: 0 }] }, 'unknown kind'],
  ['duplicate id', { nodes: [{ id: 'a', kind: 'box', x: 0, y: 0 }, { id: 'a', kind: 'box', x: 1, y: 1 }] }, 'duplicate id'],
  ['dangling edge', { nodes: [{ id: 'a', kind: 'box', x: 0, y: 0 }], edges: [{ from: 'a', to: 'z' }] }, 'unknown node'],
  ['missing x/y', { nodes: [{ id: 'a', kind: 'box' }] }, 'missing x'],
  ['zero w', { nodes: [{ id: 'a', kind: 'box', x: 0, y: 0, w: 0 }] }, 'w must be > 0'],
  ['box-only field on note', { nodes: [{ id: 'a', kind: 'note', text: 'x', x: 0, y: 0, fill: 'solid' }] }, 'box-only'],
]

describe('validateScene', () => {
  it('accepts a clean scene', () => {
    expect(validateScene({ nodes: [{ id: 'a', kind: 'box', text: 'x', x: 0, y: 0 }] }).valid).toBe(true)
  })

  for (const [name, spec, needle] of cases) {
    it(`rejects: ${name}`, () => {
      const r = validateScene(spec)
      expect(r.valid).toBe(false)
      expect(r.errors.join(' | ').toLowerCase()).toContain(needle.toLowerCase())
    })
  }
})
