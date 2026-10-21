import { expect, test } from '@playwright/test'
import { HEADER_LINKS, clickUntil } from './helpers'

/**
 * Home page — the two-zone living world hero and the discovery paths.
 *
 * Playwright's click actionability check fails when another element would
 * receive the pointer event, which is exactly the regression this suite exists
 * to catch: the 3D layer (or a full-bleed vignette) must never sit over the
 * navigation, the CTAs or the booking panel.
 *
 * Interactions go through `clickUntil` because Next hydrates after
 * `domcontentloaded`: a click inside that window is dropped by the browser, and
 * this suite must not confuse "the app was not listening yet" with "the scene
 * ate the click".
 */
test.describe('home hero', () => {
  test('states the brand promise, both entry points and a scene (or its static fallback)', async ({ page }) => {
    await page.goto('/')

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText('Celebrate Every Moment.')
    await expect(heading).toContainText('Care for Every Corner.')

    await expect(page.getByText('Everything for your moments and your home.').first()).toBeVisible()

    // Both verticals are equally reachable from the hero.
    await expect(page.getByRole('link', { name: 'Plan an Event' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Book a Home Service' }).first()).toBeVisible()

    // Either the WebGL world or the CSS fallback must be present — never nothing.
    await expect(page.locator('#hero canvas').or(page.getByTestId('scene-fallback')).first()).toBeVisible()
  })

  test('the zone control switches wings and keeps both CTAs usable', async ({ page }) => {
    await page.goto('/')

    const zoneControl = page.getByRole('group', { name: 'Choose what to explore' })
    const homeZone = zoneControl.getByRole('button', { name: 'Home Services' })
    const celebrationZone = zoneControl.getByRole('button', { name: 'Events' })

    await expect(celebrationZone).toHaveAttribute('aria-pressed', 'true')

    await clickUntil(homeZone, () => expect(homeZone).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 }))
    await expect(celebrationZone).toHaveAttribute('aria-pressed', 'false')

    await clickUntil(celebrationZone, () => expect(celebrationZone).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 }))

    // The hero CTAs still click through after the camera moved.
    await clickUntil(page.getByRole('link', { name: 'Plan an Event' }).first(), () =>
      expect(page).toHaveURL(/\/plan-event$/, { timeout: 3_000 })
    )
  })

  test('every header link is clickable — the scene never covers the nav', async ({ page }) => {
    for (const { label, path } of HEADER_LINKS) {
      await page.goto('/')
      const header = page.locator('header').first()
      const link = header.getByRole('link', { name: label, exact: true })
      await clickUntil(link, () => expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`), { timeout: 3_000 }))
    }
  })

  test('the Partners menu exposes both partner journeys', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', { name: 'Partners' })
    const professional = page.getByRole('menuitem', { name: /Become a Professional/ })
    const eventPartner = page.getByRole('menuitem', { name: /Become an Event Partner/ })

    // The trigger is a disclosure button: it opens the menu on click (hover only
    // previews it on pointer devices), so both journeys are reachable by touch.
    await clickUntil(trigger, () => expect(professional).toBeVisible({ timeout: 3_000 }))

    await expect(professional).toBeVisible()
    await expect(eventPartner).toBeVisible()

    await clickUntil(eventPartner, () => expect(page).toHaveURL(/\/become-an-event-partner$/, { timeout: 3_000 }))
  })

  test('the location selector lists Bengaluru areas and marks other cities as coming soon', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', { name: /Bengaluru/ }).first()
    await clickUntil(trigger, () => expect(page.getByRole('menuitemradio', { name: /All of Bengaluru/ })).toBeVisible({ timeout: 3_000 }))

    await expect(page.getByText('Coming soon').first()).toBeVisible()
    await expect(page.getByText(/Event partners are booked across India/)).toBeVisible()

    // Choosing an area persists the choice (it prefills the booking wizard).
    await clickUntil(page.getByRole('menuitemradio', { name: 'Koramangala' }), async () => {
      const stored = await page.evaluate(() => window.localStorage.getItem('heptome_location'))
      expect(stored).toContain('Koramangala')
    })
  })

  test('the mobile drawer splits the two verticals and offers both CTAs', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 })
    await page.goto('/')

    const drawer = page.getByRole('navigation', { name: 'Mobile' })
    await clickUntil(page.getByRole('button', { name: 'Open menu' }), () => expect(drawer).toBeVisible({ timeout: 3_000 }))

    await expect(drawer.getByRole('link', { name: /^Events/ })).toBeVisible()
    await expect(drawer.getByRole('link', { name: /^Home Services/ })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Plan an Event' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Book a Home Service' })).toBeVisible()

    await clickUntil(drawer.getByRole('link', { name: 'Book a Home Service' }), () =>
      expect(page).toHaveURL(/\/book\/technician$/, { timeout: 3_000 })
    )
  })
})

test.describe('home discovery sections', () => {
  test('every discovery card starts a workflow the backend can finish', async ({ page }) => {
    await page.goto('/')

    // Events card → the filtered event catalogue.
    await clickUntil(page.getByRole('link', { name: /Explore Event Services/ }).first(), () =>
      expect(page).toHaveURL(/\/events$/, { timeout: 3_000 })
    )

    await page.goto('/')

    // Home-services card → the service landing page (not a dead booking link).
    await clickUntil(page.getByRole('link', { name: /Explore Home Services/ }).first(), () =>
      expect(page).toHaveURL(/\/home-services$/, { timeout: 3_000 })
    )
  })
})
