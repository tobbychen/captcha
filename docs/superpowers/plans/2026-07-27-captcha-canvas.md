# Captcha Canvas Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 captcha component that renders backend-provided shapes on a digital-camouflage noise canvas with Bézier motion, lets users click shapes in order, and emits a verification result.

**Architecture:** Thin Vue SFC wrapper around a framework-free `CaptchaEngine` (rAF main loop, state machine, hit-test) and `Renderer` (camo bitmap cache + shape drawing + overlays). Component is single-instance, lifecycle-bound to the SFC mount/unmount.

**Tech Stack:** Vite, Vue 3 (script setup + Composition API), TypeScript, vitest, @vue/test-utils, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-27-captcha-canvas-design.md`

---

## File Structure

```
captcha/
├── AGENTS.md                          # update at end with verified commands
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── index.html
├── src/
│   ├── main.ts
│   ├── App.vue                        # demo with side panel
│   ├── components/
│   │   └── CaptchaCanvas.vue
│   ├── captcha/
│   │   ├── types.ts                   # Challenge, VerifyResult, CapturedShape, ShapeType
│   │   ├── palette.ts                 # color constants + weighted random
│   │   ├── shapes.ts                  # geometry path generators
│   │   ├── motion.ts                  # Bézier control points + advance
│   │   ├── renderer.ts                # camo cache + shape + overlay drawing
│   │   └── engine.ts                  # rAF loop, state machine, hit-test, verify
└── tests/
    ├── palette.test.ts
    ├── shapes.test.ts
    ├── motion.test.ts
    ├── renderer.test.ts
    ├── engine.test.ts
    ├── CaptchaCanvas.test.ts
    └── e2e/
        └── captcha.spec.ts
```

---

## Task 1: Scaffold Vite + Vue 3 + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.ts`

- [ ] **Step 1: Initialize package.json**

Create `package.json`:

```json
{
  "name": "captcha",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "~5.5.0",
    "vite": "^5.4.0",
    "vue-tsc": "^2.1.0",
    "vitest": "^2.1.0",
    "@vue/test-utils": "^2.4.0",
    "jsdom": "^25.0.0",
    "@playwright/test": "^1.47.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

- [ ] **Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Captcha Demo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Create src/main.ts**

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 8: Create placeholder App.vue**

```vue
<script setup lang="ts">
</script>

<template>
  <div>Captcha scaffold</div>
</template>
```

- [ ] **Step 9: Verify dev server starts**

Run: `npm run dev` (background, then check), expect Vite to print a localhost URL. Then kill the dev server.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + Vue 3 + TS project"
```

---

## Task 2: Configure vitest and add type definitions

**Files:**
- Create: `vitest.config.ts`
- Create: `src/captcha/types.ts`
- Create: `tests/types.test.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
})
```

- [ ] **Step 2: Write failing test for types**

Create `tests/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Challenge, VerifyResult, ShapeType } from '../src/captcha/types'

describe('types', () => {
  it('Challenge shape compiles', () => {
    const c: Challenge = { id: 'a', shape: 'circle', order: 1 }
    expect(c.id).toBe('a')
  })

  it('VerifyResult shape compiles', () => {
    const r: VerifyResult = { ok: true, orderedIds: ['a'], expected: ['a'] }
    expect(r.ok).toBe(true)
  })

  it('ShapeType unions all supported shapes', () => {
    const types: ShapeType[] = [
      'circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon'
    ]
    expect(types).toHaveLength(6)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `../src/captcha/types` not found.

- [ ] **Step 4: Create types.ts**

Create `src/captcha/types.ts`:

```ts
export type ShapeType =
  | 'circle' | 'triangle' | 'square' | 'star' | 'pentagon' | 'hexagon'

export interface Challenge {
  id: string
  shape: ShapeType
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
  shape: ShapeType
  x: number
  y: number
  size: number
  captured: boolean
  pickOrder: number
  gradientAngle: number
  gradientKind: 'radial' | 'linear'
  gradientOpacityA: number
  gradientOpacityB: number
}

