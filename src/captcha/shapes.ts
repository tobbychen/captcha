import type { ShapeType } from './types'

export const SHAPE_SIZES: Record<ShapeType, number> = {
  circle: 1.0,
  triangle: 1.1,
  square: 1.0,
  star: 1.15,
  pentagon: 1.05,
  hexagon: 1.05
}

function buildCircle(p: Path2D, x: number, y: number, r: number) {
  p.moveTo(x + r, y)
  p.arc(x, y, r, 0, Math.PI * 2)
}

function buildPolygon(p: Path2D, x: number, y: number, r: number, sides: number, rotation = -Math.PI / 2) {
  p.moveTo(x + r * Math.cos(rotation), y + r * Math.sin(rotation))
  for (let i = 1; i <= sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides
    p.lineTo(x + r * Math.cos(a), y + r * Math.sin(a))
  }
  p.closePath()
}

function buildStar(p: Path2D, x: number, y: number, r: number) {
  const spikes = 5
  const outer = r
  const inner = r * 0.45
  let rot = -Math.PI / 2
  const step = Math.PI / spikes
  p.moveTo(x + Math.cos(rot) * outer, y + Math.sin(rot) * outer)
  for (let i = 0; i < spikes; i++) {
    rot += step
    p.lineTo(x + Math.cos(rot) * inner, y + Math.sin(rot) * inner)
    rot += step
    p.lineTo(x + Math.cos(rot) * outer, y + Math.sin(rot) * outer)
  }
  p.closePath()
}

export function getShapePath(type: ShapeType, x: number, y: number, size: number): Path2D {
  const r = size * SHAPE_SIZES[type]
  const p = new Path2D()
  switch (type) {
    case 'circle': buildCircle(p, x, y, r); break
    case 'triangle': buildPolygon(p, x, y, r, 3); break
    case 'square': buildPolygon(p, x, y, r, 4, Math.PI / 4); break
    case 'pentagon': buildPolygon(p, x, y, r, 5); break
    case 'hexagon': buildPolygon(p, x, y, r, 6); break
    case 'star': buildStar(p, x, y, r); break
    default: throw new Error(`Unknown shape type: ${type}`)
  }
  return p
}