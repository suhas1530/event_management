import { test, expect } from '@playwright/test'

/**
 * The redesign has to survive every common phone and desktop width without a
 * horizontal scrollbar. Each check reads the rendered document rather than a
 * screenshot, so a single overflowing card fails the run with its selector.
 */
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1366, 1920]

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/event-management', name: 'event management' },
  { path: '/events', name: 'event catalogue' },
  { path: '/home-services', name: 'home services' },
  { path: '/services', name: 'all services' },
  { path: '/event-design-assistant', name: 'AI design assistant' },
  { path: '/plan-event', name: 'event planning wizard' },
  { path: '/book/technician', name: 'home booking wizard' },
  { path: '/login', name: 'sign in' },
  { path: '/contact', name: 'contact' },
]

async function measureOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const root = document.documentElement
    const viewport = root.clientWidth
    const offenders = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter(element => {
        const style = getComputedStyle(element)
        if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') {
          return false
        }
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return false
        return rect.right > viewport + 1 || rect.left < -1
      })
      .slice(0, 6)
      .map(element => {
        const rect = element.getBoundingClientRect()
        return `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 80)} [${Math.round(rect.left)}..${Math.round(rect.right)}]`
      })

    return {
      viewport,
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenders,
    }
  })
}

for (const { path, name } of PAGES) {
  test(`${name} stays inside every supported width`, async ({ page }) => {
    test.setTimeout(120_000)

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 })
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(250)

      const result = await measureOverflow(page)
      expect(
        result.scrollWidth,
        `${name} at ${width}px overflows: document ${result.scrollWidth}px / viewport ${result.viewport}px; offenders: ${result.offenders.join(', ') || 'none'}`,
      ).toBeLessThanOrEqual(result.viewport + 1)
    }
  })
}

test('the homepage stays inside the viewport in both themes', async ({ page }) => {
  test.setTimeout(120_000)

  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme })
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(250)

      const result = await measureOverflow(page)
      expect(
        result.scrollWidth,
        `home in ${theme} at ${width}px overflows: ${result.scrollWidth}px / ${result.viewport}px; offenders: ${result.offenders.join(', ') || 'none'}`,
      ).toBeLessThanOrEqual(result.viewport + 1)
    }
  }
})