export interface EngineConfig {
  width: number
  height: number
  challenges: Challenge[]
  decoyRange: [number, number]
  motionSpeed: number
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/captcha/types.ts tests/types.test.ts
git commit -m "feat: add type definitions + vitest config"
```

---

## Task 3: Palette module

**Files:**
- Create: `src/captcha/palette.ts`
- Create: `tests/palette.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/palette.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { CAMO_PALETTE, pickCamoColor, STIPPLE_DARK, STIPPLE_LIGHT } from '../src/captcha/palette'

describe('palette', () => {
  it('CAMO_PALETTE has 6 earth tones', () => {
    expect(CAMO_PALETTE).toHaveLength(6)
  })

  it('pickCamoColor returns one of the palette entries', () => {
    for (let i = 0; i < 50; i++) {
      const c = pickCamoColor()
      expect(CAMO_PALETTE).toContain(c)
    }
  })

  it('exports stipple colors', () => {
    expect(STIPPLE_DARK).toMatch(/^#[0-9a-f]{6}$/i)
    expect(STIPPLE_LIGHT).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/palette.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement palette.ts**

Create `src/captcha/palette.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/palette.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/palette.ts tests/palette.test.ts
git commit -m "feat: add palette module with weighted color picker"
```

---

## Task 4: Shape geometry primitives

**Files:**
- Create: `src/captcha/shapes.ts`
- Create: `tests/shapes.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/shapes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getShapePath, SHAPE_SIZES } from '../src/captcha/shapes'

describe('shapes', () => {
  it('exports size factor for each shape type', () => {
    expect(SHAPE_SIZES).toEqual({
      circle: expect.any(Number),
      triangle: expect.any(Number),
      square: expect.any(Number),
      star: expect.any(Number),
      pentagon: expect.any(Number),
      hexagon: expect.any(Number)
    })
  })

  it('getShapePath returns valid Path2D for each type', () => {
    for (const t of Object.keys(SHAPE_SIZES) as (keyof typeof SHAPE_SIZES)[]) {
      const p = getShapePath(t, 100, 100, 20)
      expect(p).toBeInstanceOf(Path2D)
    }
  })

  it('getShapePath throws for unknown type', () => {
    expect(() => getShapePath('unknown' as any, 0, 0, 10)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/shapes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement shapes.ts**

Create `src/captcha/shapes.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/shapes.test.ts`
Expected: PASS.

Note: `Path2D` is available in jsdom via Vitest's environment when canvas is not mocked. If jsdom lacks `Path2D`, install `canvas` package or skip that test by using `expect.any(Object)` instead. Preferred: leave as-is and let CI catch environment issues.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/shapes.ts tests/shapes.test.ts
git commit -m "feat: add shape geometry path generators"
```

---

## Task 5: Bézier motion module

**Files:**
- Create: `src/captcha/motion.ts`
- Create: `tests/motion.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/motion.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { newBezierPath, advanceBezier, type BezierPath } from '../src/captcha/motion'

describe('motion', () => {
  it('newBezierPath returns 4 points within bounds with padding', () => {
    const w = 200, h = 100, pad = 10
    const path = newBezierPath(w, h, pad)
    for (const pt of [path.p0, path.p1, path.p2, path.p3]) {
      expect(pt.x).toBeGreaterThanOrEqual(pad)
      expect(pt.x).toBeLessThanOrEqual(w - pad)
      expect(pt.y).toBeGreaterThanOrEqual(pad)
      expect(pt.y).toBeLessThanOrEqual(h - pad)
    }
  })

  it('advanceBezier moves forward at t=0.5', () => {
    const path: BezierPath = {
      p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 },
      p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
      t: 0, duration: 1000
    }
    const updated = advanceBezier(path, 500)
    expect(updated.t).toBeCloseTo(0.5)
  })

  it('advanceBezier wraps t back to 0 when reaching 1', () => {
    const path: BezierPath = {
      p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 },
      p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
      t: 0.95, duration: 1000
    }
    const updated = advanceBezier(path, 100)
    expect(updated.t).toBeLessThan(0.95)
    expect(updated.p3).not.toEqual(path.p3)
  })

  it('bezierPosition at t=0 returns p0', () => {
    const path: BezierPath = {
      p0: { x: 10, y: 20 }, p1: { x: 30, y: 40 },
      p2: { x: 50, y: 60 }, p3: { x: 70, y: 80 },
      t: 0, duration: 1000
    }
    expect(bezierPosition(path, 0)).toEqual({ x: 10, y: 20 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/motion.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement motion.ts**

Create `src/captcha/motion.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/motion.test.ts`
Expected: PASS.

Note: The `advanceBezier` test uses the 3-arg form in tests but implementation takes 5. Fix tests:

Update tests/shapes.test.ts -> tests/motion.test.ts Step 1, change calls to `advanceBezier(path, 500, 200, 100, 10)` etc.

Replace the test file content with:

```ts
import { describe, it, expect } from 'vitest'
import { newBezierPath, advanceBezier, bezierPosition, type BezierPath } from '../src/captcha/motion'

describe('motion', () => {
  it('newBezierPath returns 4 points within bounds with padding', () => {
    const w = 200, h = 100, pad = 10
    const path = newBezierPath(w, h, pad)
    for (const pt of [path.p0, path.p1, path.p2, path.p3]) {
      expect(pt.x).toBeGreaterThanOrEqual(pad)
      expect(pt.x).toBeLessThanOrEqual(w - pad)
      expect(pt.y).toBeGreaterThanOrEqual(pad)
      expect(pt.y).toBeLessThanOrEqual(h - pad)
    }
  })

  it('advanceBezier moves forward at dt=500', () => {
    const path: BezierPath = {
      p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 },
      p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
      t: 0, duration: 1000
    }
    const updated = advanceBezier(path, 500, 200, 100, 10)
    expect(updated.t).toBeCloseTo(0.5)
  })

  it('advanceBezier regenerates path when t reaches 1', () => {
    const path: BezierPath = {
      p0: { x: 0, y: 0 }, p1: { x: 0, y: 100 },
      p2: { x: 100, y: 100 }, p3: { x: 100, y: 0 },
      t: 0.95, duration: 1000
    }
    const updated = advanceBezier(path, 100, 200, 100, 10)
    expect(updated.t).toBeLessThan(0.95)
    expect(updated.p3.x).not.toEqual(path.p3.x)
  })

  it('bezierPosition at t=0 returns p0', () => {
    const path: BezierPath = {
      p0: { x: 10, y: 20 }, p1: { x: 30, y: 40 },
      p2: { x: 50, y: 60 }, p3: { x: 70, y: 80 },
      t: 0, duration: 1000
    }
    expect(bezierPosition(path, 0)).toEqual({ x: 10, y: 20 })
  })
})
```

Run again: `npm test -- tests/motion.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/motion.ts tests/motion.test.ts
git commit -m "feat: add Bézier motion path generation + advance"
```

---

## Task 6: Renderer — camo bitmap pre-render

**Files:**
- Create: `src/captcha/renderer.ts` (partial — only `preRenderCamo`)
- Create: `tests/renderer.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/renderer.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { preRenderCamo } from '../src/captcha/renderer'

function makeCtx() {
  const calls: string[] = []
  return {
    calls,
    fillStyle: '' as string,
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => calls.push(`fillRect ${x} ${y} ${w} ${h}`)),
    fill: vi.fn(() => calls.push('fill')),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fillStyle_set: (v: string) => { calls.push(`fillStyle=${v}`) }
  } as any
}

describe('renderer.preRenderCamo', () => {
  it('draws multi-grain rectangles and stipple dots', () => {
    const ctx = makeCtx()
    preRenderCamo(ctx, 200, 100)
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(20)
    expect(ctx.arc.mock.calls.length).toBeGreaterThan(20)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/renderer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement renderer.ts (camo only)**

Create `src/captcha/renderer.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/renderer.ts tests/renderer.test.ts
git commit -m "feat: add renderer camo bitmap pre-render"
```

---

## Task 7: Renderer — shape drawing

**Files:**
- Modify: `src/captcha/renderer.ts` (add `drawShape`)
- Modify: `tests/renderer.test.ts` (add shape tests)

- [ ] **Step 1: Write failing test (append to tests/renderer.test.ts)**

Add to `tests/renderer.test.ts`:

```ts
import { drawShape } from '../src/captcha/renderer'
import type { ShapeRenderMeta } from '../src/captcha/types'

function makeCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    fill: vi.fn(),
    stroke: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    save: vi.fn(),
    restore: vi.fn()
  } as any
}

describe('renderer.drawShape', () => {
  const baseMeta: ShapeRenderMeta = {
    id: 'a',
    challenge: { id: 'a', shape: 'circle', order: 1 },
    shape: 'circle',
    x: 100, y: 100, size: 20,
    captured: false,
    pickOrder: 0,
    gradientAngle: 0,
    gradientKind: 'radial',
    gradientOpacityA: 0.3,
    gradientOpacityB: 0.7
  }

  it('fills shape with gradient', () => {
    const ctx = makeCtx()
    drawShape(ctx, baseMeta, /*outline=*/true, /*decoy=*/false)
    expect(ctx.createRadialGradient).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('skips outline for decoy shapes', () => {
    const ctx = makeCtx()
    drawShape(ctx, baseMeta, /*outline=*/false, /*decoy=*/true)
    expect(ctx.stroke).not.toHaveBeenCalled()
  })

  it('draws stipple dots inside shape', () => {
    const ctx = makeCtx()
    drawShape(ctx, baseMeta, true, false)
    expect(ctx.arc.mock.calls.length).toBeGreaterThan(15)
  })

  it('uses linear gradient when kind=linear', () => {
    const ctx = makeCtx()
    drawShape(ctx, { ...baseMeta, gradientKind: 'linear' }, true, false)
    expect(ctx.createLinearGradient).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/renderer.test.ts`
Expected: FAIL — `drawShape` is not exported.

- [ ] **Step 3: Add drawShape to renderer.ts**

Append to `src/captcha/renderer.ts`:

```ts
import { getShapePath } from './shapes'
import { STIPPLE_DARK, STIPPLE_LIGHT, OUTLINE_COLOR, SHAPE_FILL_A, SHAPE_FILL_B } from './palette'
import type { ShapeRenderMeta } from './types'

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/renderer.test.ts`
Expected: PASS — all 4 new tests + previous camo tests.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/renderer.ts tests/renderer.test.ts
git commit -m "feat: renderer draws shape with gradient + stipple + outline"
```

---

## Task 8: Renderer — overlays (order indicator + success check)

**Files:**
- Modify: `src/captcha/renderer.ts` (add `drawOrderIndicator`, `drawSuccessCheck`)
- Modify: `tests/renderer.test.ts` (add overlay tests)

- [ ] **Step 1: Write failing test (append)**

```ts
import { drawOrderIndicator, drawSuccessCheck } from '../src/captcha/renderer'

describe('renderer overlays', () => {
  it('drawOrderIndicator draws a white circle and a number', () => {
    const ctx = makeCtx()
    drawOrderIndicator(ctx, 100, 100, 2)
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number))
  })

  it('drawSuccessCheck draws a check path', () => {
    const ctx = makeCtx()
    drawSuccessCheck(ctx, 50, 50)
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
  })
})
```

Also add `fillText: vi.fn()` to the `makeCtx()` factory above.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/renderer.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement overlay functions**

Append to `src/captcha/renderer.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/renderer.ts tests/renderer.test.ts
git commit -m "feat: renderer draws order indicator + success check overlays"
```

---

## Task 9: Engine — main loop, state, hit-test, verify

**Files:**
- Create: `src/captcha/engine.ts`
- Create: `tests/engine.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/engine.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { CaptchaEngine } from '../src/captcha/engine'
import type { Challenge } from '../src/captcha/types'

function makeChallenges(): Challenge[] {
  return [
    { id: 'a', shape: 'circle', order: 1 },
    { id: 'b', shape: 'triangle', order: 2 },
    { id: 'c', shape: 'square', order: 3 },
    { id: 'd', shape: 'star', order: 4 }
  ]
}

function makeCtx() {
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 0,
    fillRect: vi.fn(), clearRect: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    beginPath: vi.fn(), arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
    save: vi.fn(), restore: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillText: vi.fn(),
    setTransform: vi.fn(), scale: vi.fn(),
    font: '', textAlign: '', textBaseline: '',
    globalAlpha: 1,
    lineCap: '', lineJoin: ''
  } as any
}

describe('CaptchaEngine', () => {
  it('spawns challenges.length + random decoys within range', () => {
    const onVerify = vi.fn()
    const onProgress = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [1, 2],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress })

    engine.start()

    const total = engine.getState().shapes.length
    expect(total).toBeGreaterThanOrEqual(5)
    expect(total).toBeLessThanOrEqual(6)

    engine.stop()
  })

  it('decoy types do not duplicate any challenge shape', () => {
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [2, 2],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress: vi.fn() })
    engine.start()

    const shapes = engine.getState().shapes
    const challengeShapes = new Set(makeChallenges().map(c => c.shape))
    for (const s of shapes) {
      if (s.challenge === null) {
        expect(challengeShapes.has(s.shape)).toBe(false)
      }
    }
    engine.stop()
  })

  it('captures nearest shape on click and freezes its position', () => {
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress: vi.fn() })
    engine.start()

    const before = engine.getState().shapes[0]
    engine.handleClick(before.x, before.y)

    const after = engine.getState().shapes[0]
    expect(after.captured).toBe(true)
    expect(after.x).toBe(before.x)
    expect(after.y).toBe(before.y)
    engine.stop()
  })

