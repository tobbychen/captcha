import { CAMO_PALETTE, pickCamoColor } from './palette'
import { STIPPLE_DARK, STIPPLE_LIGHT, OUTLINE_COLOR, SHAPE_FILL_A, SHAPE_FILL_B } from './palette'
import type { ShapeRenderMeta } from './types'

export const CAMO_TILE_HEIGHT = 200

export function fillCamo(ctx: CanvasRenderingContext2D, width: number, height: number): void {
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

export function preRenderCamo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  fillCamo(ctx, width, height)
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  meta: ShapeRenderMeta,
  outline: boolean,
  decoy: boolean
): void {
  ctx.save()
  if (decoy) ctx.globalAlpha = 0.55

  ctx.translate(meta.x, meta.y)
  ctx.rotate(meta.rotation)
  ctx.scale(
    Math.max(0.15, Math.abs(Math.cos(meta.tiltY))),
    Math.max(0.15, Math.abs(Math.cos(meta.tiltX)))
  )
  ctx.translate(-meta.x, -meta.y)

  const fontSize = meta.fontSize
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (meta.gradientKind === 'radial') {
    const grad = ctx.createRadialGradient(meta.x, meta.y, 0, meta.x, meta.y, fontSize * 0.7)
    grad.addColorStop(0, hexWithAlpha(SHAPE_FILL_B, meta.gradientOpacityA))
    grad.addColorStop(1, hexWithAlpha(SHAPE_FILL_A, meta.gradientOpacityB))
    ctx.fillStyle = grad
  } else {
    const a = meta.gradientAngle
    const r = fontSize * 0.8
    const x0 = meta.x - Math.cos(a) * r
    const y0 = meta.y - Math.sin(a) * r
    const x1 = meta.x + Math.cos(a) * r
    const y1 = meta.y + Math.sin(a) * r
    const grad = ctx.createLinearGradient(x0, y0, x1, y1)
    grad.addColorStop(0, hexWithAlpha(SHAPE_FILL_A, meta.gradientOpacityA))
    grad.addColorStop(1, hexWithAlpha(SHAPE_FILL_B, meta.gradientOpacityB))
    ctx.fillStyle = grad
  }

  ctx.shadowColor = outline
    ? 'rgba(31, 10, 4, 0.45)'
    : 'rgba(31, 10, 4, 0.25)'
  ctx.shadowBlur = outline ? 4 : 7
  ctx.fillText(meta.char, meta.x, meta.y)
  ctx.shadowBlur = 0

  const metrics = ctx.measureText(meta.char)
  const boxW = Math.max(metrics.width, fontSize * 0.4)
  const boxH = fontSize

  const stippleCount = 14 + Math.floor(Math.random() * 10)
  for (let i = 0; i < stippleCount; i++) {
    const sx = meta.x - boxW / 2 + Math.random() * boxW
    const sy = meta.y - boxH / 2 + Math.random() * boxH
    const r = 0.4 + Math.random() * 0.9
    const light = Math.random() < 0.18
    ctx.beginPath()
    ctx.arc(sx, sy, r, 0, Math.PI * 2)
    ctx.fillStyle = light ? hexWithAlpha(STIPPLE_LIGHT, 0.45) : hexWithAlpha(STIPPLE_DARK, 0.85)
    ctx.fill()
  }

  if (outline) {
    ctx.strokeStyle = OUTLINE_COLOR
    ctx.lineWidth = 1
    ctx.strokeText(meta.char, meta.x, meta.y)
  }

  ctx.restore()
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return hex + a
}

export function drawOrderIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pickOrder: number
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#1f0a04'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#1f0a04'
  ctx.font = '700 12px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(pickOrder), x, y + 1)
  ctx.restore()
}

export function drawSuccessCheck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, 14, 0, Math.PI * 2)
  ctx.fillStyle = '#16a34a'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(x - 7, y)
  ctx.lineTo(x - 2, y + 5)
  ctx.lineTo(x + 8, y - 6)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()
}