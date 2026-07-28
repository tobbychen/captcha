import type { Challenge, EngineConfig, ShapeRenderMeta, VerifyResult } from './types'
import { SHAPE_TYPES } from './types'
import { preRenderCamo, drawShape, drawOrderIndicator, drawSuccessCheck } from './renderer'
import { newBezierPath, advanceBezier, bezierPosition, type BezierPath } from './motion'

const PADDING = 18
const HIT_RADIUS = 25
const SHAPE_BASE_SIZE = 18

interface EngineCallbacks {
  onVerify: (r: VerifyResult) => void
  onProgress: (picked: number, total: number) => void
}

interface InternalShape extends ShapeRenderMeta {
  challenge: Challenge | null
  path: BezierPath
}

export class CaptchaEngine {
  private ctx: CanvasRenderingContext2D
  private config: EngineConfig
  private callbacks: EngineCallbacks
  private shapes: InternalShape[] = []
  private rafId: number | null = null
  private lastTs = 0
  private pickOrder = 0
  private verified = false
  private camoCanvas: HTMLCanvasElement | null = null

  constructor(config: EngineConfig, ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks) {
    this.config = config
    this.ctx = ctx
    this.callbacks = callbacks
    this.warnDuplicates()
    this.spawnShapes()
    this.preRenderCamo()
  }

  private warnDuplicates() {
    const ids = new Set<string>()
    const orders = new Set<number>()
    for (const c of this.config.challenges) {
      if (ids.has(c.id)) console.warn(`[Captcha] duplicate challenge id: ${c.id}`)
      if (orders.has(c.order)) console.warn(`[Captcha] duplicate challenge order: ${c.order}`)
      ids.add(c.id)
      orders.add(c.order)
    }
  }

  private spawnShapes() {
    this.shapes = []
    this.pickOrder = 0
    this.verified = false

    for (const c of this.config.challenges) {
      this.shapes.push(this.makeShape(c.shape, c, false))
    }

    const [minDecoy, maxDecoy] = this.config.decoyRange
    const decoyCount = minDecoy + Math.floor(Math.random() * (maxDecoy - minDecoy + 1))
    const challengeShapes = new Set(this.config.challenges.map(c => c.shape))
    const pool = SHAPE_TYPES.filter(t => !challengeShapes.has(t))
    for (let i = 0; i < decoyCount; i++) {
      const t = pool[Math.floor(Math.random() * pool.length)]
      this.shapes.push(this.makeShape(t, null, true))
    }

    this.initializePositions()
  }

  private initializePositions() {
    const padding = PADDING + SHAPE_BASE_SIZE
    for (const s of this.shapes) {
      const pos = bezierPosition(s.path, 0)
      s.x = pos.x
      s.y = pos.y
      if (s.x < padding) s.x = padding
      if (s.x > this.config.width - padding) s.x = this.config.width - padding
      if (s.y < padding) s.y = padding
      if (s.y > this.config.height - padding) s.y = this.config.height - padding
    }
  }

