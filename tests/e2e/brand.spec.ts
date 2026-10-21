import { expect, test } from '@playwright/test'
import { PUBLIC_ROUTES, clickUntil, stubSignedInSession } from './helpers'

/**
 * Rebrand regression suite.
 *
 * The rename from the previous brand to Heptome touched every surface, and the
 * only way to keep it renamed is to assert it: no rendered page may still show
 * the old wordmark, and a session created before the rename must survive it.
 */

/** Matches the old wordmark only — never the word "advance" or "advantage". */
const OLD_BRAND = /avān|avan\.events|avan_/i

test.describe('brand', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} shows the Heptome wordmark and no trace of the old brand`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      // Sign-in-gated routes bounce to /login, so the wordmark is asserted
      // anywhere on the page rather than only inside the header.
      await expect(page.getByText(/Heptome/).first()).toBeVisible()
      await expect(page.locator('body')).not.toContainText(OLD_BRAND)
      expect(await page.title()).not.toMatch(OLD_BRAND)
    })
  }

  test('moves a pre-rebrand session onto the Heptome keys instead of logging the customer out', async ({ page }) => {
    /*
     * The session endpoint is stubbed because the point is the client-side key
     * move: with a real 401 the correct behaviour is to clear the session,
     * which wipes the very keys this test inspects. `token-store.test.ts`
     * covers the migration key by key; this covers it in a real browser.
     */
    await stubSignedInSession(page)

    await page.addInitScript(() => {
      window.localStorage.setItem('avan_access_token', 'legacy-access-token')
      window.localStorage.setItem('avan_refresh_token', 'legacy-refresh-token')
      window.localStorage.setItem('avan_admin_token', 'legacy-admin-token')
      window.localStorage.setItem('avan_admin_refresh_token', 'legacy-admin-refresh-token')
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // The auth provider reads the session on mount, which performs the migration.
    // Assert all keys in one snapshot: four independent polls can observe a
    // half-finished migration and report a less useful failure.
    const storageSnapshot = () => page.evaluate(() => {
      const keys = [
        'heptome_access_token',
        'heptome_refresh_token',
        'heptome_admin_token',
        'heptome_admin_refresh_token',
        'avan_access_token',
        'avan_refresh_token',
        'avan_admin_token',
        'avan_admin_refresh_token',
      ]
      return Object.fromEntries(keys.map(key => [key, window.localStorage.getItem(key)]))
    })

    await expect.poll(storageSnapshot, { timeout: 15_000 }).toEqual({
      heptome_access_token: 'legacy-access-token',
      heptome_refresh_token: 'legacy-refresh-token',
      heptome_admin_token: 'legacy-admin-token',
      heptome_admin_refresh_token: 'legacy-admin-refresh-token',
      // Legacies are moved, not copied: a stale duplicate must not survive.
      avan_access_token: null,
      avan_refresh_token: null,
      avan_admin_token: null,
      avan_admin_refresh_token: null,
    })

    // The session still works: the header offers the signed-in account and its
    // two vertical-scoped entry points.
    const header = page.locator('header').first()
    const myEvents = page.getByRole('menuitem', { name: 'My Events' })
    await clickUntil(header.getByRole('button', { name: /Stub/ }), () => expect(myEvents).toBeVisible({ timeout: 3_000 }))
    await expect(myEvents).toHaveAttribute('href', '/dashboard?tab=events')
    await expect(page.getByRole('menuitem', { name: 'My Home Services' })).toHaveAttribute('href', '/dashboard?tab=home')
  })

  test('the dashboard splits the two verticals into named tabs', async ({ page }) => {
    await stubSignedInSession(page)
    await page.addInitScript(() => {
      window.localStorage.setItem('heptome_access_token', 'stub-access-token')
      window.localStorage.setItem('heptome_refresh_token', 'stub-refresh-token')
    })

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('tab', { name: 'My Events' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'My Home Services' })).toBeVisible()

    // Switching tab keeps the vertical in the address bar.
    const homeTab = page.getByRole('tab', { name: 'My Home Services' })
    await clickUntil(homeTab, () => expect(page).toHaveURL(/\?tab=home$/, { timeout: 3_000 }))
    await expect(page.getByText(/No home-service bookings yet|Book a Home Service/).first()).toBeVisible()
  })
})
