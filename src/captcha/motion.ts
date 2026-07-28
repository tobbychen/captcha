export interface Point {
  x: number
  y: number
}

export interface BezierPath {
  p0: Point
  p1: Point
  p2: Point
  p3: Point
  t: number
  duration: number
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function newBezierPath(width: number, height: number, padding: number): BezierPath {
  const p = (): Point => ({
    x: randBetween(padding, width - padding),
    y: randBetween(padding, height - padding)
  })
  return {
    p0: p(),
    p1: p(),
    p2: p(),
    p3: p(),
    t: 0,
    duration: randBetween(3000, 6000)
  }
}

export function bezierPosition(path: BezierPath, t: number): Point {
  const u = 1 - t
  const x = u * u * u * path.p0.x +
            3 * u * u * t * path.p1.x +
            3 * u * t * t * path.p2.x +
            t * t * t * path.p3.x
  const y = u * u * u * path.p0.y +
            3 * u * u * t * path.p1.y +
            3 * u * t * t * path.p2.y +
            t * t * t * path.p3.y
  return { x, y }
}

export function advanceBezier(path: BezierPath, dtMs: number, width: number, height: number, padding: number): BezierPath {
  const newT = path.t + dtMs / path.duration
  if (newT >= 1) {
    const fresh = newBezierPath(width, height, padding)
    return { ...fresh, t: 0 }
  }
  return { ...path, t: newT }
}