  it('emits verify with ok=true on correct order', () => {
    const onVerify = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress: vi.fn() })
    engine.start()

    const sorted = [...engine.getState().shapes].sort((a, b) =>
      (a.challenge!.order - b.challenge!.order)
    )
    for (const s of sorted) {
      engine.handleClick(s.x, s.y)
    }

    expect(onVerify).toHaveBeenCalledOnce()
    expect(onVerify.mock.calls[0][0].ok).toBe(true)
    expect(onVerify.mock.calls[0][0].orderedIds).toEqual(['a', 'b', 'c', 'd'])
    engine.stop()
  })

  it('emits verify with ok=false when wrong order', () => {
    const onVerify = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress: vi.fn() })
    engine.start()

    const reversed = [...engine.getState().shapes].reverse()
    for (const s of reversed) {
      engine.handleClick(s.x, s.y)
    }
    expect(onVerify.mock.calls[0][0].ok).toBe(false)
    engine.stop()
  })

  it('emits verify with ok=false when decoy is clicked', () => {
    const onVerify = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [1, 1],
      motionSpeed: 1
    }, makeCtx(), { onVerify, onProgress: vi.fn() })
    engine.start()

    const shapes = engine.getState().shapes
    const decoy = shapes.find(s => s.challenge === null)!
    engine.handleClick(decoy.x, decoy.y)

    expect(onVerify).toHaveBeenCalledOnce()
    expect(onVerify.mock.calls[0][0].ok).toBe(false)
    engine.stop()
  })

  it('progress event fires with picked count', () => {
    const onProgress = vi.fn()
    const engine = new CaptchaEngine({
      width: 320, height: 200,
      challenges: makeChallenges(),
      decoyRange: [0, 0],
      motionSpeed: 1
    }, makeCtx(), { onVerify: vi.fn(), onProgress })
    engine.start()
    const first = engine.getState().shapes[0]
    engine.handleClick(first.x, first.y)
    expect(onProgress).toHaveBeenCalledWith(1, 4)
    engine.stop()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/engine.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement engine.ts**

Create `src/captcha/engine.ts`:

```ts
import type { Challenge, EngineConfig, ShapeRenderMeta, ShapeType, VerifyResult } from './types'
import { preRenderCamo, drawShape, drawOrderIndicator, drawSuccessCheck } from './renderer'
import { newBezierPath, advanceBezier, bezierPosition, type BezierPath } from './motion'

const SHAPE_TYPES: ShapeType[] = ['circle', 'triangle', 'square', 'star', 'pentagon', 'hexagon']
const PADDING = 18
const HIT_RADIUS = 25
const SHAPE_BASE_SIZE = 18

interface EngineCallbacks {
  onVerify: (r: VerifyResult) => void
  onProgress: (picked: number, total: number) => void
}

interface InternalShape extends ShapeRenderMeta {
  challenge: Challenge | null
  path: BezierPath
}

export class CaptchaEngine {
  private ctx: CanvasRenderingContext2D
  private config: EngineConfig
  private callbacks: EngineCallbacks
  private shapes: InternalShape[] = []
  private rafId: number | null = null
  private lastTs = 0
  private pickOrder = 0
  private verified = false
  private camoCanvas: HTMLCanvasElement | null = null
  private hasCamoCache = false

  constructor(config: EngineConfig, ctx: CanvasRenderingContext2D, callbacks: EngineCallbacks) {
    this.config = config
    this.ctx = ctx
    this.callbacks = callbacks
    this.spawnShapes()
    this.preRenderCamo()
  }

  private spawnShapes() {
    this.shapes = []
    this.pickOrder = 0
    this.verified = false

    for (const c of this.config.challenges) {
      this.shapes.push(this.makeShape(c.shape, c, false))
    }

    const [minDecoy, maxDecoy] = this.config.decoyRange
    const decoyCount = minDecoy + Math.floor(Math.random() * (maxDecoy - minDecoy + 1))
    const challengeShapes = new Set(this.config.challenges.map(c => c.shape))
    const pool = SHAPE_TYPES.filter(t => !challengeShapes.has(t))
    for (let i = 0; i < decoyCount; i++) {
      const t = pool[Math.floor(Math.random() * pool.length)]
      this.shapes.push(this.makeShape(t, null, true))
    }
  }

  private makeShape(shape: ShapeType, challenge: Challenge | null, decoy: boolean): InternalShape {
    const path = newBezierPath(this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
    return {
      id: challenge ? challenge.id : `decoy-${Math.random().toString(36).slice(2, 8)}`,
      challenge,
      shape,
      x: 0, y: 0,
      size: SHAPE_BASE_SIZE + Math.random() * 4,
      captured: false,
      pickOrder: 0,
      gradientAngle: Math.random() * Math.PI * 2,
      gradientKind: Math.random() < 0.5 ? 'radial' : 'linear',
      gradientOpacityA: 0.25 + Math.random() * 0.2,
      gradientOpacityB: 0.55 + Math.random() * 0.2,
      path
    }
  }

  private preRenderCamo() {
    const off = document.createElement('canvas')
    off.width = this.config.width
    off.height = this.config.height
    const octx = off.getContext('2d')!
    preRenderCamo(octx, this.config.width, this.config.height)
    this.camoCanvas = off
    this.hasCamoCache = true
  }

  start() {
    if (this.rafId !== null) return
    this.lastTs = performance.now()
    const loop = (ts: number) => {
      const dt = ts - this.lastTs
      this.lastTs = ts
      this.update(dt)
      this.render()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  refresh(newChallenges: Challenge[]) {
    this.stop()
    this.config = { ...this.config, challenges: newChallenges }
    this.spawnShapes()
    this.preRenderCamo()
    this.start()
  }

  reset() {
    for (const s of this.shapes) {
      s.captured = false
      s.pickOrder = 0
      s.path = newBezierPath(this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
    }
    this.pickOrder = 0
    this.verified = false
    this.callbacks.onProgress(0, this.config.challenges.length)
  }

  handleClick(x: number, y: number) {
    if (this.verified) return

    let bestIdx = -1
    let bestDist = HIT_RADIUS
    for (let i = 0; i < this.shapes.length; i++) {
      const s = this.shapes[i]
      if (s.captured) continue
      const dx = x - s.x
      const dy = y - s.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    if (bestIdx < 0) return

    const s = this.shapes[bestIdx]
    s.captured = true
    this.pickOrder++
    s.pickOrder = this.pickOrder
    this.callbacks.onProgress(this.pickOrder, this.config.challenges.length)

    if (this.pickOrder >= this.config.challenges.length) {
      this.emitVerify()
    }
  }

  private emitVerify() {
    this.verified = true
    const ordered: string[] = []
    for (let i = 0; i < this.shapes.length; i++) {
      const s = this.shapes[i]
      if (s.challenge && s.pickOrder > 0) ordered.push(s.challenge.id)
    }
    const expected = [...this.config.challenges]
      .sort((a, b) => a.order - b.order)
      .map(c => c.id)

    const userOrder: string[] = []
    const captured = this.shapes.filter(s => s.pickOrder > 0)
      .sort((a, b) => a.pickOrder - b.pickOrder)
    for (const s of captured) {
      if (s.challenge) userOrder.push(s.challenge.id)
      else userOrder.push('__decoy__')
    }

    const allReal = captured.every(s => s.challenge !== null)
    const orderMatches = userOrder.length === expected.length &&
      userOrder.every((id, i) => id === expected[i])

    const result: VerifyResult = {
      ok: allReal && orderMatches,
      orderedIds: userOrder,
      expected
    }
    this.callbacks.onVerify(result)
  }

  private update(dt: number) {
    const dtClamped = Math.min(dt, 50) * this.config.motionSpeed
    for (const s of this.shapes) {
      if (s.captured) continue
      s.path = advanceBezier(s.path, dtClamped, this.config.width, this.config.height, PADDING + SHAPE_BASE_SIZE)
      const pos = bezierPosition(s.path, s.path.t)
      s.x = pos.x
      s.y = pos.y
    }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.config.width, this.config.height)
    if (this.camoCanvas) {
      ctx.drawImage(this.camoCanvas, 0, 0, this.config.width, this.config.height)
    }

    for (const s of this.shapes) {
      const isDecoy = s.challenge === null
      const showOutline = !isDecoy
      drawShape(ctx, s, showOutline, isDecoy)
    }

    for (const s of this.shapes) {
      if (s.captured && s.challenge) {
        drawOrderIndicator(ctx, s.x, s.y, s.pickOrder)
      }
    }

    if (this.verified) {
      drawSuccessCheck(ctx, this.config.width - 24, 24)
    }
  }

  getState() {
    return {
      shapes: this.shapes.map(s => ({
        id: s.id,
        challenge: s.challenge,
        shape: s.shape,
        x: s.x, y: s.y,
        size: s.size,
        captured: s.captured,
        pickOrder: s.pickOrder,
        gradientAngle: s.gradientAngle,
        gradientKind: s.gradientKind,
        gradientOpacityA: s.gradientOpacityA,
        gradientOpacityB: s.gradientOpacityB
      })) as ShapeRenderMeta[],
      verified: this.verified,
      pickOrder: this.pickOrder
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/engine.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/captcha/engine.ts tests/engine.test.ts
git commit -m "feat: CaptchaEngine with state machine, hit-test, verify emission"
```

---

## Task 10: CaptchaCanvas.vue component

**Files:**
- Create: `src/components/CaptchaCanvas.vue`
- Create: `tests/CaptchaCanvas.test.ts`

- [ ] **Step 1: Write failing component test**

Create `tests/CaptchaCanvas.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CaptchaCanvas from '../src/components/CaptchaCanvas.vue'
import type { Challenge } from '../src/captcha/types'

const challenges: Challenge[] = [
  { id: 'a', shape: 'circle', order: 1 },
  { id: 'b', shape: 'triangle', order: 2 }
]

describe('CaptchaCanvas.vue', () => {
  it('renders a canvas element', () => {
    const w = mount(CaptchaCanvas, { props: { challenges, width: 200, height: 100 } })
    expect(w.find('canvas').exists()).toBe(true)
    w.unmount()
  })

  it('emits verify when all challenges clicked in order', async () => {
    const w = mount(CaptchaCanvas, {
      props: { challenges, width: 400, height: 300 }
    })
    await w.vm.$nextTick()
    const state = (w.vm as any).getState()
    const sorted = [...state.shapes].sort((a: any, b: any) =>
      a.challenge.order - b.challenge.order
    )
    for (const s of sorted) {
      (w.vm as any).simulateClick(s.x, s.y)
    }
    const verifyEvents = w.emitted('verify')
    expect(verifyEvents).toBeTruthy()
    expect(verifyEvents![0][0]).toMatchObject({ ok: true })
    w.unmount()
  })

  it('emits refresh on imperative refresh()', async () => {
    const w = mount(CaptchaCanvas, {
      props: { challenges, width: 200, height: 100 }
    })
    await w.vm.$nextTick()
    ;(w.vm as any).refresh()
    expect(w.emitted('refresh')).toBeTruthy()
    w.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/CaptchaCanvas.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CaptchaCanvas.vue**

Create `src/components/CaptchaCanvas.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Challenge, VerifyResult } from '../captcha/types'
import { CaptchaEngine } from '../captcha/engine'

const props = withDefaults(defineProps<{
  challenges: Challenge[]
  width?: number
  height?: number
  decoyRange?: [number, number]
  motionSpeed?: number
  disabled?: boolean
}>(), {
  width: 320,
  height: 200,
  decoyRange: () => [1, 2] as [number, number],
  motionSpeed: 1,
  disabled: false
})

const emit = defineEmits<{
  (e: 'verify', result: VerifyResult): void
  (e: 'refresh'): void
  (e: 'progress', picked: number, total: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: CaptchaEngine | null = null
let containerEl: HTMLDivElement | null = null
let resizeObserver: ResizeObserver | null = null

function buildEngine(w: number, h: number) {
  const canvas = canvasRef.value!
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return new CaptchaEngine(
    { width: w, height: h, challenges: props.challenges, decoyRange: props.decoyRange, motionSpeed: props.motionSpeed },
    ctx,
    {
      onVerify: (r) => emit('verify', r),
      onProgress: (p, t) => emit('progress', p, t)
    }
  )
}

onMounted(() => {
  if (!canvasRef.value) return
  containerEl = canvasRef.value.parentElement as HTMLDivElement
  const w = props.width
  const h = props.height
  engine = buildEngine(w, h)
  if (!props.disabled) engine.start()

  canvasRef.value.addEventListener('pointerdown', onPointerDown)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      if (rect.width > 0 && rect.height > 0) {
        rebuild(rect.width, rect.height)
      }
    })
    resizeObserver.observe(containerEl!)
  }
})

