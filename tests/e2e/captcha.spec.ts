import { test, expect } from '@playwright/test'

test('completes captcha in correct order and emits verify', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="captcha-canvas"]')).toBeVisible()

  await page.waitForFunction(() => typeof (window as any).__captchaSolve === 'function', undefined, { timeout: 5000 })

  const verifyPromise = page.evaluate(() => {
    return new Promise<any>((resolve) => {
      document.addEventListener('verify-result', (e: any) => resolve(e.detail), { once: true })
    })
  })

  const count = await page.evaluate(() => (window as any).__captchaSolve())
  expect(count).toBeGreaterThan(0)

  const result = await verifyPromise
  expect(result.ok).toBe(true)
})