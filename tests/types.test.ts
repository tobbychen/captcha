import { describe, it, expect } from 'vitest'
import { SHAPE_TYPES, DECOY_CHAR_POOL } from '../src/captcha/types'
import type { Challenge, VerifyResult } from '../src/captcha/types'

describe('types', () => {
  it('SHAPE_TYPES exports all 6 supported shapes at runtime', () => {
    expect(SHAPE_TYPES).toHaveLength(6)
    expect(SHAPE_TYPES).toEqual([
      'circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'
    ])
  })

  it('Challenge uses character field', () => {
    const c: Challenge = { id: 'a', character: 'A', order: 1 }
    expect(c.character).toBe('A')
  })

  it('VerifyResult shape compiles', () => {
    const r: VerifyResult = { ok: true, orderedIds: ['a'], expected: ['a'] }
    expect(r.ok).toBe(true)
  })

  it('DECOY_CHAR_POOL has characters', () => {
    expect(DECOY_CHAR_POOL.length).toBeGreaterThan(10)
  })
})