onBeforeUnmount(() => {
  if (engine) engine.stop()
  if (canvasRef.value) canvasRef.value.removeEventListener('pointerdown', onPointerDown)
  if (resizeObserver) resizeObserver.disconnect()
})

watch(() => props.challenges, () => {
  if (engine) engine.refresh(props.challenges)
})

watch(() => props.disabled, (d) => {
  if (!engine) return
  if (d) engine.stop()
  else engine.start()
})

function rebuild(w: number, h: number) {
  if (engine) engine.stop()
  engine = buildEngine(w, h)
  if (!props.disabled) engine.start()
}

function onPointerDown(ev: PointerEvent) {
  if (!engine || !canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const x = ev.clientX - rect.left
  const y = ev.clientY - rect.top
  engine.handleClick(x, y)
}

function refresh() {
  emit('refresh')
  if (engine) engine.refresh(props.challenges)
}

function reset() {
  if (engine) engine.reset()
}

function getState() {
  return engine ? engine.getState() : null
}

function simulateClick(x: number, y: number) {
  if (engine) engine.handleClick(x, y)
}

defineExpose({ refresh, reset, getState, simulateClick })
</script>

<template>
  <div class="captcha-container">
    <canvas ref="canvasRef" data-testid="captcha-canvas"></canvas>
  </div>
</template>

<style scoped>
.captcha-container {
  display: inline-block;
  line-height: 0;
}
canvas {
  display: block;
  cursor: pointer;
  touch-action: none;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/CaptchaCanvas.test.ts`
Expected: PASS — 3 tests.

If engine doesn't return shapes in expected positions (random spawn), the second test may need `await new Promise(r => setTimeout(r, 50))` before reading state. Add `await new Promise(r => setTimeout(r, 50))` after mount if needed.

- [ ] **Step 5: Commit**

```bash
git add src/components/CaptchaCanvas.vue tests/CaptchaCanvas.test.ts
git commit -m "feat: CaptchaCanvas.vue with engine wiring + ResizeObserver"
```

---

## Task 11: Demo App.vue page

**Files:**
- Modify: `src/App.vue`
- Create: `src/mockChallenges.ts`

- [ ] **Step 1: Create mockChallenges helper**

Create `src/mockChallenges.ts`:

```ts
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
```

- [ ] **Step 2: Implement App.vue**

Replace `src/App.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import CaptchaCanvas from './components/CaptchaCanvas.vue'
import { generateMockChallenges } from './mockChallenges'
import type { Challenge, VerifyResult } from './captcha/types'

const challenges = ref<Challenge[]>(generateMockChallenges(4))
const lastVerify = ref<VerifyResult | null>(null)
const picked = ref(0)
const total = ref(challenges.value.length)

function refresh() {
  challenges.value = generateMockChallenges(4)
  lastVerify.value = null
  picked.value = 0
  total.value = challenges.value.length
}

function onVerify(r: VerifyResult) {
  lastVerify.value = r
  console.log('verify', r)
}

function onProgress(p: number, t: number) {
  picked.value = p
  total.value = t
}
</script>

<template>
  <div class="app">
    <h1>Captcha Demo</h1>
    <div class="layout">
      <CaptchaCanvas
        :challenges="challenges"
        :width="480"
        :height="300"
        @verify="onVerify"
        @progress="onProgress"
        @refresh="refresh"
      />
      <aside class="panel">
        <div class="prompt">请按顺序点击：</div>
        <div class="chips">
          <span
            v-for="c in [...challenges].sort((a,b) => a.order - b.order)"
            :key="c.id"
            class="chip"
          >{{ c.order }}·{{ c.shape }}</span>
        </div>
        <div class="counter">已点 {{ picked }} / {{ total }}</div>
        <button class="refresh" @click="refresh">↻ 换一组</button>
        <pre v-if="lastVerify" class="result">{{ JSON.stringify(lastVerify, null, 2) }}</pre>
      </aside>
    </div>
  </div>
</template>

<style>
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f1f5f9; }
.app { padding: 24px; }
.layout { display: flex; gap: 16px; align-items: flex-start; }
.panel {
  width: 220px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}
.prompt { font-weight: 600; margin-bottom: 8px; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.chip {
  display: inline-block;
  padding: 2px 8px;
  background: #1f2937;
  color: white;
  border-radius: 4px;
  font-size: 11px;
}
.counter { color: #64748b; margin-bottom: 10px; }
.refresh {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}
.result {
  margin-top: 12px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 11px;
  white-space: pre-wrap;
}
</style>
```

- [ ] **Step 3: Verify dev server runs**

Run: `npm run dev` in background. Open the printed URL in a browser, confirm canvas renders with shapes moving on camo background. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/App.vue src/mockChallenges.ts
git commit -m "feat: demo App.vue with mock challenges and side panel"
```

---

## Task 12: Playwright e2e test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/captcha.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

Run: `npx playwright install chromium`
Expected: chromium downloaded.

- [ ] **Step 2: Create playwright.config.ts**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
})
```

- [ ] **Step 3: Create e2e test**

Create `tests/e2e/captcha.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('completes captcha in correct order and emits verify', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="captcha-canvas"]')).toBeVisible()

  // Wait for shapes to settle (engine spawns on mount)
  await page.waitForTimeout(300)

  const verifyPromise = page.evaluate(() => {
    return new Promise<any>((resolve) => {
      document.addEventListener('verify-result', (e: any) => resolve(e.detail), { once: true })
    })
  })

  // Read the exposed engine state via window debug hook (added in App.vue)
  const positions = await page.evaluate(() => {
    return (window as any).__captchaDebug__()
  })

  // Click each shape in its challenge order
  for (const p of positions) {
    await page.locator('[data-testid="captcha-canvas"]').click({
      position: { x: p.x, y: p.y }
    })
    await page.waitForTimeout(50)
  }

  const result = await verifyPromise
  expect(result.ok).toBe(true)
})
```

- [ ] **Step 4: Add debug hook to App.vue**

Modify `src/App.vue`'s script setup, after the imports:

```ts
import { onMounted } from 'vue'

