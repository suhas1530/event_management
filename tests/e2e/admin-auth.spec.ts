import { expect, test, type Page } from '@playwright/test'
import { actUntil, API, apiIsUp, clickUntil } from './helpers'

/**
 * Admin authentication — the boundary that must never be trusted to the client.
 *
 * Two layers are covered:
 *
 *  1. Browser behaviour with the network stubbed (deterministic, no database
 *     writes): invalid credentials surface the real error and issue no token, a
 *     successful sign-in stores the admin token and redirects, the client guard
 *     rejects missing/malformed/expired admin sessions, and sign-out clears
 *     both tokens.
 *  2. The live API (skipped when the backend is down): unauthenticated calls
 *     and customer-role tokens are rejected by the backend itself. UI hiding is
 *     not the security boundary here — `adminMiddleware` is.
 *
 * Credentials come from the seeded development database and can be overridden
 * with E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD. The API test skips honestly
 * if that account does not exist rather than pretending the check ran.
 */

const ADMIN_TOKEN_KEY = 'heptome_admin_token'
const ADMIN_REFRESH_KEY = 'heptome_admin_refresh_token'
const CUSTOMER_TOKEN_KEY = 'heptome_access_token'

const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? 'demo@avan.events'
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? 'Customer@123'

const DASHBOARD_STATS = {
  revenue: { total: 0, thisMonth: 0, growth: 0 },
  bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
  customers: { total: 0, newThisMonth: 0 },
  upcomingEvents: 0,
  aiDesigns: 0,
}

const EMPTY_PAGE = {
  data: [],
  pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
}

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/** A structurally valid JWT the browser can decode. It is never verified client-side. */
function fakeJwt(payload: Record<string, unknown>): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60
  return [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ exp, ...payload }),
    'signature-is-never-verified-by-the-client',
  ].join('.')
}

function adminJwt(overrides: Record<string, unknown> = {}): string {
  return fakeJwt({
    id: 'admin-stub',
    name: 'Priya Sharma',
    role: 'ADMIN',
    type: 'admin_access',
    ...overrides,
  })
}

/** Seeds localStorage before the app boots (runs on every document load). */
async function seedStorage(page: Page, entries: Record<string, string>): Promise<void> {
  await page.addInitScript(items => {
    for (const [key, value] of Object.entries(items)) {
      window.localStorage.setItem(key, value)
    }
  }, entries)
}

interface StubOptions {
  login?: { status: number; body: unknown }
  onRequest?: (path: string, headers: Record<string, string>) => void
}

/**
 * Answers the admin API deterministically.
 *
 * One combined handler because Playwright routes match last-registered-first:
 * a generic handler declared after specific ones silently shadows them. All
 * values are explicit zeroes/empty collections — no invented bookings or money.
 */
async function stubAdminApi(page: Page, options: StubOptions = {}): Promise<void> {
  await page.route('**/api/v1/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '')
    options.onRequest?.(path, request.headers())

    if (path === '/auth/admin/login' && request.method() === 'POST') {
      const login = options.login ?? {
        status: 200,
        body: {
          admin: { id: 'admin-stub', name: 'Priya Sharma', email: 'admin@avan.events', role: 'ADMIN' },
          accessToken: adminJwt(),
          refreshToken: 'stub-admin-refresh-token',
        },
      }
      return route.fulfill({
        status: login.status,
        contentType: 'application/json',
        body: JSON.stringify(login.body),
      })
    }

    if (path === '/admin/dashboard') return route.fulfill({ json: DASHBOARD_STATS })
    if (path.startsWith('/admin/bookings')) return route.fulfill({ json: EMPTY_PAGE })
    if (path.startsWith('/admin/analytics/revenue')) return route.fulfill({ json: [] })

    return route.fulfill({ json: { message: 'stubbed' } })
  })
}

async function fillLogin(page: Page, email: string, password: string, expectEffect: () => Promise<unknown>): Promise<void> {
  // Retrying the whole fill+submit handles the hydration window: a fill that
  // lands before React listens is overwritten when the controlled input mounts.
  await actUntil(async () => {
    await page.getByLabel('Email').fill(email)
    // `exact` matters: the show/hide control has the accessible name "Show
    // password", which substring matching would also select.
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: /access admin panel/i }).click({ timeout: 5_000 })
  }, expectEffect)
}

