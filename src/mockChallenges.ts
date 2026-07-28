import type { Challenge, ShapeType } from './captcha/types'

const ALL: ShapeType[] = ['circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon']

export function generateMockChallenges(count = 4): Challenge[] {
  const pool = [...ALL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count).map((shape, i) => ({
    id: `c-${Date.now()}-${i}`,
    shape,
    order: i + 1
  }))
}