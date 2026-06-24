import { describe, it, expect } from 'vitest'
import { toRich, toPlain } from '../src/richtext.js'

describe('richtext round-trip', () => {
  for (const s of ['Hello', '', 'line1\nline2', 'a & b < c > d', 'ZnSe BS']) {
    it(`round-trips ${JSON.stringify(s)}`, () => {
      const rich = toRich(s)
      expect(rich.type).toBe('doc')
      expect(toPlain(rich)).toBe(s)
    })
  }

  it('extracts plain text through marks (bold) — nested-structure case', () => {
    const rich = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Use ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Kolmar' },
          ],
        },
      ],
    }
    expect(toPlain(rich as any)).toBe('Use Kolmar')
  })
})
