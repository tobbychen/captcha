import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import CaptchaCanvas from '../src/components/CaptchaCanvas.vue'
import type { Challenge } from '../src/captcha/types'

const challenges: Challenge[] = [
  { id: 'a', shape: 'circle', order: 1 },
  { id: 'b', shape: 'triangle', order: 2 }
]

describe('CaptchaCanvas.vue', () => {
  it('renders a canvas element', async () => {
    const w = mount(CaptchaCanvas, { props: { challenges, width: 200, height: 100 } })
    await nextTick()
    expect(w.find('canvas').exists()).toBe(true)
    w.unmount()
  })

  it('exposes imperative API', async () => {
    const w = mount(CaptchaCanvas, { props: { challenges, width: 200, height: 100 } })
    await nextTick()
    const vm = w.vm as any
    expect(typeof vm.refresh).toBe('function')
    expect(typeof vm.reset).toBe('function')
    expect(typeof vm.getState).toBe('function')
    expect(typeof vm.simulateClick).toBe('function')
    w.unmount()
  })

  it('emits progress and verify after N simulated clicks in order', async () => {
    const w = mount(CaptchaCanvas, { props: { challenges, width: 400, height: 300, decoyRange: [0, 0] } })
    await flushPromises()

    const vm = w.vm as any
    const state = vm.getState()
    expect(state).toBeTruthy()
    const sorted = [...state.shapes].sort((a: any, b: any) =>
      a.challenge.order - b.challenge.order
    )
    for (const s of sorted) {
      vm.simulateClick(s.x, s.y)
    }
    await nextTick()

    const verifyEvents = w.emitted('verify') as any[][]
    expect(verifyEvents).toBeTruthy()
    expect(verifyEvents![0][0].ok).toBe(true)
    w.unmount()
  })

  it('emits refresh when refresh() is called', async () => {
    const w = mount(CaptchaCanvas, { props: { challenges, width: 200, height: 100 } })
    await flushPromises()
    const vm = w.vm as any
    vm.refresh()
    expect(w.emitted('refresh')).toBeTruthy()
    w.unmount()
  })
})