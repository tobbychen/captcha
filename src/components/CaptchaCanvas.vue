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
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    engine = null
    return null
  }
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
  if (engine && !props.disabled) engine.start()

  canvasRef.value.addEventListener('pointerdown', onPointerDown)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      if (rect.width > 0 && rect.height > 0) {
        rebuild(rect.width, rect.height)
      }
    })
    if (containerEl) resizeObserver.observe(containerEl)
  }

  ;(window as any).__getCamo = () => engine ? engine.debugCamoCanvas() : null
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
  if (engine && !props.disabled) engine.start()
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