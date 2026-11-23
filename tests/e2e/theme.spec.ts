import { expect, test, type Page } from '@playwright/test'
import { clickUntil } from './helpers'

/**
 * Theme system — the visitor-facing contract.
 *
 * A first visit follows the operating-system preference. An explicit choice is
 * written to `heptome-theme`, survives refreshes and navigation, and wins over
 * the OS on the next visit. The inline bootstrap script applies the class
 * before paint, so there is no flash and no hydration mismatch. The switcher is
 * present in the desktop header, the mobile drawer and the admin sign-in page.
 */

const LIGHT_BG = 'rgb(248, 246, 242)'
const DARK_BG = 'rgb(23, 27, 25)'

async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor)
}

/** Opens the header appearance menu and picks one of Light / Dark / System. */
async function chooseTheme(page: Page, label: 'Light' | 'Dark' | 'System') {
  const trigger = page.getByRole('button', { name: 'Theme settings' }).first()
  await clickUntil(trigger, () => expect(page.getByRole('menu')).toBeVisible({ timeout: 2_000 }))
  await page.getByRole('menuitemradio', { name: new RegExp(`^${label}`) }).click()
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
}

test.describe('theme system', () => {
  test('a first visit follows a light OS preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system')

    const toggle = page.getByRole('button', { name: 'Theme settings' })
    await expect(toggle).toBeVisible()
    await expect(toggle).not.toHaveAttribute('aria-pressed')
    expect(await bodyBackground(page)).toBe(LIGHT_BG)
  })

  test('a first visit follows a dark OS preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system')

    expect(await bodyBackground(page)).toBe(DARK_BG)
  })

  test('an explicit choice flips the whole interface and persists across a refresh', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    await chooseTheme(page, 'Dark')

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark')
    expect(await bodyBackground(page)).toBe(DARK_BG)

    await page.reload({ waitUntil: 'domcontentloaded' })

    // The inline bootstrap script applies the stored choice before first paint.
    const early = await page.evaluate(() => ({
      cls: document.documentElement.className,
      theme: document.documentElement.dataset.theme,
      mode: document.documentElement.dataset.themeMode,
    }))
    expect(early.theme).toBe('dark')
    expect(early.mode).toBe('dark')
    expect(early.cls).toContain('dark')

    const toggle = page.getByRole('button', { name: 'Theme settings' })
    await expect(toggle).toHaveAttribute('title', 'Theme: dark')
    const stored = await page.evaluate(() => localStorage.getItem('heptome-theme'))
    expect(stored).toBe('dark')
  })

  test('the explicit choice wins over the OS on the next visit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)

    await chooseTheme(page, 'Light')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // The OS still says dark, but the stored choice is light.
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light')
  })

  test('system mode follows a live OS change without a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // The first visit is already in system mode; change the OS preference.
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system')

    // Once the visitor makes an explicit choice, the OS stops winning.
    await chooseTheme(page, 'Light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light')
  })

  test('keeps the choice while navigating between pages', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    await chooseTheme(page, 'Dark')

    const header = page.locator('header').first()
    await clickUntil(header.getByRole('link', { name: 'About', exact: true }), () =>
      expect(page).toHaveURL(/\/about$/, { timeout: 3_000 }),
    )

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark')
    await expect(page.getByRole('button', { name: 'Theme settings' })).toHaveAttribute(
      'title',
      'Theme: dark',
    )
  })

  test('the admin sign-in page carries the switcher and honours it', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/admin/login')

    await expect(page.locator('html')).not.toHaveClass(/dark/)

    await chooseTheme(page, 'Dark')

    // The form stays usable in dark mode.
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /access admin panel/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible()
  })

  test('the mobile drawer offers the three-way switcher too', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const open = page.getByRole('button', { name: 'Open menu' })
    await clickUntil(open, () =>
      expect(page.getByRole('banner').getByRole('button', { name: 'Close menu' })).toBeVisible({ timeout: 3_000 }),
    )

    const drawer = page.getByRole('dialog', { name: 'Mobile menu' })
    await expect(drawer.getByText('Appearance')).toBeVisible()
    await expect(drawer.getByRole('radio', { name: 'System' })).toBeChecked()

    await drawer.getByRole('radio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(drawer.getByRole('radio', { name: 'Dark' })).toBeChecked()
    await expect(drawer.getByText('Dark', { exact: true })).toBeVisible()
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

    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await chooseTheme(page, 'Dark')
    await chooseTheme(page, 'Light')
    await chooseTheme(page, 'System')
    await page.waitForTimeout(600)

    expect(problems).toEqual([])
  })
})
