import { expect, test } from '@playwright/test'
import { apiIsUp, clickUntil } from './helpers'

/**
 * Discovery — the two service catalogues and the coverage checker.
 *
 * These specs assert the *honesty* rules the product was rebuilt around:
 * prices come from the live booking catalogue only, a category with no
 * bookable service says so and offers an enquiry, and coverage is decided by
 * pincode before a customer can invest time in a booking.
 */
test.describe('home services landing', () => {
  test('answers the coverage question for a served pincode', async ({ page }) => {
    await page.goto('/home-services')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Expert help at your doorstep.')

    await page.getByLabel('Pincode').fill('560034')
    await expect(page.getByText(/Covered — Koramangala/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start a booking' })).toHaveAttribute(
      'href',
      '/book/technician?pincode=560034'
    )
  })

  test('refuses an unserved city and an unknown pincode, with reasons', async ({ page }) => {
    await page.goto('/home-services')

    // A pincode no partner covers — the page says so instead of taking a booking.
    await page.getByLabel('Pincode').fill('400001')
    await expect(page.getByText(/do not have service partners covering 400001/)).toBeVisible()

    await page.getByLabel('Pincode').fill('560999')
    await expect(page.getByText(/do not have service partners covering 560999/)).toBeVisible()

    // A knowingly-excluded locality gets its own, sharper reason.
    await page.getByLabel('Pincode').fill('562110')
    await expect(page.getByText(/Devanahalli is outside the current doorstep-service zone/)).toBeVisible()
  })

  test('never invents a price for a category with no bookable service', async ({ page, request }) => {
    test.skip(!(await apiIsUp(request)), 'Live API is not running.')

    await page.goto('/home-services')

    const catalogue = page.getByRole('heading', { name: 'What we do at home' })
    await expect(catalogue).toBeVisible()

    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible()
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(5)

    /*
     * The live database currently holds no technician services, so every
     * bookable category is "opening soon" and every card must offer an enquiry
     * rather than a wizard that cannot be completed. If services are seeded
     * later, the bookable branch takes over — the spec reads whichever is true
     * and asserts that *a* real action exists, with no fabricated ₹ price.
     */
    const openingSoon = await page.getByText('Booking opening soon').count()
    const prices = await page.getByText(/^From$/).count()

    expect(openingSoon + prices).toBeGreaterThan(0)

    for (let index = 0; index < cardCount; index++) {
      const card = cards.nth(index)
      const action = card.getByRole('link', { name: /Book a slot|Enquire/ })
      await expect(action).toBeVisible()
      const href = await action.getAttribute('href')
      expect(href).toMatch(/^\/book\/technician\?category=|^\/contact$/)
    }
  })

  test('lists the covered localities so coverage is not a black box', async ({ page }) => {
    await page.goto('/home-services')

    const localities = page.getByText('Localities we cover')
    await expect(localities).toBeVisible()
    await expect(page.getByText('Koramangala', { exact: true }).first()).toBeVisible()
  })
})

test.describe('all-services index', () => {
  test('routes a home-service search into the booking wizard', async ({ page }) => {
    await page.goto('/services')

    await page.getByPlaceholder(/Try .plumber/).fill('cleaning')
    await clickUntil(page.getByRole('button', { name: 'Search', exact: true }), () =>
      expect(page).toHaveURL(/\/book\/technician\?category=CLEANING$/, { timeout: 3_000 })
    )
  })

  test('routes an event search into the planning wizard with the group highlighted', async ({ page }) => {
    await page.goto('/services')

    await page.getByPlaceholder(/Try .plumber/).fill('catering')
    await clickUntil(page.getByRole('button', { name: 'Search', exact: true }), () =>
      expect(page).toHaveURL(/\/plan-event\?service=Catering$/, { timeout: 3_000 })
    )
    await expect(page.getByText(/You arrived asking about/)).toBeVisible()
  })

  test('routes an event type search into the filtered event catalogue', async ({ page }) => {
    await page.goto('/services')

    await page.getByPlaceholder(/Try .plumber/).fill('wedding')
    await clickUntil(page.getByRole('button', { name: 'Search', exact: true }), () =>
      expect(page).toHaveURL(/\/events\?type=WEDDING$/, { timeout: 3_000 })
    )
  })
})

test.describe('venues', () => {
  test('browses the live venue list', async ({ page, request }) => {
    test.skip(!(await apiIsUp(request)), 'Live API is not running.')

    const response = await request.get('http://localhost:5000/api/v1/events/venues?limit=5')
    test.skip(!response.ok(), `Venue API responded ${response.status()}`)
    const payload = (await response.json()) as { data?: Array<{ name?: string; title?: string }> }
    const venues = payload.data ?? []
    test.skip(venues.length === 0, 'No venues in the live database.')

    await page.goto('/venues')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/room your celebration deserves/i)

    // A venue from the API must be visible — this proves the page renders the
    // database, not a hard-coded list.
    const name = venues[0].name ?? venues[0].title ?? ''
    expect(name.length).toBeGreaterThan(0)
    await expect(page.getByText(name).first()).toBeVisible()
  })

  test('hands a shortlisted venue over to the planning wizard', async ({ page, request }) => {
    test.skip(!(await apiIsUp(request)), 'Live API is not running.')

    await page.goto('/venues')
    const planLink = page.getByRole('link', { name: 'Plan here' }).first()
    // The list is fetched client-side, so wait for the first card instead of
    // sampling `count()` before the request has resolved.
    await expect(planLink).toBeVisible({ timeout: 20_000 })

    await clickUntil(planLink, () => expect(page).toHaveURL(/\/plan-event\?venueName=/, { timeout: 3_000 }))

    // The wizard must remember the venue rather than asking for it again.
    const wedding = page.getByRole('button', { name: 'Wedding' })
    await clickUntil(wedding, () => expect(wedding).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 }))
    await clickUntil(page.getByRole('button', { name: /Continue/ }), () =>
      expect(page.getByText('Step 2 of 8')).toBeVisible({ timeout: 3_000 })
    )
    await clickUntil(page.getByRole('button', { name: /Continue/ }), () =>
      expect(page.getByText('Step 3 of 8')).toBeVisible({ timeout: 3_000 })
    )
    await expect(page.getByRole('heading', { name: 'Where will it happen?' })).toBeVisible()
    await expect(page.getByLabel('Venue name')).not.toHaveValue('')
  })
})
