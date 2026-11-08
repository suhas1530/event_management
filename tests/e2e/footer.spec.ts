import { expect, test } from '@playwright/test'
import { actUntil } from './helpers'

/**
 * Footer contract.
 *
 * The redesign is only real if the newsletter hits the API, every internal
 * link has a destination, unconfigured social networks stay non-navigating,
 * and the deep evergreen surface is still part of the light/dark token system.
 */

test.describe('footer', () => {
  test('shows the newsletter, contact channels and honest social states', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('heading', { name: 'Good things, worth the occasional inbox.' })).toBeVisible()
    await expect(footer.getByRole('form', { name: 'Newsletter signup' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'hello@heptome.in' })).toHaveAttribute(
      'href',
      'mailto:hello@heptome.in',
    )
    await expect(footer.getByRole('link', { name: /WhatsApp \(opens in a new tab\)/ })).toHaveAttribute(
      'href',
      'https://wa.me/918050171547',
    )
    await expect(footer.getByLabel('Instagram (coming soon)')).toBeVisible()

    // No placeholder or dead internal links in the footer.
    expect(await footer.locator('a[href="#"]').count()).toBe(0)
    expect(await footer.locator('a[href=""]').count()).toBe(0)
  })

  test('newsletter validates, shows loading, then confirms the real API response', async ({ page }) => {
    await page.route('**/api/v1/newsletter', async route => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscribed: true,
          message: "You're on the list. Look out for the next Heptome edit.",
        }),
      })
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const form = page.getByRole('form', { name: 'Newsletter signup' })
    await actUntil(
      () => form.getByRole('button', { name: 'Subscribe' }).click(),
      () => expect(form.getByRole('alert')).toContainText('Enter a valid email address', { timeout: 3_000 }),
    )

    await actUntil(
      async () => {
        await form.getByLabel('Email address').fill('reader@example.com')
        await form.getByRole('button', { name: 'Subscribe' }).click()
      },
      () => expect(form.getByRole('button', { name: /Subscribing/ })).toBeDisabled({ timeout: 3_000 }),
    )

    await expect(page.getByRole('status')).toContainText("You're on the list.", { timeout: 10_000 })
    await expect(page.getByRole('status')).toContainText('Look out for the next Heptome edit.')
  })

  test('server errors are shown and never pretend the visitor subscribed', async ({ page }) => {
    await page.route('**/api/v1/newsletter', route =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests, please try again later.' }),
      }),
    )

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const form = page.getByRole('form', { name: 'Newsletter signup' })
    await actUntil(
      async () => {
        await form.getByLabel('Email address').fill('reader@example.com')
        await form.getByRole('button', { name: 'Subscribe' }).click()
      },
      () => expect(form.getByRole('alert')).toContainText('Too many requests', { timeout: 3_000 }),
    )

    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('footer service anchors land on real catalogue cards', async ({ page }) => {
    await page.goto('/home-services', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('#cleaning')).toBeVisible()
    await expect(page.locator('#ac-service')).toBeVisible()

    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Cleaning & Pest Control' })).toHaveAttribute(
      'href',
      '/home-services#cleaning',
    )
    await expect(footer.getByRole('link', { name: 'AC & Appliance Repair' })).toHaveAttribute(
      'href',
      '/home-services#ac-service',
    )
  })

  test('the footer surface follows the theme tokens', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const footer = page.getByRole('contentinfo')

    await expect(footer).toHaveCSS('background-color', 'rgb(16, 22, 19)')

    await page.evaluate(() => window.localStorage.setItem('heptome-theme', 'dark'))
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(footer).toHaveCSS('background-color', 'rgb(11, 16, 13)')
    await expect(footer).toHaveCSS('color', 'rgb(244, 240, 232)')
  })

  test('stays inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const overflow = await page.evaluate(() => {
      const footer = document.querySelector('footer')
      if (!footer) return null
      return {
        scrollWidth: footer.scrollWidth,
        clientWidth: footer.clientWidth,
        viewport: document.documentElement.clientWidth,
      }
    })

    expect(overflow).not.toBeNull()
    expect(overflow!.scrollWidth).toBeLessThanOrEqual(overflow!.viewport + 1)
  })
})
