# Captcha Canvas Component — Design

Date: 2026-07-27
Status: Approved (pending spec review)
Scope: Full Vite + Vue 3 + TypeScript project delivering a single reusable captcha component plus demo.

## 1. Goal

A Vue 3 captcha component that:

- Reads a backend-provided ordered list of shapes and renders them as canvas-drawn geometric figures.
- Renders them on a multi-grain digital-camouflage noise background so each shape must be visually distinguished from the noise.
- Animates each shape along a randomly-generated Bézier path (regenerated periodically for irregular motion).
- Adds 1–2 local "decoy" shapes whose type does not duplicate any backend shape.
- Lets the user click shapes in the order specified by the backend. Captured shapes freeze at their current position.
- After N clicks, emits a single `verify` event with whether the order and content match.

## 2. Visual Design (locked)

- **Background:** digital-camo noise field, pre-rendered once to an offscreen bitmap.
  - Palette: `#c8cbb6 / #8b9078 / #6a6e54 / #a6a98d / #5d6148 / #3d4030` (6 earth tones).
  - Multi-grain pixel rectangles, sizes 4–14 px, randomly positioned, no grid alignment.
  - Sparse color dots overlaid to break grid feel.
- **Real shapes:** clear dark outline (`#1f0a04`, 2 px solid) + transparent gradient inner fill + irregular stipple.
  - Gradient: per shape, randomly chosen between radial and linear with random angle; stop-opacity 0.25–0.7 (v4-B style, ~45% average).
  - Stipple: 18–30 dots per shape, random size 0.4–1.3 px and random positions; mostly dark, occasional light accent.
- **Decoy shapes:** same structure but without outline, lower overall opacity (≈ 0.5); visually merge with the noise.
- **Click feedback (v8-A):** on capture, a white circle with the sequential number appears above the shape's frozen position. After all N real shapes captured, a green check overlay fades in at top-right.
- **Failure feedback:** 1.5 s pause with red border + shake animation before reset.
- **Layout:** captcha canvas on the left, side panel on the right containing order chips, "0 / N" counter, and refresh button.

## 3. Architecture

```
CaptchaCanvas.vue (Vue SFC, props/emit/slots only)
  └─ CaptchaEngine (pure TS, rAF main loop, state machine, hit-test)
      └─ Renderer (pure TS, draws camo cache + shapes + overlays)
          └─ shapes.ts / motion.ts / palette.ts (utilities)
```

- Vue layer is a thin wrapper. The engine has zero Vue dependency and can be unit tested standalone.
- Renderer is similarly framework-free; tests use mocked 2D context.

## 4. Component API

### Props

| Name | Type | Default | Notes |
|---|---|---|---|
| `challenges` | `Challenge[]` | (required) | See type below. |
| `width` | `number?` | `320` | Logical px; overridden by container width when provided. |
| `height` | `number?` | `200` | Same override rule. |
| `decoyRange` | `[number, number]` | `[1, 2]` | Inclusive range; total rendered = challenges.length + random pick within range. |
| `motionSpeed` | `number` | `1` | Multiplier for Bézier `t` advancement. |
| `disabled` | `boolean` | `false` | Pauses rAF loop and disables click capture. |

### Emits

- `verify: (result: VerifyResult) => void` — fires once when the user has clicked exactly `challenges.length` times.
- `refresh: () => void` — fires when the user clicks the refresh button.
- `progress: (picked: number, total: number) => void` — fires on every captured click and on reset.

### Imperative (defineExpose)

- `refresh()` — regenerate challenges + decoys, re-randomize motion, reset state.
- `reset()` — keep challenges, release captured shapes back to `moving`.
- `getState()` — return `{ captured: CapturedShape[], challenges: Challenge[] }` for debugging.

### TypeScript types

```ts
export type ShapeType =
  | 'circle' | 'triangle' | 'square' | 'star'
  | 'pentagon' | 'hexagon';

export interface Challenge {
  id: string;
  shape: ShapeType;
  order: number;
}

export interface VerifyResult {
  ok: boolean;
  orderedIds: string[];  // user click order (by challenge.id)
  expected: string[];    // sorted by order
}

export interface CapturedShape {
  challenge: Challenge | null;  // null = decoy
  x: number;
  y: number;
  pickOrder: number;            // 1-based sequence
}
```

## 5. State Machine

Per shape:

```
spawned → moving ──hitTest(click)──▶ captured ──reset/refresh──▶ moving
                                  ▲
                                  └── verify → engine stops, shapes removed
```

