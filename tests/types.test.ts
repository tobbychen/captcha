import { describe, it, expect } from 'vitest'
import { SHAPE_TYPES } from '../src/captcha/types'
import type { Challenge, VerifyResult } from '../src/captcha/types'

describe('types', () => {
  it('SHAPE_TYPES exports all 6 supported shapes at runtime', () => {
    expect(SHAPE_TYPES).toHaveLength(6)
    expect(SHAPE_TYPES).toEqual([
      'circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'
    ])
  })

  it('Challenge shape compiles', () => {
    const c: Challenge = { id: 'a', shape: 'circle', order: 1 }
    expect(c.id).toBe('a')
  })

  it('VerifyResult shape compiles', () => {
    const r: VerifyResult = { ok: true, orderedIds: ['a'], expected: ['a'] }
    expect(r.ok).toBe(true)
  })
})