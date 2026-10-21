import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test'

/** Base URL of the Express API the frontend talks to. */
export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:5000'
export const API = `${API_BASE}/api/v1`

/**
 * Answers the session and dashboard calls with a stub.
 *
 * Used only where the *client* behaviour is under test (the localStorage key
 * migration, the dashboard's tab set). Collection endpoints are answered with
 * empty results, so every panel renders its honest empty state — nothing about
 * the catalogue, prices or bookings is invented here. Specs that assert real
 * data call `apiIsUp` and skip instead.
 */
export async function stubSignedInSession(page: Page, user = { id: 'stub-user', name: 'Stub Customer', email: 'stub@example.com', role: 'CUSTOMER' }): Promise<void> {
  /*
   * One handler, not two: Playwright matches routes last-registered-first, so a
   * generic `**\/api/v1/**` route declared after a specific one silently
   * shadows it — which would answer `/auth/profile` with an empty collection
   * and leave the header signed out.
   */
  await page.route('**/api/v1/**', route => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/auth/profile')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
    }

    // `/event-requests` and `/favorites` return bare arrays; the rest are paginated.
    const body = url.pathname.endsWith('/event-requests') || url.pathname.endsWith('/favorites')
      ? []
      : { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

/**
 * Health probe for the live API.
 *
 * Specs that depend on real catalogue data call this and skip themselves when
 * the backend is down. Skipping is deliberate: the alternative — asserting
 * against invented data — would fake a pass.
 */
export async function apiIsUp(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_BASE}/health`, { timeout: 5_000 })
    return response.ok()
  } catch {
    return false
  }
}

/**
 * Performs an interaction and retries it until the effect can be observed.
 *
 * Next.js hydrates *after* `domcontentloaded`, and a click dispatched inside
 * that window is delivered to the DOM while no React handler is listening yet,
 * so the browser silently drops it. Retrying is the honest way to handle that:
 * a handler that is genuinely broken still fails for good after the timeout.
 * Pass assertions with a short timeout inside `expectEffect` so a dropped click
 * retries quickly instead of burning the whole budget on one attempt.
 */
export async function actUntil(action: () => Promise<unknown>, expectEffect: () => Promise<unknown>): Promise<void> {
  await expect(async () => {
    try {
      await action()
    } catch {
      /*
       * A navigation can replace the element while Playwright is still finishing
       * the click, which surfaces as "element was detached" even though the
       * interaction landed. The effect assertion below is the real check, so the
       * action's own error is ignored — a click that never lands still fails it.
       */
    }
    await expectEffect()
  }).toPass({ timeout: 45_000, intervals: [200, 400, 800] })
}

export function clickUntil(locator: Locator, expectEffect: () => Promise<unknown>): Promise<void> {
  return actUntil(() => locator.click({ timeout: 5_000 }), expectEffect)
}

export function hoverUntil(locator: Locator, expectEffect: () => Promise<unknown>): Promise<void> {
  return actUntil(() => locator.hover({ timeout: 5_000 }), expectEffect)
}

/** Every public route the rebrand sweep must cover. */
export const PUBLIC_ROUTES = [
  '/',
  '/services',
  '/home-services',
  '/events',
  '/venues',
  '/plan-event',
  '/book/technician',
  '/about',
  '/contact',
  '/help',
  '/careers',
  '/terms',
  '/privacy',
  '/become-a-professional',
  '/become-an-event-partner',
  '/login',
  '/register',
  '/forgot-password',
  '/ai-event-designer',
  '/event-requests',
  '/bookings',
  '/dashboard',
] as const

/** Desktop header entries, in render order. */
export const HEADER_LINKS = [
  { label: 'Events', path: '/events' },
  { label: 'Home Services', path: '/home-services' },
  { label: 'Venues', path: '/venues' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
] as const