Engine loop per frame (rAF, capped at DPR-scaled logical px):

1. `update(dt)` — for every `moving` shape, advance Bézier `t`; when segment completes (every 3–6 s), regenerate random control points bounded within canvas.
2. `render()` — clear → draw cached camo bitmap → draw all `moving` shapes → draw all `captured` shapes (position frozen) → draw order indicators → optionally draw success overlay.
3. `hitTest(x, y)` — only called from `pointerdown`. Finds nearest `moving` shape within 25 px of the click; first hit wins.

## 6. Visual Pipeline (Renderer)

Each frame, in order:

1. `clear()` — fill canvas with `#c8cbb6` (background base).
2. Draw `camoBitmap` (offscreen, pre-rendered).
3. For each `moving` shape: `drawShape({ outline: true, frozen: false, gradient, stipple })`.
4. For each `captured` shape: `drawShape({ outline: true, frozen: true, gradient, stipple })` then draw the order indicator overlay.
5. If `picked === N`: draw green check overlay with 200 ms fade-in.

### Camo bitmap generation (once)

- Size = canvas logical size.
- Algorithm: for each pixel block (random size 4–14 px), pick a color from palette using weighted random distribution; place at random position; layer sparse color dots on top.

### Shape drawing

- Outer outline: 2 px solid `#1f0a04`.
- Gradient: `createRadialGradient` or `createLinearGradient`, stops with `stop-opacity` 0.25–0.7.
- Stipple: 18–30 random-position circles, mostly `#1f0a04` opacity 0.85, with sparse `#fce4d2` opacity 0.4–0.5 accents.

### DPR

- `canvas.width = displayWidth * devicePixelRatio`, capped at 2.
- `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. All coordinate math uses CSS px.

## 7. Error Handling

- Empty `challenges` → render an inline error placeholder ("No challenges provided"), no engine start.
- Duplicate `id` or `order` in `challenges` → `console.warn`, ignore duplicates.
- Click on decoy → counted in `progress`, but `verify` returns `ok: false`.
- All N clicked but order wrong → `ok: false`, red border + shake for 1.5 s, then auto-reset (unless `disabled`).
- DPR > 2 → clamp to 2 to avoid memory explosion.
- Resize during `moving` → re-randomize control points inside new bounds.

## 8. Testing Strategy

- **Engine unit tests (vitest):** spawn count + decoy uniqueness, Bézier parameter regen, hit-test accuracy, state transitions, `verify` output correctness.
- **Renderer tests (vitest + mock 2D context):** assert draw call counts/params for each frame; do not assert pixel output.
- **Component tests (@vue/test-utils):** mount with mock engine, verify prop pass-through, emit timing, `defineExpose` API.
- **Playwright e2e (1 test):** load demo → click 4 shapes in correct order → assert `verify` payload. No visual assertions.
- **Not tested:** exact camo bitmap pixels, rAF frame rate.

## 9. Directory Layout

```
captcha/
├── AGENTS.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts
│   ├── App.vue                       # demo with side panel + mock challenges
│   ├── components/
│   │   └── CaptchaCanvas.vue
│   └── captcha/
│       ├── types.ts
│       ├── engine.ts
│       ├── renderer.ts
│       ├── shapes.ts
│       ├── motion.ts
│       └── palette.ts
└── tests/
    ├── engine.test.ts
    ├── renderer.test.ts
    ├── shapes.test.ts
    └── e2e/
        └── captcha.spec.ts
```

## 10. Demo Page (`App.vue`)

- Right side panel: order chips for current challenges, "0 / N" counter, refresh button.
- Mock challenge generator (local; no real backend) with a button to regenerate a new set so the dev can see different shape combinations and decoy layouts.
- Console-log the `verify` result for inspection.

## 11. Out of Scope

- Real backend integration (component takes challenges via props).
- Accessibility for visually impaired users (the camouflage defeats screen readers; this captcha is intentionally hostile to automation, including A11y tooling).
- Mobile-touch tuning beyond pointer events (works but not specifically tuned).
- Internationalization (Chinese-only prompt text in demo).

## 12. Open Risks

- Performance with very small canvases (≤ 200×150): stipple count may dominate render time. Mitigation: stipple count scales with shape area.
- Web font rendering of order numbers — uses `system-ui` to avoid extra asset load.
- Pointer event capture on canvas while shapes are moving under the cursor; relies on default click semantics (no preventDefault on underlying elements).