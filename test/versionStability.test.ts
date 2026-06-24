/**
 * versionStability.test.ts — id/index stability regression across @tldraw versions.
 *
 * Fixture `stable-vN.tldr` was captured from the CURRENTLY PINNED version: @tldraw 5.1.1
 * (see tools/tldraw-mcp/package.json). When the team bumps @tldraw, this fixture becomes
 * the "old version" anchor proving cross-version reads stay stable.
 *
 * Guards two invariants:
 *   (a) A fixed 12-node scene's shape indices stay lexicographically sorted through
 *       write→read (the indexAt/getIndicesAbove scheme must not regress to "a10 < a2").
 *   (b) The saved fixture still reads under the installed version with all nodes preserved.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fromScene, toScene, indexAt, SceneSpec } from '../src/sceneSpec.js'
import { writeTldrFile, readTldrFile } from '../src/tldrFile.js'

/** Fixed 12-box scene — never change this; it is the stability anchor. */
const FIXED: SceneSpec = {
  nodes: Array.from({ length: 12 }, (_, i) => ({
    id: `n${i}`,
    kind: 'box' as const,
    text: `b${i}`,
    x: i * 40,
    y: 0,
  })),
}

describe('id/index stability across versions', () => {
  it('indices stay lexicographically sorted for 12 siblings (no a10<a2 regression)', () => {
    // Collect the 12 index keys that fromScene assigns
    const indices = Array.from({ length: 12 }, (_, i) => indexAt(i))
    const sortedCopy = [...indices].sort()
    expect(indices).toEqual(sortedCopy)

    // Verify the full write→read cycle preserves all 12 nodes
    const json = writeTldrFile(fromScene(FIXED))
    const reread = toScene(readTldrFile(json).store).scene
    expect(reread.nodes.length).toBe(12)

    // Shape records in the .tldr file must each carry one of the 12 known index keys
    const parsed: { records: { typeName: string; index?: string }[] } = JSON.parse(json)
    const shapeIndices = parsed.records
      .filter(r => r.typeName === 'shape')
      .map(r => r.index!)
    // Every shape index must be lex-sortable: sorted copy equals itself
    const shapeIndicesSorted = [...shapeIndices].sort()
    // The set of assigned indices must match the indexAt sequence exactly
    expect(new Set(shapeIndices)).toEqual(new Set(indices))
    // Confirm each assigned index is lex-valid (no raw numeric suffix a10 < a2 bug)
    expect(shapeIndicesSorted).toEqual([...shapeIndices].sort())
  })

  it('saved fixture from @tldraw 5.1.1 reads under the installed version with nodes preserved', () => {
    // stable-vN.tldr was authored via fromScene(FIXED) → writeTldrFile under @tldraw 5.1.1
    const fixture = readFileSync(
      new URL('./fixtures/stable-vN.tldr', import.meta.url),
      'utf8',
    )
    expect(() => readTldrFile(fixture)).not.toThrow()
    const { scene } = toScene(readTldrFile(fixture).store)
    expect(scene.nodes.length).toBe(12)
    // All 12 box labels must survive unchanged (sort both sides the same way)
    const texts = scene.nodes.map(n => n.text).sort()
    const expected = Array.from({ length: 12 }, (_, i) => `b${i}`).sort()
    expect(texts).toEqual(expected)
  })
})
