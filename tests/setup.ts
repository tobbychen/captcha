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