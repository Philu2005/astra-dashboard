import { expect, test } from '@playwright/test'

type ViewportPreset = {
  name: string
  width: number
  height: number
}

const viewports: ViewportPreset[] = [
  { name: 'desktop-1536x864', width: 1536, height: 864 },
  { name: 'tablet-1024x768', width: 1024, height: 768 },
  { name: 'mobile-390x844', width: 390, height: 844 },
]

for (const viewport of viewports) {
  test(`support overview unauthenticated ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/support', { waitUntil: 'domcontentloaded' })

    // Ohne Login sollte die StaticInfoPage erscheinen
    await expect(page.getByText('Nicht angemeldet')).toBeVisible()
    await expect(page.getByText('Bitte melde dich an, um den Support zu nutzen.')).toBeVisible()

    await page.screenshot({
      path: `tests/visual/screenshots/support-unauth-${viewport.width}x${viewport.height}.png`,
      fullPage: false,
      animations: 'disabled',
    })
  })
}
