import { describe, it, expect } from 'vitest'
import { getShapePath, SHAPE_SIZES } from '../src/captcha/shapes'
import type { ShapeType } from '../src/captcha/types'

describe('shapes', () => {
  it('exports size factor for each shape type', () => {
    expect(SHAPE_SIZES).toEqual({
      circle: expect.any(Number),
      triangle: expect.any(Number),
      square: expect.any(Number),
      star: expect.any(Number),
      pentagon: expect.any(Number),
      hexagon: expect.any(Number)
    })
  })

  it('getShapePath returns valid Path2D for each type', () => {
    const types = Object.keys(SHAPE_SIZES) as ShapeType[]
    for (const t of types) {
      const p = getShapePath(t, 100, 100, 20)
      expect(p).toBeInstanceOf(Path2D)
    }
  })

  it('getShapePath throws for unknown type', () => {
    expect(() => getShapePath('unknown' as any, 0, 0, 10)).toThrow()
  })
})