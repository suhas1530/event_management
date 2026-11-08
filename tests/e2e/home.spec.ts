import { expect, test } from '@playwright/test'
import { HEADER_LINKS, clickUntil } from './helpers'

/**
 * Home page — the photographic hero, its slider and the two booking hand-offs.
 *
 * The hero is a real carousel: eight story frames behind fixed copy, dot and
 * arrow controls, keyboard support, pointer swiping and a booking panel that
 * never moves between slides. These specs pin the visitor-facing contract and
 * prove the page is photography-only — there is no canvas, WebGL context or 3D
 * fallback left.
 *
 * Interactions go through `clickUntil` because Next hydrates after
 * `domcontentloaded`: a click inside that window is dropped by the browser, and
 * this suite must not confuse "the app was not listening yet" with a broken
 * control.
 */
test.describe('photographic hero', () => {
  test('tells both halves of the product in words and pictures', async ({ page }) => {
    await page.goto('/')

    const hero = page.locator('#hero')
    await expect(hero).toBeVisible()

    const heading = hero.getByRole('heading', { level: 1 })
    await expect(heading).toContainText('Every Celebration.')
    await expect(heading).toContainText('Every Corner.')
    await expect(heading).toContainText('One Perfect Place.')
    await expect(
      hero.getByText(
        'From unforgettable events to trusted home services, discover everything you need to make life easier and every moment special.',
      ),
    ).toBeVisible()

    // Both verticals are reachable from the first frame.
    await expect(hero.getByRole('link', { name: 'Plan an event' })).toBeVisible()
    await expect(hero.getByRole('tab', { name: 'Event' })).toHaveAttribute('aria-selected', 'true')
    await expect(hero.getByRole('tab', { name: 'Home service' })).toHaveAttribute('aria-selected', 'false')

    // Eight photographic frames, one dot control each.
    const stories = hero.getByRole('group', { name: 'Choose a photograph' })
    await expect(stories.getByRole('button')).toHaveCount(8)
    await expect(hero.locator('img')).toHaveCount(8)
    await expect(hero.getByRole('button', { name: 'Show Luxury Indian weddings' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    // The redesign removed every WebGL surface.
    await expect(page.locator('canvas')).toHaveCount(0)
  })

  test('the arrows, indicators, keyboard and swipe all move the photographs', async ({ page }) => {
    await page.goto('/')

    const hero = page.locator('#hero')

    await expect(hero.getByText('01 / 08', { exact: true })).toBeVisible()
    await clickUntil(hero.getByRole('button', { name: 'Next photograph' }), () =>
      expect(hero.getByText('02 / 08', { exact: true })).toBeVisible({ timeout: 3_000 }),
    )
    await expect(hero.getByRole('button', { name: 'Show Corporate conferences' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await clickUntil(hero.getByRole('button', { name: 'Show Premium banquet halls' }), () =>
      expect(hero.getByText('04 / 08', { exact: true })).toBeVisible({ timeout: 3_000 }),
    )

    // The booking panel stays on the event tab: the slider never changes it.
    await expect(hero.getByRole('tab', { name: 'Event' })).toHaveAttribute('aria-selected', 'true')

    // Keyboard: Home/End jump to the first/last frame.
    await hero.focus()
    await page.keyboard.press('Home')
    await expect(hero.getByText('01 / 08', { exact: true })).toBeVisible()
    await page.keyboard.press('End')
    await expect(hero.getByText('08 / 08', { exact: true })).toBeVisible()

    // Pointer swipe: a leftward drag advances one frame (back to the first).
    await hero.dispatchEvent('pointerdown', { clientX: 700, pointerId: 1, bubbles: true })
    await hero.dispatchEvent('pointerup', { clientX: 500, pointerId: 1, bubbles: true })
    await expect(hero.getByText('01 / 08', { exact: true })).toBeVisible()
  })

  test('the booking panel hands event and home enquiries to the real wizards', async ({ page }) => {
    await page.goto('/')

    // Event enquiry — the values arrive as query params, not as invented data.
    await page.getByLabel('Event type').selectOption('WEDDING')
    await page.getByLabel('Date').fill('2030-01-01')
    await page.getByLabel('Guests').fill('120')
    await clickUntil(page.getByRole('button', { name: 'Check availability' }), () =>
      expect(page).toHaveURL(/\/plan-event\?type=WEDDING&date=2030-01-01&guests=120$/, { timeout: 5_000 }),
    )

    // Home-service enquiry — coverage is checked before the wizard opens.
    await page.goto('/')
    await clickUntil(page.getByRole('tab', { name: 'Home service' }), () =>
      expect(page.getByRole('tab', { name: 'Home service' })).toHaveAttribute('aria-selected', 'true', {
        timeout: 3_000,
      }),
    )

    const homeForm = page.getByRole('form', { name: 'Book a home service' })
    await homeForm.getByLabel('Service').selectOption('CLEANING')
    await homeForm.getByLabel('Pincode').fill('562110')
    await clickUntil(page.getByRole('button', { name: 'See services & prices' }), () =>
      expect(page.getByRole('alert').filter({ hasText: 'Devanahalli' })).toBeVisible({ timeout: 3_000 }),
    )

    await homeForm.getByLabel('Pincode').fill('560034')
    await clickUntil(page.getByRole('button', { name: 'See services & prices' }), () =>
      expect(page).toHaveURL(/\/book\/technician\?category=CLEANING&pincode=560034$/, { timeout: 5_000 }),
    )
  })

  test('keeps the hero usable and overflow-free on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const hero = page.locator('#hero')
    await expect(hero.getByRole('heading', { level: 1 })).toContainText('Every Celebration.')
    await expect(hero.getByRole('group', { name: 'Choose a photograph' }).getByRole('button')).toHaveCount(8)
    await expect(hero.getByRole('tab', { name: 'Event' })).toBeVisible()

    await clickUntil(hero.getByRole('button', { name: 'Next photograph' }), () =>
      expect(hero.getByText('02 / 08', { exact: true })).toBeVisible({ timeout: 3_000 }),
    )

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('home chrome', () => {
  test('every header link is clickable — no visual layer covers the nav', async ({ page }) => {
    for (const { label, path } of HEADER_LINKS) {
      await page.goto('/')
      const header = page.locator('header').first()
      const link = header.getByRole('link', { name: label, exact: true })
      await clickUntil(link, () =>
        expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`), { timeout: 3_000 }),
      )
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
    await clickUntil(trigger, () =>
      expect(page.getByRole('menuitemradio', { name: /All of Bengaluru/ })).toBeVisible({ timeout: 3_000 }),
    )

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
    await clickUntil(page.getByRole('button', { name: 'Open menu' }), () =>
      expect(drawer).toBeVisible({ timeout: 3_000 }),
    )

    await expect(drawer.getByRole('link', { name: /^Events/ })).toBeVisible()
    await expect(drawer.getByRole('link', { name: /^Home Services/ })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Plan an Event' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Book a Home Service' })).toBeVisible()

    await clickUntil(drawer.getByRole('link', { name: 'Book a Home Service' }), () =>
      expect(page).toHaveURL(/\/book\/technician$/, { timeout: 3_000 }),
    )
  })
})

test.describe('home discovery sections', () => {
  test('every discovery card starts a workflow the backend can finish', async ({ page }) => {
    await page.goto('/')

    // Events card → the filtered event catalogue.
    await clickUntil(page.getByRole('link', { name: /Explore Event Services/ }).first(), () =>
      expect(page).toHaveURL(/\/events$/, { timeout: 3_000 }),
    )

    await page.goto('/')

    // Home-services card → the service landing page (not a dead booking link).
    await clickUntil(page.getByRole('link', { name: /Explore Home Services/ }).first(), () =>
      expect(page).toHaveURL(/\/home-services$/, { timeout: 3_000 }),
    )
  })
})
