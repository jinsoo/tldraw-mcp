import { describe, it, expect } from 'vitest'
import { renderToSvg } from '../src/render.js'

describe('renderToSvg', () => {
  it('renders a .tldr fixture to a non-empty SVG', async () => {
    const svg = await renderToSvg(new URL('./fixtures/current.tldr', import.meta.url).pathname)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.length).toBeGreaterThan(200)
  }, 60000)
})
