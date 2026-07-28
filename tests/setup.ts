import { vi } from 'vitest'

if (typeof globalThis.Path2D === 'undefined') {
  class Path2DPolyfill {
    private ops: Array<{ type: string; args: any[] }> = []
    moveTo(x: number, y: number) { this.ops.push({ type: 'moveTo', args: [x, y] }) }
    lineTo(x: number, y: number) { this.ops.push({ type: 'lineTo', args: [x, y] }) }
    arc(x: number, y: number, r: number, a: number, b: number) { this.ops.push({ type: 'arc', args: [x, y, r, a, b] }) }
    closePath() { this.ops.push({ type: 'closePath', args: [] }) }
    get ops$() { return this.ops }
  }
  ;(globalThis as any).Path2D = Path2DPolyfill
}

function makeMockCtx(): any {
  const noop = () => {}
  const grad = { addColorStop: vi.fn() }
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 0, globalAlpha: 1,
    font: '', textAlign: '', textBaseline: '', lineCap: '', lineJoin: '',
    fillRect: vi.fn(noop), clearRect: vi.fn(noop), drawImage: vi.fn(noop),
    fill: vi.fn(noop), stroke: vi.fn(noop),
    beginPath: vi.fn(noop), arc: vi.fn(noop),
    moveTo: vi.fn(noop), lineTo: vi.fn(noop), closePath: vi.fn(noop),
    rect: vi.fn(noop), clip: vi.fn(noop),
    save: vi.fn(noop), restore: vi.fn(noop),
    createRadialGradient: vi.fn(() => grad),
    createLinearGradient: vi.fn(() => grad),
    fillText: vi.fn(noop),
    setTransform: vi.fn(noop), scale: vi.fn(noop),
    translate: vi.fn(noop), rotate: vi.fn(noop)
  }
}

if (typeof HTMLCanvasElement !== 'undefined') {
  const proto = HTMLCanvasElement.prototype as any
  const orig = proto.getContext
  proto.getContext = function (this: any, type: string) {
    if (type === '2d') return makeMockCtx()
    if (orig) return orig.call(this, type)
    return null
  }
}