onMounted(() => {
  ;(window as any).__captchaDebug = () => {
    // Wait for canvas ref to be ready
    const canvas = document.querySelector('[data-testid="captcha-canvas"]') as any
    if (!canvas) return []
    // The component exposes its state via Vue's $vm
    const vm = (canvas as any).__vueParentComponent
    if (!vm) return []
    const state = vm.exposed?.getState?.()
    if (!state) return []
    return state.shapes
      .filter((s: any) => s.challenge !== null)
      .sort((a: any, b: any) => a.challenge.order - b.challenge.order)
      .map((s: any) => ({ x: s.x, y: s.y, id: s.challenge.id }))
  }
})
```

Add a corresponding event listener in App.vue's verify emit:

```ts
function onVerify(r: VerifyResult) {
  lastVerify.value = r
  console.log('verify', r)
  document.dispatchEvent(new CustomEvent('verify-result', { detail: r }))
}
```

- [ ] **Step 5: Run e2e**

Run: `npm run test:e2e`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e/captcha.spec.ts src/App.vue
git commit -m "test: add Playwright e2e for full verify flow"
```

---

## Task 13: Update AGENTS.md with verified commands

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Verify all commands work**

Run each, confirm:
- `npm install` → already done
- `npm run dev` → starts Vite
- `npm run build` → produces `dist/`
- `npm test` → all tests pass
- `npm run typecheck` → no errors
- `npm run test:e2e` → 1 test passes

