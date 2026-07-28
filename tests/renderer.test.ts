import { describe, it, expect, vi } from 'vitest'
import { preRenderCamo } from '../src/captcha/renderer'

function makeCtx() {
  const calls: string[] = []
  return {
    calls,
    fillStyle: '' as string,
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => calls.push(`fillRect ${x} ${y} ${w} ${h}`)),
    fill: vi.fn(() => calls.push('fill')),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn()
  } as any
}

describe('renderer.preRenderCamo', () => {
  it('draws multi-grain rectangles and stipple dots', () => {
    const ctx = makeCtx()
    preRenderCamo(ctx, 200, 100)
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(20)
    expect(ctx.arc.mock.calls.length).toBeGreaterThan(20)
  })
})