test.describe('admin sign-in', () => {
  test('rejects invalid credentials with the real error and issues no token', async ({ page }) => {
    await stubAdminApi(page, {
      login: { status: 401, body: { error: 'Invalid credentials', code: 'AUTHENTICATION_ERROR' } },
    })
    await page.goto('/admin/login')

    // Scope to <main>: Next's route announcer is also a role="alert" element.
    const errorBox = page.getByRole('main').getByRole('alert')
    await fillLogin(page, 'admin@avan.events', 'wrong-password', () =>
      expect(errorBox).toHaveText('Invalid credentials', { timeout: 5_000 }),
    )

    await expect(page).toHaveURL(/\/admin\/login$/)
    await expect(errorBox).toBeVisible()
    // The button returns from its loading state so the visitor can retry.
    await expect(page.getByRole('button', { name: /access admin panel/i })).toBeEnabled()

    const keys = await page.evaluate(() => Object.keys(window.localStorage))
    expect(keys).not.toContain(ADMIN_TOKEN_KEY)
    expect(keys).not.toContain(ADMIN_REFRESH_KEY)
  })

  test('stores the admin tokens, redirects to the dashboard and authenticates API calls', async ({ page }) => {
    const token = adminJwt()
    let dashboardAuth: string | undefined
    await stubAdminApi(page, {
      login: {
        status: 200,
        body: {
          admin: { id: 'admin-stub', name: 'Priya Sharma', email: 'admin@avan.events', role: 'ADMIN' },
          accessToken: token,
          refreshToken: 'stub-admin-refresh-token',
        },
      },
      onRequest: (path, headers) => {
        if (path === '/admin/dashboard') dashboardAuth = headers.authorization
      },
    })

    await page.goto('/admin/login')
    await fillLogin(page, 'admin@avan.events', 'Admin@12345', () =>
      expect(page).toHaveURL(/\/admin\/dashboard$/, { timeout: 10_000 }),
    )

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem('heptome_admin_token')))
      .toBe(token)
    expect(await page.evaluate(() => window.localStorage.getItem('heptome_admin_refresh_token'))).toBe('stub-admin-refresh-token')

    // The dashboard's data calls carry the admin token, not the customer one.
    await expect.poll(() => dashboardAuth).toBe(`Bearer ${token}`)
  })
})

test.describe('admin route guard', () => {
  test('a customer session cannot open the admin area', async ({ page }) => {
    await seedStorage(page, {
      [CUSTOMER_TOKEN_KEY]: fakeJwt({ id: 'customer-stub', role: 'CUSTOMER', type: 'access' }),
    })

    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/admin\/login$/)
    expect(await page.evaluate(key => window.localStorage.getItem(key), ADMIN_TOKEN_KEY)).toBeNull()
  })

  test('a malformed admin token is discarded', async ({ page }) => {
    await seedStorage(page, { [ADMIN_TOKEN_KEY]: 'not-a-jwt' })

    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/admin\/login$/)
    expect(await page.evaluate(key => window.localStorage.getItem(key), ADMIN_TOKEN_KEY)).toBeNull()
  })

  test('an expired admin token is discarded', async ({ page }) => {
    await seedStorage(page, {
      [ADMIN_TOKEN_KEY]: adminJwt({ exp: Math.floor(Date.now() / 1000) - 60 }),
    })

    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/admin\/login$/)
    expect(await page.evaluate(key => window.localStorage.getItem(key), ADMIN_TOKEN_KEY)).toBeNull()
  })

  test('signing out clears both admin tokens', async ({ page }) => {
    await seedStorage(page, {
      [ADMIN_TOKEN_KEY]: adminJwt(),
      [ADMIN_REFRESH_KEY]: 'stub-admin-refresh-token',
    })
    await stubAdminApi(page)

    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await clickUntil(
      page.getByRole('button', { name: 'Sign out' }),
      () => expect(page).toHaveURL(/\/admin\/login$/, { timeout: 5_000 }),
    )

    const tokens = await page.evaluate(() => ({
      access: window.localStorage.getItem('heptome_admin_token'),
      refresh: window.localStorage.getItem('heptome_admin_refresh_token'),
    }))
    expect(tokens).toEqual({ access: null, refresh: null })
  })
})

test.describe('backend enforcement', () => {
  test('the live API rejects unauthenticated calls, wrong passwords and customer tokens', async ({ request }) => {
    test.skip(!(await apiIsUp(request)), 'backend API is not running')

    // No token at all.
    const anonymous = await request.get(`${API}/admin/dashboard`)
    expect(anonymous.status()).toBe(401)

    // Wrong password on the admin endpoint.
    const badLogin = await request.post(`${API}/auth/admin/login`, {
      data: { email: 'admin@avan.events', password: 'definitely-not-the-password' },
    })
    expect(badLogin.status()).toBe(401)
    expect((await badLogin.json()).error).toBeTruthy()

    // A *validly signed* customer access token is still not an admin token:
    // adminMiddleware requires type `admin_access`, so role is never trusted
    // from the client.
    const customerLogin = await request.post(`${API}/auth/login`, {
      data: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
    })
    if (!customerLogin.ok()) {
      test.skip(true, 'seeded customer account is unavailable in this database')
    }
    const customer = (await customerLogin.json()) as { accessToken: string }

    const crossRole = await request.get(`${API}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customer.accessToken}` },
    })
    expect(crossRole.status()).toBe(401)

    // A forged/tampered token is rejected on signature, not trusted by shape.
    const forged = await request.get(`${API}/admin/bookings`, {
      headers: { Authorization: `Bearer ${fakeJwt({ id: 'forged', role: 'SUPER_ADMIN', type: 'admin_access' })}` },
    })
    expect(forged.status()).toBe(401)
  })
})
