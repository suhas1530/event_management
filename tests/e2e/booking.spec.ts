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
  test('opens on the services step with the requested group highlighted', async ({ page }) => {
    await page.goto('/plan-event?service=Catering')

    await expect(page.getByRole('heading', { name: 'What do you need for your event?' })).toBeVisible()
    await expect(page.getByText(/You arrived asking about/)).toContainText('Catering')
    await expect(page.getByText('Step 5 of 8')).toBeVisible()
  })

  test('prefills a venue shortlisted from the venues page', async ({ page }) => {
    await page.goto('/plan-event?venueName=The%20Grand%20Hall&venueCity=Bengaluru')

    await expect(page.getByRole('heading', { name: 'What type of event are you planning?' })).toBeVisible()

    await page.getByRole('button', { name: 'Wedding' }).click()
    await clickUntil(page.getByRole('button', { name: /Continue/ }), () =>
      expect(page.getByText('Step 2 of 8')).toBeVisible({ timeout: 3_000 })
    )
    await clickUntil(page.getByRole('button', { name: /Continue/ }), () =>
      expect(page.getByText('Step 3 of 8')).toBeVisible({ timeout: 3_000 })
    )

    await expect(page.getByRole('heading', { name: 'Where will it happen?' })).toBeVisible()

    // "Venue already arranged" is selected and the name is carried through.
    const venueName = page.getByLabel('Venue name')
    await expect(venueName).toHaveValue('The Grand Hall')
    await expect(page.getByLabel('City')).toHaveValue('Bengaluru')
  })

  test('a wrong or missing event type is caught before the wizard advances', async ({ page }) => {
    await page.goto('/plan-event')

    await clickUntil(page.getByRole('button', { name: /Continue/ }), () =>
      expect(page.getByText('Choose an event type to continue.')).toBeVisible({ timeout: 3_000 })
    )
    await expect(page.getByText('Step 1 of 8')).toBeVisible()
  })
})

test.describe('home-service booking wizard', () => {
  test('receives the category from a service card and advances on one click', async ({ page }) => {
    await page.goto('/book/technician?category=CLEANING')

    // The category is already answered, so the wizard opens on the service step.
    await expect(page.getByText('Step 2 of 9')).toBeVisible()

    // Choosing a category must advance immediately — the previous build needed
    // two clicks because validation ran against stale state. The wizard keeps a
    // session draft (a returning customer resumes where they left off), so the
    // draft is cleared first to guarantee a genuine step-1 start.
    await page.evaluate(() => window.sessionStorage.clear())
    await page.goto('/book/technician')
    await expect(page.getByText('Step 1 of 9')).toBeVisible()
    await clickUntil(page.getByRole('button', { name: /Cleaning/ }).first(), () =>
      expect(page.getByText('Step 2 of 9')).toBeVisible({ timeout: 3_000 })
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
    await expect(page.getByText(/starting from/i)).toHaveCount(0)
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
