import { describe, it, expect } from 'vitest'
import { newBezierPath, advanceBezier, bezierPosition, type BezierPath } from '../src/captcha/motion'

describe('motion', () => {
  it('newBezierPath returns 4 points within bounds with padding', () => {
    const w = 200, h = 100, pad = 10
    const path = newBezierPath(w, h, pad)
    for (const pt of [path.p0, path.p1, path.p2, path.p3]) {
      expect(pt.x).toBeGreaterThanOrEqual(pad)
      expect(pt.x).toBeLessThanOrEqual(w - pad)
      expect(pt.y).toBeGreaterThanOrEqual(pad)
      expect(pt.y).toBeLessThanOrEqual(h - pad)
    }
  })

  it('advanceBezier moves forward at dt=500 with duration=1000', () => {
    const path: BezierPath = {
      p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 },
      p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
      t: 0, duration: 1000
    }
    const updated = advanceBezier(path, 500, 200, 100, 10)
    expect(updated.t).toBeCloseTo(0.5)
  })

  it('advanceBezier regenerates path when t reaches 1', () => {
    const path: BezierPath = {
      p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 },
      p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
      t: 0.95, duration: 1000
    }
    const updated = advanceBezier(path, 100, 200, 100, 10)
    expect(updated.t).toBeLessThan(0.95)
    expect(updated.p3.x).not.toEqual(path.p3.x)
  })

  it('bezierPosition at t=0 returns p0', () => {
    const path: BezierPath = {
      p0: { x: 10, y: 20 }, p1: { x: 30, y: 40 },
      p2: { x: 50, y: 60 }, p3: { x: 70, y: 80 },
      t: 0, duration: 1000
    }
    expect(bezierPosition(path, 0)).toEqual({ x: 10, y: 20 })
  })
})