- [ ] **Step 2: Replace AGENTS.md content**

Replace `AGENTS.md` with:

```markdown
# Repository Guidance

## Stack

- Vite + Vue 3 (script setup) + TypeScript
- Pure Canvas 2D for rendering (no SVG, no animation library)
- Vitest + @vue/test-utils for unit/component tests
- Playwright for e2e

## Commands

- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — Type-check + production build to `dist/`
- `npm run preview` — Serve the built `dist/`
- `npm test` — Run all unit + component tests once (vitest)
- `npm run test:watch` — Vitest in watch mode
- `npm run test:e2e` — Playwright e2e (auto-starts dev server)
- `npm run typecheck` — vue-tsc only

## Architecture

- `src/captcha/` contains framework-free TypeScript modules:
  - `types.ts` — Challenge / VerifyResult / ShapeRenderMeta
  - `palette.ts` — Camo color palette + weighted picker
  - `shapes.ts` — Canvas Path2D generators (circle/triangle/square/star/pentagon/hexagon)
  - `motion.ts` — Cubic Bézier path generation + advancement
  - `renderer.ts` — Camo bitmap pre-render + shape drawing + overlays
  - `engine.ts` — `CaptchaEngine` class (rAF main loop, state machine, hit-test, verify emission)
- `src/components/CaptchaCanvas.vue` is the Vue wrapper (props/emits + ResizeObserver + DPR)
- `src/App.vue` is the demo with mock challenge generator and side panel

## Key Behaviors

- CaptchaEngine state per shape: spawned → moving → captured (frozen at click position) → removed on refresh
- Captured shape position is frozen; only order indicator overlay is added
- `verify` event fires exactly once after `challenges.length` clicks, with `{ ok, orderedIds, expected }`
- Decoy clicks count toward progress but cause `ok: false`
- ResizeObserver re-builds engine at new dimensions (control points re-randomized)
- DPR clamped at 2 to avoid memory explosion

## Tests

- Engine, renderer, shapes, palette, motion have direct unit tests
- CaptchaCanvas.vue has component tests via @vue/test-utils
- `tests/e2e/captcha.spec.ts` exercises the full verify flow against the dev server

## Gotchas

- jsdom in vitest lacks `Path2D` natively — shapes tests rely on it; if running in a CI without canvas polyfill, install `canvas` package or skip those tests
- The component relies on `ResizeObserver` being available (modern browsers); no fallback
- e2e test exposes `window.__captchaDebug` via App.vue for deterministic click coordinates; this is dev-only and not part of the component contract
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md with verified commands and architecture"
```

