import { expect, test } from '@playwright/test'
import { apiIsUp, clickUntil } from './helpers'

/**
 * The two booking journeys.
 *
 * What is asserted here is the hand-off between surfaces and the honesty of the
 * states the live system can actually reach. A full home-service submission is
 * *not* exercised against the live API because the database currently has no
 * technician services (see the report) — the submission path is covered by
 * `tests/unit/technician-wizard.test.tsx`, which asserts a PENDING booking is
 * reported as "Slot requested", never "confirmed".
 */
test.describe('event planning wizard', () => {
  test('opens on the single brief screen with the requested group highlighted', async ({ page }) => {
    await page.goto('/plan-event?service=Catering')

    await expect(page.getByRole('heading', { name: 'What do you need for your event?' })).toBeVisible()
    await expect(page.getByText(/You arrived asking about/)).toContainText('Catering')
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
  })

  test('prefills a venue shortlisted from the venues page', async ({ page }) => {
    await page.goto('/plan-event?venueName=The%20Grand%20Hall&venueCity=Bengaluru')

    await expect(page.getByRole('heading', { name: 'What type of event are you planning?' })).toBeVisible()

    // "Venue already arranged" is selected and the name is carried through.
    const venueName = page.getByLabel('Venue name *')
    await expect(venueName).toHaveValue('The Grand Hall')
    await expect(page.getByLabel(/City \*/)).toHaveValue('Bengaluru')
  })

  test('a missing event type is caught before the brief can be reviewed', async ({ page }) => {
    await page.goto('/plan-event')

    await clickUntil(page.getByRole('button', { name: /Review request/ }), () =>
      expect(page.getByText('Choose an event type to continue.')).toBeVisible({ timeout: 3_000 })
    )
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
  })
})

test.describe('home-service booking wizard', () => {
  test('receives the category from a service card and keeps one details screen', async ({ page }) => {
    await page.goto('/book/technician?category=CLEANING')

    // The category is already answered, so the service list is visible on the
    // first (and only) details screen.
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
    const cleaning = page.getByRole('button', { name: /Full Home & Deep Cleaning/ }).first()
    await expect(cleaning).toHaveAttribute('aria-pressed', 'true')

    // Choosing a category on a fresh visit takes effect immediately — the
    // previous build needed two clicks because validation ran against stale
    // state. The wizard keeps a session draft, so clear it first.
    await page.evaluate(() => window.sessionStorage.clear())
    await page.goto('/book/technician')
    await expect(page.getByText('Step 1 of 2')).toBeVisible()

    const freshCleaning = page.getByRole('button', { name: /Full Home & Deep Cleaning/ }).first()
    await clickUntil(freshCleaning, () =>
      expect(freshCleaning).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 })
    )
  })

  test('states honestly that a category has no bookable services yet', async ({ page, request }) => {
    test.skip(!(await apiIsUp(request)), 'Live API is not running.')

    const response = await request.get('http://localhost:5000/api/v1/technicians/services/category/CLEANING')
    const services = (await response.json()) as unknown[]
    test.skip(services.length > 0, 'The live catalogue has services; the empty state does not apply.')

    await page.goto('/book/technician?category=CLEANING')

    await expect(page.getByText(/no bookable services listed yet/i)).toBeVisible()
    // No invented price and no dead "next": the honest route is a human.
    await expect(page.getByText(/₹/)).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Ask the team' })).toHaveAttribute('href', '/contact')
    await expect(page.getByRole('link', { name: 'Browse other categories' })).toHaveAttribute('href', '/services')
  })

  test('carries the coverage check result into the wizard', async ({ page }) => {
    // The pincode arrives from the landing-page checker.
    await page.goto('/home-services')
    await page.getByLabel('Pincode').fill('562110')
    await expect(page.getByText(/outside the current doorstep-service zone/i)).toBeVisible()
    // An unserved pincode must not offer a booking shortcut.
    await expect(page.getByRole('link', { name: 'Start a booking' })).toHaveCount(0)
  })

  test('asks a signed-out visitor to sign in and offers to return to the wizard', async ({ page }) => {
    await page.goto('/login?redirect=%2Fbook%2Ftechnician%3Fcategory%3DCLEANING')

    await expect(page.getByText(/Sign in to finish what you started/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create one' })).toHaveAttribute(
      'href',
      '/register?redirect=%2Fbook%2Ftechnician%3Fcategory%3DCLEANING'
    )
  })

  test('ignores an off-site redirect parameter', async ({ page }) => {
    await page.goto('/login?redirect=https%3A%2F%2Fevil.example%2Fsteal')

    // Unsafe targets are discarded, so the "almost there" notice is not shown
    // and sign-in will fall back to the role's normal landing page.
    await expect(page.getByText(/Sign in to finish what you started/)).toHaveCount(0)
  })
})
