import type { Challenge } from './captcha/types'
import { DECOY_CHAR_POOL } from './captcha/types'

const CHALLENGE_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateMockChallenges(count = 4): Challenge[] {
  const pool = [...CHALLENGE_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count).map((char, i) => ({
    id: `c-${Date.now()}-${i}`,
    character: char,
    order: i + 1
  }))
}