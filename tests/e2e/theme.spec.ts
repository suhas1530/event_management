import { expect, test } from '@playwright/test'
import { clickUntil } from './helpers'

/**
 * Theme system — the visitor-facing contract.
 *
 * The suite pins what the product promises: a dark default, a visible and
 * accessible switcher in the main navigation, the choice surviving refreshes
 * and navigation, no flash of the wrong theme on load, and the switch working
 * on the admin sign-in page and in the mobile drawer.
 *
 * Interactions use `clickUntil` because Next hydrates after `domcontentloaded`
 * — a click in that window is silently dropped (see helpers.ts).
 */
test.describe('theme switcher', () => {
  test('defaults to dark and exposes an accessible toggle in the navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/dark/)

    const toggle = page.getByRole('button', { name: 'Switch to light mode' })
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('title', 'Switch to light mode')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  test('flips the whole interface to light and persists across a refresh', async ({ page }) => {
    await page.goto('/')

    const toggle = page.getByRole('button', { name: 'Switch to light mode' })
    await clickUntil(toggle, () => expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3_000 }))

    // Body background follows the token, not a hardcoded page colour.
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bodyBg).toBe('rgb(250, 249, 246)')

    await page.reload({ waitUntil: 'domcontentloaded' })

    // The inline bootstrap script applies the stored choice before first paint.
    const early = await page.evaluate(() => ({
      cls: document.documentElement.className,
      theme: document.documentElement.dataset.theme,
    }))
    expect(early.theme).toBe('light')
    expect(early.cls).not.toContain('dark')

    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('heptome-theme'))
    expect(stored).toBe('light')
  })

  test('keeps the choice while navigating between pages', async ({ page }) => {
    await page.goto('/')

    const toggle = page.getByRole('button', { name: 'Switch to light mode' })
    await clickUntil(toggle, () => expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3_000 }))

    const header = page.locator('header').first()
    await clickUntil(
      header.getByRole('link', { name: 'About', exact: true }),
      () => expect(page).toHaveURL(/\/about$/, { timeout: 3_000 }),
    )

    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  })

  test('preserves an explicit dark choice across a refresh', async ({ page }) => {
    await page.goto('/')

    const light = page.getByRole('button', { name: 'Switch to light mode' })
    await clickUntil(light, () => expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3_000 }))

    const dark = page.getByRole('button', { name: 'Switch to dark mode' })
    await clickUntil(dark, () => expect(page.locator('html')).toHaveClass(/dark/, { timeout: 3_000 }))

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('the admin sign-in page carries the switcher and honours it', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.locator('html')).toHaveClass(/dark/)

    const toggle = page.getByRole('button', { name: 'Switch to light mode' })
    await clickUntil(toggle, () => expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3_000 }))

    // The form stays usable in light mode.
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /access admin panel/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible()
  })

  test('the mobile drawer offers the switcher too', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const open = page.getByRole('button', { name: 'Open menu' })
    // Two "Close menu" controls exist (banner + drawer); the banner one is the
    // trigger whose label flips when the drawer opens.
    await clickUntil(open, () =>
      expect(page.getByRole('banner').getByRole('button', { name: 'Close menu' })).toBeVisible({ timeout: 3_000 }),
    )

    const drawerToggle = page.getByRole('navigation', { name: 'Mobile' }).getByRole('button', { name: 'Switch to light mode' })
    await expect(drawerToggle).toContainText('Appearance')

    await clickUntil(drawerToggle, () => expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3_000 }))
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  })

  test('switching themes raises no page errors or hydration warnings', async ({ page }) => {
    const problems: string[] = []
    page.on('pageerror', error => problems.push(`pageerror: ${error.message}`))
    page.on('console', message => {
      const text = message.text()
      if (
        message.type() === 'error' &&
        /hydration|did not match|server rendered|invalid hook|warning/i.test(text)
      ) {
        problems.push(`console: ${text}`)
      }
    })

    await page.goto('/')
    const light = page.getByRole('button', { name: 'Switch to light mode' })
    await clickUntil(light, () => expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3_000 }))
    const dark = page.getByRole('button', { name: 'Switch to dark mode' })
    await clickUntil(dark, () => expect(page.locator('html')).toHaveClass(/dark/, { timeout: 3_000 }))
    await page.waitForTimeout(600)

    expect(problems).toEqual([])
  })
})
