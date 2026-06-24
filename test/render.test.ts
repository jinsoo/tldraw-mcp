import { describe, it, expect } from 'vitest'
import { writeFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderToSvg } from '../src/render.js'
import { fromScene } from '../src/sceneSpec.js'
import { writeTldrFile } from '../src/tldrFile.js'

describe('renderToSvg (REAL tldraw)', () => {
  it('renders TWO labeled boxes + an arrow edge via real tldraw', async () => {
    // Build the fixture with the engine: two labeled boxes and a connecting arrow.
    const store = fromScene({
      nodes: [
        { id: 'a', kind: 'box', text: 'BoxAlpha', x: 0, y: 0 },
        { id: 'b', kind: 'box', text: 'BoxBeta', x: 300, y: 0 },
      ],
      edges: [{ from: 'a', to: 'b' }],
    })
    const dir = await mkdtemp(join(tmpdir(), 'render-test-'))
    const tldrPath = join(dir, 'two-boxes-arrow.tldr')
    await writeFile(tldrPath, writeTldrFile(store), 'utf8')

    const svg = await renderToSvg(tldrPath)

    // Real tldraw output: valid SVG envelope…
    expect(svg.startsWith('<svg')).toBe(true)
    // …with the actual label text rendered (a hand-rolled stub that dropped text
    // would fail here)…
    expect(svg).toContain('BoxAlpha')
    expect(svg).toContain('BoxBeta')
    // …drawn with real path geometry (real tldraw draws shapes/arrows as <path>)…
    expect(svg).toContain('<path')
    // …and crucially NOT the hand-rolled stub artifact: the old drawer rendered an
    // arrow as a grey dashed box with a literal ">arrow<" text label.
    expect(svg).not.toContain('>arrow<')
  }, 90000)

  it('renders the current.tldr fixture to a non-empty SVG', async () => {
    const svg = await renderToSvg(new URL('./fixtures/current.tldr', import.meta.url).pathname)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.length).toBeGreaterThan(200)
  }, 90000)
})
