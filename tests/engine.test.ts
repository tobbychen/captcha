import { describe, it, expect, vi } from 'vitest'
import { CaptchaEngine } from '../src/captcha/engine'
import type { Challenge } from '../src/captcha/types'

function makeChallenges(): Challenge[] {
  return [
    { id: 'a', shape: 'circle', order: 1 },
    { id: 'b', shape: 'triangle', order: 2 },
    { id: 'c', shape: 'square', order: 3 },
    { id: 'd', shape: 'star', order: 4 }
  ]
}

function makeCtx() {
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 0,
    fillRect: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(),
    beginPath: vi.fn(), arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
    rect: vi.fn(), clip: vi.fn(),
    save: vi.fn(), restore: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(() => null),
    fillText: vi.fn(),
    setTransform: vi.fn(), scale: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    font: '', textAlign: '', textBaseline: '',
    globalAlpha: 1,
    lineCap: '', lineJoin: ''
  } as any
}

describe('CaptchaEngine', () => {
  it('spawns challenges.length + random decoys within range', () => {
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [1, 2],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress: vi.fn() })

    engine.start()
    const total = engine.getState().shapes.length
    expect(total).toBeGreaterThanOrEqual(5)
    expect(total).toBeLessThanOrEqual(6)
    engine.stop()
  })

  it('decoy types do not duplicate any challenge shape', () => {
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [2, 2],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress: vi.fn() })
    engine.start()

    const shapes = engine.getState().shapes
    const challengeShapes = new Set(makeChallenges().map(c => c.shape))
    for (const s of shapes) {
      if (s.challenge === null) {
        expect(challengeShapes.has(s.shape)).toBe(false)
      }
    }
    engine.stop()
  })

  it('captures nearest shape on click and freezes its position', () => {
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress: vi.fn() })
    engine.start()

    const before = engine.getState().shapes[0]
    engine.handleClick(before.x, before.y)

    const after = engine.getState().shapes[0]
    expect(after.captured).toBe(true)
    expect(after.x).toBe(before.x)
    expect(after.y).toBe(before.y)
    engine.stop()
  })

  it('emits verify with ok=true on correct order', () => {
    const onVerify = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress: vi.fn() })
    engine.start()

    const sorted = [...engine.getState().shapes].sort((a, b) =>
      (a.challenge!.order - b.challenge!.order)
    )
    for (const s of sorted) {
      engine.handleClick(s.x, s.y)
    }

    expect(onVerify).toHaveBeenCalledOnce()
    expect(onVerify.mock.calls[0][0].ok).toBe(true)
    expect(onVerify.mock.calls[0][0].orderedIds).toEqual(['a', 'b', 'c', 'd'])
    engine.stop()
  })

  it('emits verify with ok=false when wrong order', () => {
    const onVerify = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress: vi.fn() })
    engine.start()

    const reversed = [...engine.getState().shapes].reverse()
    for (const s of reversed) {
      engine.handleClick(s.x, s.y)
    }
    expect(onVerify.mock.calls[0][0].ok).toBe(false)
    engine.stop()
  })

  it('emits verify with ok=false when decoy is clicked', () => {
    const onVerify = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [1, 1],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress: vi.fn() })
    engine.start()

    const shapes = engine.getState().shapes
    const decoy = shapes.find(s => s.challenge === null)!
    engine.handleClick(decoy.x, decoy.y)

    const real = shapes.filter(s => s.challenge !== null)
    for (const s of real) {
      engine.handleClick(s.x, s.y)
    }

    expect(onVerify).toHaveBeenCalledOnce()
    expect(onVerify.mock.calls[0][0].ok).toBe(false)
    engine.stop()
  })

  it('progress event fires with picked count', () => {
    const onProgress = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress })
    engine.start()
    const first = engine.getState().shapes[0]
    engine.handleClick(first.x, first.y)
    expect(onProgress).toHaveBeenCalledWith(1, 4)
    engine.stop()
  })

  it('warns on duplicate challenge ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const dups: Challenge[] = [
      { id: 'a', shape: 'circle', order: 1 },
      { id: 'a', shape: 'triangle', order: 2 }
    ]
    const engine = new CaptchaEngine({
      width: 200, height: 100,
      challenges: dups,
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress: vi.fn() })
    engine.start()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate challenge id'))
    warn.mockRestore()
    engine.stop()
  })
})