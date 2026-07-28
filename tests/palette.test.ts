import { describe, it, expect } from 'vitest'
import { CAMO_PALETTE, pickCamoColor, STIPPLE_DARK, STIPPLE_LIGHT } from '../src/captcha/palette'

describe('palette', () => {
  it('CAMO_PALETTE has 6 earth tones', () => {
    expect(CAMO_PALETTE).toHaveLength(6)
  })

  it('pickCamoColor returns one of the palette entries', () => {
    for (let i = 0; i < 50; i++) {
      const c = pickCamoColor()
      expect(CAMO_PALETTE).toContain(c)
    }
  })

  it('exports stipple colors', () => {
    expect(STIPPLE_DARK).toMatch(/^#[0-9a-f]{6}$/i)
    expect(STIPPLE_LIGHT).toMatch(/^#[0-9a-f]{6}$/i)
  })
})