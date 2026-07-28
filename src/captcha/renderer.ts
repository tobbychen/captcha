import { CAMO_PALETTE, pickCamoColor } from './palette'
import { getShapePath } from './shapes'
import { STIPPLE_DARK, STIPPLE_LIGHT, OUTLINE_COLOR, SHAPE_FILL_A, SHAPE_FILL_B } from './palette'
import type { ShapeRenderMeta } from './types'

export function preRenderCamo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = CAMO_PALETTE[0]
  ctx.fillRect(0, 0, width, height)

  const blockCount = Math.floor((width * height) / 60)
  for (let i = 0; i < blockCount; i++) {
    const bw = 4 + Math.random() * 10
    const bh = 4 + Math.random() * 10
    const bx = Math.random() * (width - bw)
    const by = Math.random() * (height - bh)
    ctx.fillStyle = pickCamoColor()
    ctx.fillRect(bx, by, bw, bh)
  }

  const dotCount = Math.floor((width * height) / 80)
  for (let i = 0; i < dotCount; i++) {
    const r = 0.6 + Math.random() * 1.2
    const x = Math.random() * width
    const y = Math.random() * height
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = pickCamoColor()
    ctx.fill()
  }
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  meta: ShapeRenderMeta,
  outline: boolean,
  decoy: boolean
): void {
  const path = getShapePath(meta.shape, meta.x, meta.y, meta.size)

  ctx.save()
  if (decoy) ctx.globalAlpha = 0.55

  if (meta.gradientKind === 'radial') {
    const grad = ctx.createRadialGradient(meta.x, meta.y, 0, meta.x, meta.y, meta.size * 1.2)
    grad.addColorStop(0, hexWithAlpha(SHAPE_FILL_B, meta.gradientOpacityA))
    grad.addColorStop(1, hexWithAlpha(SHAPE_FILL_A, meta.gradientOpacityB))
    ctx.fillStyle = grad
  } else {
    const a = meta.gradientAngle
    const r = meta.size * 1.4
    const x0 = meta.x - Math.cos(a) * r
    const y0 = meta.y - Math.sin(a) * r
    const x1 = meta.x + Math.cos(a) * r
    const y1 = meta.y + Math.sin(a) * r
    const grad = ctx.createLinearGradient(x0, y0, x1, y1)
    grad.addColorStop(0, hexWithAlpha(SHAPE_FILL_A, meta.gradientOpacityA))
    grad.addColorStop(1, hexWithAlpha(SHAPE_FILL_B, meta.gradientOpacityB))
    ctx.fillStyle = grad
  }

  ctx.fill(path)

  const stippleCount = 18 + Math.floor(Math.random() * 13)
  for (let i = 0; i < stippleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * meta.size * 0.85
    const dx = meta.x + Math.cos(angle) * dist
    const dy = meta.y + Math.sin(angle) * dist
    const r = 0.4 + Math.random() * 0.9
    const light = Math.random() < 0.18
    ctx.beginPath()
    ctx.arc(dx, dy, r, 0, Math.PI * 2)
    ctx.fillStyle = light ? hexWithAlpha(STIPPLE_LIGHT, 0.45) : hexWithAlpha(STIPPLE_DARK, 0.85)
    ctx.fill()
  }

  if (outline) {
    ctx.strokeStyle = OUTLINE_COLOR
    ctx.lineWidth = 2
    ctx.stroke(path)
  }

  ctx.restore()
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return hex + a
}