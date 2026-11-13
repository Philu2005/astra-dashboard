import { expect, test } from '@playwright/test'

type ViewportPreset = {
  name: string
  width: number
  height: number
}

const viewports: ViewportPreset[] = [
  { name: 'desktop-1536x864', width: 1536, height: 864 },
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'desktop-1366x768', width: 1366, height: 768 },
  { name: 'tablet-1024x768', width: 1024, height: 768 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
]

for (const viewport of viewports) {
  test(`screenshot dashboard ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })

    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    await expect(page.locator('#root')).toBeVisible()

    await page.screenshot({
      path: `tests/visual/screenshots/dashboard-${viewport.width}x${viewport.height}.png`,
      fullPage: false,
      animations: 'disabled',
    })
  })
}