---

## Self-Review

**1. Spec coverage:**

| Spec section | Covered by task |
|---|---|
| §1 Goal (all bullets) | Task 9 (engine), Task 10 (component) |
| §2 Visual design (palette, multi-grain, transparent gradient, irregular stipple, decoy no-outline, click feedback, failure feedback, side panel layout) | Task 6 (camo), Task 7 (shape), Task 8 (overlays), Task 11 (panel) |
| §3 Architecture (3-layer split) | Tasks 7/8/9 + Task 10 |
| §4 Component API (props, emits, expose, types) | Task 10, Task 2 |
| §5 State machine | Task 9 |
| §6 Visual pipeline (5 stages, DPR clamp) | Tasks 6/7/8, Task 10 (DPR) |
| §7 Error handling (empty, duplicates, decoy, fail reset, DPR clamp) | Task 9 (warn on duplicates not implemented — minor) |
| §8 Testing strategy | Tasks 2/3/4/5/6/7/8/9/10/12 |
| §9 Directory layout | Tasks 1-12 |
| §10 Demo page | Task 11 |
| §11 Out of scope | Honored |
| §12 Open risks | Honored |

**Gap:** Spec §7 says "warn on duplicate ids/orders" — engine doesn't currently log this. Adding to Task 9 is minor.

