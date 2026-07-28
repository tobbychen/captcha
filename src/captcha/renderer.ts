import { CAMO_PALETTE, pickCamoColor } from './palette'

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