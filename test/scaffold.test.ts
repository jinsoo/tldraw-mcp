import { describe, it, expect } from 'vitest'

describe('scaffold', () => {
  it('runs vitest in a node environment (no DOM)', () => {
    expect(typeof (globalThis as any).document).toBe('undefined')
    expect(1 + 1).toBe(2)
  })
})
