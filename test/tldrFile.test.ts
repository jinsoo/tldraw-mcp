/**
 * tldrFile.test.ts — tests for readTldrFile (Task 3).
 *
 * Fixtures are GENERATED programmatically (no browser required):
 *   current.tldr — built via makeStore() + putRecord(); exact current-version envelope.
 *   old.tldr     — copy of current.tldr with com.tldraw.shape.geo sequence decremented
 *                  by 1 to force an up-migration on read.
 * See tools/tldraw-mcp/test/fixtures/ and Task 3 controller note in .superpowers/sdd/.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { readTldrFile } from '../src/tldrFile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const current = readFileSync(join(__dirname, 'fixtures/current.tldr'), 'utf8')
const old = readFileSync(join(__dirname, 'fixtures/old.tldr'), 'utf8')

describe('readTldrFile', () => {
  it('parses a current-version .tldr and returns a store containing a shape', () => {
    const r = readTldrFile(current)
    expect(r.fileVersion).toBe(1)
    expect(r.store.allRecords().some((x: any) => x.typeName === 'shape')).toBe(true)
  })

  it('reports migrated=false for a current-version .tldr (sequences match)', () => {
    const r = readTldrFile(current)
    expect(r.migrated).toBe(false)
  })

  it('auto-migrates an older-version .tldr (geo sequence -1) and yields migrated=true', () => {
    const r = readTldrFile(old)
    expect(r.migrated).toBe(true)
    expect(r.store.allRecords().some((x: any) => x.typeName === 'shape')).toBe(true)
  })

  it('rejects a file with tldrawFileFormatVersion: 2', () => {
    const bad = JSON.stringify({ tldrawFileFormatVersion: 2, schema: {}, records: [] })
    expect(() => readTldrFile(bad)).toThrow(/unsupported tldrawFileFormatVersion/)
  })

  it('rejects a file with non-numeric tldrawFileFormatVersion', () => {
    const bad = JSON.stringify({ tldrawFileFormatVersion: 'v1', schema: {}, records: [] })
    expect(() => readTldrFile(bad)).toThrow(/unsupported tldrawFileFormatVersion/)
  })

  it('returns the page record in the store as well as the shape', () => {
    const r = readTldrFile(current)
    const typeNames = r.store.allRecords().map((x: any) => x.typeName)
    expect(typeNames).toContain('page')
    expect(typeNames).toContain('shape')
  })
})

import { writeTldrFile } from '../src/tldrFile.js'

describe('writeTldrFile', () => {
  it('round-trips: read → write → read keeps the shape records', () => {
    const a = readTldrFile(current)
    const json = writeTldrFile(a.store)
    const parsed = JSON.parse(json)
    expect(parsed.tldrawFileFormatVersion).toBe(1)
    expect(Array.isArray(parsed.records)).toBe(true)        // ARRAY, not a map
    expect(parsed.schema.schemaVersion).toBe(2)
    const b = readTldrFile(json)
    const shapesA = a.store.allRecords().filter((r: any) => r.typeName === 'shape').length
    const shapesB = b.store.allRecords().filter((r: any) => r.typeName === 'shape').length
    expect(shapesB).toBe(shapesA)
  })
})
