export type ShapeType =
  | 'circle' | 'triangle' | 'square' | 'star' | 'pentagon' | 'hexagon'

export const SHAPE_TYPES: ShapeType[] = [
  'circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'
]

export const DECOY_CHAR_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export interface Challenge {
  id: string
  character: string
  order: number
}

export interface VerifyResult {
  ok: boolean
  orderedIds: string[]
  expected: string[]
}

export interface CapturedShape {
  challenge: Challenge | null
  x: number
  y: number
  pickOrder: number
}

export interface ShapeRenderMeta {
  id: string
  challenge: Challenge | null
  char: string
  x: number
  y: number
  fontSize: number
  captured: boolean
  pickOrder: number
  gradientAngle: number
  gradientKind: 'radial' | 'linear'
  gradientOpacityA: number
  gradientOpacityB: number
  rotation: number
  rotationSpeed: number
  tiltX: number
  tiltY: number
  tiltPhase: number
  tiltFreqX: number
  tiltFreqY: number
  tiltAmp: number
}

export interface EngineConfig {
  width: number
  height: number
  challenges: Challenge[]
  decoyRange: [number, number]
  motionSpeed: number
}