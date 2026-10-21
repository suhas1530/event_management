import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration.
 *
 * The suite runs against a real `next dev` server on port 3000 because the API
 * only allows that origin (`CORS_ORIGIN` in backend/.env). The Express API at
 * http://localhost:5000 must already be running: the tests use the live
 * catalogue, and one spec skips itself (rather than inventing data) when the
 * API is unreachable.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

/**
 * Playwright's own Chromium is the default. `E2E_CHANNEL=chrome` (or `msedge`)
 * runs the same suite against an *installed* browser instead, which is the
 * fallback when the browser download is unavailable on a network.
 */
const channel = process.env.E2E_CHANNEL

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // A deterministic viewport keeps the header breakpoints honest: `lg` and
    // `xl` are where the nav and the location selector appear.
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: channel ? `channel-${channel}` : 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...(channel ? { channel } : {}) },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
