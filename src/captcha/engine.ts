import type { Challenge, EngineConfig, ShapeRenderMeta, VerifyResult } from './types'
import { SHAPE_TYPES } from './types'
import { fillCamo, drawShape, drawOrderIndicator, drawSuccessCheck, CAMO_TILE_HEIGHT } from './renderer'
import { newBezierPath, advanceBezier, bezierPosition, type BezierPath } from './motion'

const PADDING = 18
const HIT_RADIUS = 25
const SHAPE_BASE_SIZE = 18
const SCROLL_SPEED = 0.025

interface EngineCallbacks {
  onVerify: (r: VerifyResult) => void
  onProgress: (picked: number, total: number) => void
}

interface InternalShape extends ShapeRenderMeta {
  challenge: Challenge | null
  path: BezierPath
  spawnTime: number
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
  private camoPattern: CanvasPattern | null = null
  private scrollOffset = 0

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
    this.scrollOffset = 0

    const now = performance.now()
    for (const c of this.config.challenges) {
      this.shapes.push(this.makeShape(c.shape, c, false, now))
    }

    const [minDecoy, maxDecoy] = this.config.decoyRange
    const decoyCount = minDecoy + Math.floor(Math.random() * (maxDecoy - minDecoy + 1))
    const challengeShapes = new Set(this.config.challenges.map(c => c.shape))
    const pool = SHAPE_TYPES.filter(t => !challengeShapes.has(t))
    for (let i = 0; i < decoyCount; i++) {
      const t = pool[Math.floor(Math.random() * pool.length)]
      this.shapes.push(this.makeShape(t, null, true, now))
    }

    this.initializePositions()
  }

  private makeShape(shape: import('./types').ShapeType, challenge: Challenge | null, decoy: boolean, now: number): InternalShape {
    const path = newBezierPath(this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
    const style = Math.random()
    const spin = Math.random() < 0.6
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
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: spin ? (Math.random() - 0.5) * 0.0006 : 0,
      tiltX: 0,
      tiltY: 0,
      tiltPhase: Math.random() * Math.PI * 2,
      tiltFreqX: 0.0008 + Math.random() * 0.0012,
      tiltFreqY: 0.0008 + Math.random() * 0.0012,
      tiltAmp: style < 0.4 ? 0 : Math.PI / 3,
      spawnTime: now,
      path
    }
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

  private preRenderCamo() {
    if (typeof document === 'undefined') {
      this.camoPattern = null
      return
    }
    const W = this.config.width
    const tile = document.createElement('canvas')
    tile.width = W
    tile.height = CAMO_TILE_HEIGHT
    const tctx = tile.getContext('2d')
    if (!tctx) {
      this.camoPattern = null
      return
    }
    fillCamo(tctx, W, CAMO_TILE_HEIGHT)
    this.camoPattern = this.ctx.createPattern(tile, 'repeat')
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
    this.scrollOffset = (this.scrollOffset + dtClamped * SCROLL_SPEED) % CAMO_TILE_HEIGHT
    const now = performance.now()

    for (const s of this.shapes) {
      if (s.captured) continue
      s.path = advanceBezier(s.path, dtClamped, this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
      const pos = bezierPosition(s.path, s.path.t)
      s.x = pos.x
      s.y = pos.y
      s.rotation += s.rotationSpeed * dtClamped
      const elapsed = now - s.spawnTime
      s.tiltX = Math.cos(elapsed * s.tiltFreqX + s.tiltPhase) * s.tiltAmp
      s.tiltY = Math.sin(elapsed * s.tiltFreqY + s.tiltPhase) * s.tiltAmp
    }
  }

  private render() {
    const ctx = this.ctx
    const W = this.config.width
    const H = this.config.height
    ctx.clearRect(0, 0, W, H)

    if (this.camoPattern) {
      ctx.save()
      ctx.fillStyle = this.camoPattern
      const offset = this.scrollOffset % CAMO_TILE_HEIGHT
      ctx.translate(0, offset)
      ctx.fillRect(0, -CAMO_TILE_HEIGHT, W, H + 2 * CAMO_TILE_HEIGHT)
      ctx.restore()
    }

    const capturedForIndicator: Array<{ x: number; y: number; pickOrder: number }> = []

    for (const s of this.shapes) {
      const isDecoy = s.challenge === null
      const showOutline = !isDecoy
      drawShape(ctx, s, showOutline, isDecoy)
      if (s.captured && s.challenge) {
        capturedForIndicator.push({ x: s.x, y: s.y, pickOrder: s.pickOrder })
      }
    }

    ctx.save()
    ctx.beginPath()
    for (const ind of capturedForIndicator) {
      ctx.rect(ind.x - 14, ind.y - 14, 28, 28)
    }
    ctx.clip()
    ctx.restore()

    for (const ind of capturedForIndicator) {
      drawOrderIndicator(ctx, ind.x, ind.y, ind.pickOrder)
    }

    if (this.verified) {
      drawSuccessCheck(ctx, W - 24, 24)
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
        gradientOpacityB: s.gradientOpacityB,
        rotation: s.rotation,
        rotationSpeed: s.rotationSpeed,
        tiltX: s.tiltX,
        tiltY: s.tiltY,
        tiltPhase: s.tiltPhase,
        tiltFreqX: s.tiltFreqX,
        tiltFreqY: s.tiltFreqY,
        tiltAmp: s.tiltAmp
      })) as ShapeRenderMeta[],
      verified: this.verified,
      pickOrder: this.pickOrder,
      scrollOffset: this.scrollOffset
    }
  }

  debugCamoCanvas(): HTMLCanvasElement | null {
    return null
  }
}