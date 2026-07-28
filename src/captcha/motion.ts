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
  return randomPath(width, height, padding)
}

export function newContinuousPath(
  head: Point,
  width: number,
  height: number,
  padding: number
): BezierPath {
  const maxStep = Math.min(width, height) * 0.35
  const candidates: Point[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.4
    const dist = maxStep * (0.4 + Math.random() * 0.6)
    const x = head.x + Math.cos(angle) * dist
    const y = head.y + Math.sin(angle) * dist
    if (
      x >= padding && x <= width - padding &&
      y >= padding && y <= height - padding
    ) {
      candidates.push({ x, y })
    }
  }
  const fallback: Point = {
    x: Math.min(Math.max(head.x, padding), width - padding),
    y: Math.min(Math.max(head.y, padding), height - padding)
  }
  const p3 = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : fallback

  const oppositeAngle = Math.atan2(p3.y - head.y, p3.x - head.x) + Math.PI
  const cpDist1 = maxStep * 0.3
  const cpDist2 = maxStep * 0.45
  const cpSpread = 0.6 + Math.random() * 0.4

  const p1 = clampPoint({
    x: head.x + Math.cos(oppositeAngle) * cpDist1 + (Math.random() - 0.5) * cpSpread * maxStep * 0.2,
    y: head.y + Math.sin(oppositeAngle) * cpDist1 + (Math.random() - 0.5) * cpSpread * maxStep * 0.2
  }, padding, width, height)

  const p2 = clampPoint({
    x: p3.x + Math.cos(oppositeAngle + Math.PI) * cpDist2 + (Math.random() - 0.5) * cpSpread * maxStep * 0.2,
    y: p3.y + Math.sin(oppositeAngle + Math.PI) * cpDist2 + (Math.random() - 0.5) * cpSpread * maxStep * 0.2
  }, padding, width, height)

  return {
    p0: { x: head.x, y: head.y },
    p1,
    p2,
    p3,
    t: 0,
    duration: randBetween(3000, 6000)
  }
}

function randomPath(width: number, height: number, padding: number): BezierPath {
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

function clampPoint(p: Point, padding: number, width: number, height: number): Point {
  return {
    x: Math.min(Math.max(p.x, padding + 5), width - padding - 5),
    y: Math.min(Math.max(p.y, padding + 5), height - padding - 5)
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
    const next = newContinuousPath(path.p3, width, height, padding)
    return next
  }
  return { ...path, t: newT }
}