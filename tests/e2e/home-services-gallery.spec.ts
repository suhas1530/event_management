import { expect, test } from '@playwright/test'
import { clickUntil } from './helpers'

/**
 * The expanded home-services photography experience.
 * These assertions stay on behaviour and provenance — never on a stock photo's
 * exact pixels — so replacing an image with a customer photograph later does
 * not break the suite.
 */

test.describe('home services photography', () => {
  test('the landing slider shows six real service slides and advances automatically', async ({ page }) => {
    await page.goto('/home-services', { waitUntil: 'domcontentloaded' })

    const slider = page.locator('section[aria-roledescription="carousel"]')
    await expect(slider).toBeVisible()
    const dots = slider.getByRole('button', { name: /^Show slide \d+:/ })
    await expect(dots).toHaveCount(6)

    const headline = slider.locator('h2').first()
    const first = await headline.innerText()
    await expect.poll(async () => headline.innerText(), { timeout: 9_000 }).not.toBe(first)

    await dots.first().click()
    await expect(dots.first()).toHaveAttribute('aria-current', 'true')
    await slider.getByRole('button', { name: 'Next photo' }).click()
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await slider.getByRole('button', { name: 'Previous photo' }).click()
    await expect(dots.first()).toHaveAttribute('aria-current', 'true')
  })

  test('the gallery labels seven real trades and links to their detail pages', async ({ page }) => {
    await page.goto('/home-services', { waitUntil: 'domcontentloaded' })
    const gallery = page.locator('#gallery-heading')
    await expect(gallery).toHaveText('Professional Home Services at Your Doorstep')

    const tiles = page.locator('a[aria-label*="—"]')
    const tradeTiles = tiles.filter({ hasText: /Plumbing|Electrical work|Cleaning|Appliance repair|Painting|Carpentry|Home maintenance/ })
    const tileCount = await tradeTiles.count()
    expect(tileCount).toBeGreaterThanOrEqual(7)

    const firstHref = await tradeTiles.first().getAttribute('href')
    expect(firstHref).toMatch(/^\/home-services\/[a-z-]+$/)
  })

  test('a service detail page has its own photo collection and a working booking link', async ({ page }) => {
    await page.goto('/home-services/plumbing', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Plumbing', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Available plumbing services' })).toBeVisible()

    const gallery = page.getByRole('region', { name: 'Plumbing photo gallery' })
    await expect(gallery).toBeVisible()
    const photoCount = await gallery.getByRole('button', { name: /^Show photo \d+:/ }).count()
    expect(photoCount).toBeGreaterThanOrEqual(5)

    const book = page.getByRole('link', { name: /^Book Now/ }).first()
    await expect(book).toHaveAttribute('href', '/book/technician?category=PLUMBING')
  })

  test('an on-request service still enquires instead of offering a non-existent booking', async ({ page }) => {
    await page.goto('/home-services/salon-women', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Women')
    await expect(page.getByRole('link', { name: /^Enquire/ }).first()).toHaveAttribute('href', '/contact')
  })

  test('every visible home-services photograph resolves in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await page.addInitScript(mode => {
        try { localStorage.setItem('heptome-theme', mode) } catch (e) {}
      }, theme)
      await page.goto('/home-services', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const broken = await page.evaluate(() =>
        [...document.images].filter(img => img.complete && img.naturalWidth === 0).length,
      )
      expect(broken, `${theme} broken images`).toBe(0)
    }
  })

  test('navigating a card reaches the detail page without losing the theme', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('heptome-theme', 'dark') } catch (e) {}
    })
    await page.goto('/services', { waitUntil: 'domcontentloaded' })
    const card = page.getByRole('link', { name: 'View Plumbing details and photos' }).first()
    await clickUntil(card, () => expect(page).toHaveURL(/\/home-services\/plumbing$/, { timeout: 3_000 }))
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
