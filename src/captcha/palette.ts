export const CAMO_PALETTE = [
  '#c8cbb6',
  '#8b9078',
  '#6a6e54',
  '#a6a98d',
  '#5d6148',
  '#3d4030'
] as const

const WEIGHTS = [0.25, 0.22, 0.18, 0.15, 0.12, 0.08]

export function pickCamoColor(): string {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < CAMO_PALETTE.length; i++) {
    acc += WEIGHTS[i]
    if (r < acc) return CAMO_PALETTE[i]
  }
  return CAMO_PALETTE[CAMO_PALETTE.length - 1]
}

export const STIPPLE_DARK = '#1f0a04'
export const STIPPLE_LIGHT = '#fce4d2'
export const OUTLINE_COLOR = '#1f0a04'
export const SHAPE_FILL_A = '#8a2818'
export const SHAPE_FILL_B = '#d05a3a'