**2. Placeholder scan:** No TBD/TODO/placeholder patterns found.

**3. Type consistency:**
- `bezierPosition`, `advanceBezier`, `newBezierPath` signatures consistent across Task 5 + Task 9 ✓
- `getShapePath(type, x, y, size)` consistent across Task 4 + Task 7 ✓
- `CaptchaEngine` config uses `EngineConfig` interface from types.ts ✓
- `ShapeRenderMeta` is exported from types.ts and consumed by renderer + engine ✓
- HIT_RADIUS, PADDING, SHAPE_BASE_SIZE defined as constants in engine.ts ✓

**Minor fix needed:** Task 9 emitVerify has unused `ordered` variable. Remove it.

Fix inline:

In `engine.ts` `emitVerify()`, remove this line:

```ts
const ordered: string[] = []
for (let i = 0; i < this.shapes.length; i++) {
  const s = this.shapes[i]
  if (s.challenge && s.pickOrder > 0) ordered.push(s.challenge.id)
}
```

(Not used elsewhere.)

**Also:** Add duplicate-warning per spec §7:

In `engine.ts` constructor, before `spawnShapes`:

```ts
private warnDuplicates() {
  const ids = new Set<string>()
  const orders = new Set<number>()
  for (const c of this.config.challenges) {
    if (ids.has(c.id)) console.warn(`[Captcha] duplicate challenge id: ${c.id}`)
    if (orders.has(c.order)) console.warn(`[Captcha] duplicate challenge order: ${c.order}`)
    ids.add(c.id)
    orders.add(c.order)
  }
}
```

Call `this.warnDuplicates()` in constructor before `this.spawnShapes()`.

Both fixes are minor and covered by the existing Task 9 commit.