  private makeShape(shape: import('./types').ShapeType, challenge: Challenge | null, decoy: boolean): InternalShape {
    const path = newBezierPath(this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
    return {
      id: challenge ? challenge.id : `decoy-${Math.random().toString(36).slice(2, 8)}`,
      challenge,
      shape,
      x: 0, y: 0,
      size: SHAPE_BASE_SIZE + Math.random() * 4,
      captured: false,
      pickOrder: 0,
      gradientAngle: Math.random() * Math.PI * 2,
      gradientKind: Math.random() < 0.5 ? 'radial' : 'linear',
      gradientOpacityA: 0.25 + Math.random() * 0.2,
      gradientOpacityB: 0.55 + Math.random() * 0.2,
      path
    }
  }

  private preRenderCamo() {
    if (typeof document === 'undefined') {
      this.camoCanvas = null
      return
    }
    const off = document.createElement('canvas')
    off.width = this.config.width
    off.height = this.config.height
    const octx = off.getContext('2d')
    if (!octx) {
      this.camoCanvas = null
      return
    }
    preRenderCamo(octx, this.config.width, this.config.height)
    this.camoCanvas = off
  }

  start() {
    if (this.rafId !== null) return
    if (typeof requestAnimationFrame === 'undefined') return
    this.lastTs = performance.now()
    const loop = (ts: number) => {
      const dt = ts - this.lastTs
      this.lastTs = ts
      this.update(dt)
      this.render()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  refresh(newChallenges: Challenge[]) {
    this.stop()
    this.config = { ...this.config, challenges: newChallenges }
    this.spawnShapes()
    this.preRenderCamo()
    this.start()
  }

  reset() {
    for (const s of this.shapes) {
      s.captured = false
      s.pickOrder = 0
      s.path = newBezierPath(this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
    }
    this.pickOrder = 0
    this.verified = false
    this.callbacks.onProgress(0, this.config.challenges.length)
  }

  handleClick(x: number, y: number) {
    if (this.verified) return

    let bestIdx = -1
    let bestDist = HIT_RADIUS
    for (let i = 0; i < this.shapes.length; i++) {
      const s = this.shapes[i]
      if (s.captured) continue
      const dx = x - s.x
      const dy = y - s.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    if (bestIdx < 0) return

    const s = this.shapes[bestIdx]
    s.captured = true
    this.pickOrder++
    s.pickOrder = this.pickOrder
    this.callbacks.onProgress(this.pickOrder, this.config.challenges.length)

    if (this.pickOrder >= this.config.challenges.length) {
      this.emitVerify()
    }
  }

  private emitVerify() {
    this.verified = true
    const expected = [...this.config.challenges]
      .sort((a, b) => a.order - b.order)
      .map(c => c.id)

    const captured = this.shapes.filter(s => s.pickOrder > 0)
      .sort((a, b) => a.pickOrder - b.pickOrder)
    const userOrder: string[] = []
    for (const s of captured) {
      if (s.challenge) userOrder.push(s.challenge.id)
      else userOrder.push('__decoy__')
    }

    const allReal = captured.every(s => s.challenge !== null)
    const orderMatches = userOrder.length === expected.length &&
      userOrder.every((id, i) => id === expected[i])

    const result: VerifyResult = {
      ok: allReal && orderMatches,
      orderedIds: userOrder,
      expected
    }
    this.callbacks.onVerify(result)
  }

  private update(dt: number) {
    const dtClamped = Math.min(dt, 50) * this.config.motionSpeed
    for (const s of this.shapes) {
      if (s.captured) continue
      s.path = advanceBezier(s.path, dtClamped, this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
      const pos = bezierPosition(s.path, s.path.t)
      s.x = pos.x
      s.y = pos.y
    }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.config.width, this.config.height)
    if (this.camoCanvas) {
      ctx.drawImage(this.camoCanvas, 0, 0, this.config.width, this.config.height)
    }

    for (const s of this.shapes) {
      const isDecoy = s.challenge === null
      const showOutline = !isDecoy
      drawShape(ctx, s, showOutline, isDecoy)
    }

    for (const s of this.shapes) {
      if (s.captured && s.challenge) {
        drawOrderIndicator(ctx, s.x, s.y, s.pickOrder)
      }
    }

    if (this.verified) {
      drawSuccessCheck(ctx, this.config.width - 24, 24)
    }
  }

  getState() {
    return {
      shapes: this.shapes.map(s => ({
        id: s.id,
        challenge: s.challenge,
        shape: s.shape,
        x: s.x, y: s.y,
        size: s.size,
        captured: s.captured,
        pickOrder: s.pickOrder,
        gradientAngle: s.gradientAngle,
        gradientKind: s.gradientKind,
        gradientOpacityA: s.gradientOpacityA,
        gradientOpacityB: s.gradientOpacityB
      })) as ShapeRenderMeta[],
      verified: this.verified,
      pickOrder: this.pickOrder
    }
  }
}