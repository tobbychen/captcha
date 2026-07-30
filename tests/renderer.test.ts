import { describe, it, expect, vi } from 'vitest'
import { preRenderCamo, drawCharacter, drawOrderIndicator, drawSuccessCheck } from '../src/captcha/renderer'
import type { ShapeRenderMeta } from '../src/captcha/types'

function makeCtx() {
  const calls: string[] = []
  return {
    calls,
    fillStyle: '' as string,
    strokeStyle: '' as string,
    lineWidth: 0 as number,
    fillRect: vi.fn(),
    fill: vi.fn(() => calls.push('fill')),
    stroke: vi.fn(() => calls.push('stroke')),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    font: '' as string,
    textAlign: '' as string,
    textBaseline: '' as string,
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 15 })),
    lineCap: '' as string,
    lineJoin: '' as string,
    setTransform: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn()
  } as any
}

const baseMeta: ShapeRenderMeta = {
  id: 'a',
  challenge: { id: 'a', character: 'A', order: 1 },
  char: 'A',
  x: 100, y: 100, fontSize: 28,
  captured: false,
  pickOrder: 0,
  gradientAngle: 0,
  gradientKind: 'radial',
  gradientOpacityA: 0.3,
  gradientOpacityB: 0.7,
  rotation: 0,
  rotationSpeed: 0,
  tiltX: 0,
  tiltY: 0,
  tiltPhase: 0,
  tiltFreqX: 0,
  tiltFreqY: 0,
  tiltAmp: 0
}

describe('renderer.preRenderCamo', () => {
  it('draws multi-grain rectangles and stipple dots', () => {
    const ctx = makeCtx()
    preRenderCamo(ctx, 200, 100)
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(20)
    expect(ctx.arc.mock.calls.length).toBeGreaterThan(20)
  })
})

describe('renderer.drawCharacter', () => {
  it('fills character with gradient and strokes with outline', () => {
    const ctx = makeCtx()
    drawCharacter(ctx, baseMeta, true, false)
    expect(ctx.createRadialGradient).toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalled()
    expect(ctx.strokeText).toHaveBeenCalled()
  })

  it('skips outline for decoy chars', () => {
    const ctx = makeCtx()
    drawCharacter(ctx, baseMeta, false, true)
    expect(ctx.strokeText).not.toHaveBeenCalled()
  })

  it('draws stipple dots around character', () => {
    const ctx = makeCtx()
    drawCharacter(ctx, baseMeta, true, false)
    expect(ctx.arc.mock.calls.length).toBeGreaterThan(10)
  })

  it('uses linear gradient when kind=linear', () => {
    const ctx = makeCtx()
    drawCharacter(ctx, { ...baseMeta, gradientKind: 'linear' }, true, false)
    expect(ctx.createLinearGradient).toHaveBeenCalled()
  })
})

describe('renderer overlays', () => {
  it('drawOrderIndicator draws a white circle and a number', () => {
    const ctx = makeCtx()
    drawOrderIndicator(ctx, 100, 100, 2)
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number))
  })

  it('drawSuccessCheck draws a check path', () => {
    const ctx = makeCtx()
    drawSuccessCheck(ctx, 50, 50)
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
  })
})