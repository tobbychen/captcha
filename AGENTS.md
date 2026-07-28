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
- `npm run test:e2e` — Playwright e2e (auto-starts dev server on 5173)
- `npm run typecheck` — vue-tsc only

## Architecture

- `src/captcha/` contains framework-free TypeScript modules:
  - `types.ts` — Challenge / VerifyResult / ShapeRenderMeta / SHAPE_TYPES
  - `palette.ts` — Camo color palette + weighted picker + shape fill colors
  - `shapes.ts` — Canvas Path2D generators (circle/triangle/square/star/pentagon/hexagon)
  - `motion.ts` — Cubic Bézier path generation + advancement
  - `renderer.ts` — Camo bitmap pre-render + shape drawing + overlays
  - `engine.ts` — `CaptchaEngine` class (rAF main loop, state machine, hit-test, verify emission)
- `src/components/CaptchaCanvas.vue` — Vue wrapper (props/emits + ResizeObserver + DPR)
- `src/App.vue` — demo with mock challenge generator and side panel
- `src/mockChallenges.ts` — random challenge set generator for demo

## Key Behaviors

- CaptchaEngine state per shape: spawned → moving → captured (frozen at click position) → re-armed on reset/refresh
- Captured shape position is frozen; only order indicator overlay is added
- `verify` event fires exactly once after `challenges.length` clicks, with `{ ok, orderedIds, expected }`
- Decoy clicks count toward progress but cause `ok: false`
- ResizeObserver re-builds engine at new dimensions (control points re-randomized)
- DPR clamped at 2 to avoid memory explosion
- Duplicate challenge ids or orders trigger `console.warn` (engine still works, just noise)

## Tests

- 32 unit + component tests across 7 files
- Engine, renderer, shapes, palette, motion have direct unit tests
- CaptchaCanvas.vue has component tests via @vue/test-utils
- `tests/e2e/captcha.spec.ts` exercises the full verify flow against the dev server
- Test setup (`tests/setup.ts`) polyfills `Path2D` and mocks `HTMLCanvasElement.getContext('2d')` for jsdom

## Gotchas

- jsdom lacks `Path2D` and `HTMLCanvasElement.getContext('2d')` natively — handled by `tests/setup.ts`. Do not remove it.
- The component relies on `ResizeObserver` being available (modern browsers); no fallback
- E2E test uses `window.__captchaSolve` exposed via App.vue for deterministic click coordinates (browser rAF moves shapes between state read and click); the debug hook is dev-only and not part of the component contract
- The build (`npm run build`) runs `vue-tsc -b` which will surface type errors anywhere including `playwright.config.ts`; do not reference Node-only globals (`process`, etc.) without `@types/node`
- PowerShell does not support `&&` for command chaining. Use sequential `; if ($?) { ... }` or write a `.ps1` script and invoke with `powershell -ExecutionPolicy Bypass -File`
- Vite dev server may print "Port 5173 is in use" if a previous run was killed mid-startup — kill stale `node` processes that have `vite` in their command line before retrying
