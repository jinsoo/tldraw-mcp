import { describe, it, expect } from 'vitest'
import {
  makeStore,
  putRecord,
  allRecords,
  serializeSchema,
  getDefaultPropsFor,
  createShapeId,
} from '../src/tldrawApi.js'

describe('tldrawApi (headless, no DOM)', () => {
  it('runs entirely in plain node — no document/window touched', () => {
    expect(typeof (globalThis as any).document).toBe('undefined')
    expect(typeof (globalThis as any).window).toBe('undefined')
  })

  it('creates a store, inserts a validated geo shape, and reads it back', () => {
    const store = makeStore()

    // A page record is required as parent
    putRecord(store, { id: 'page:page', typeName: 'page', name: 'Page 1', index: 'a1', meta: {} })

    const id = createShapeId()
    const shape = {
      id,
      typeName: 'shape',
      type: 'geo',
      x: 10,
      y: 20,
      rotation: 0,
      index: 'a1',
      parentId: 'page:page',
      isLocked: false,
      opacity: 1,
      meta: {},
      props: { ...getDefaultPropsFor('geo'), w: 100, h: 60 },
    }
    putRecord(store, shape)

    const ids = allRecords(store).map((r: any) => r.id)
    expect(ids).toContain(id)
    expect(ids).toContain('page:page')
  })

  it('serializes a v2 schema', () => {
    const schema = serializeSchema(makeStore())
    expect(schema.schemaVersion).toBe(2)
  })
})
