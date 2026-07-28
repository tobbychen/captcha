<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  document.dispatchEvent(new CustomEvent('verify-result', { detail: r }))
}

function onProgress(p: number, t: number) {
  picked.value = p
  total.value = t
}

onMounted(() => {
  ;(window as any).__captchaDebug = () => {
    const canvas = document.querySelector('[data-testid="captcha-canvas"]') as any
    if (!canvas) return []
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