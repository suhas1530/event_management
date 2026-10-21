# Heptome migration report

**Date:** 21 October 2026  
**Scope:** rebrand to Heptome, the two-vertical product surface, the theme system, admin sign-in, and a regression audit of the public, customer, booking and admin flows.

This report records what changed, what was actually run, and what remains blocked. Counts and results below come from this working tree, not from an earlier revision.

---

## 1. What the product is now

Heptome is one platform with two workflows:

- **Celebrations** — event discovery, venue shortlisting, an event-planning request, quotes, customer approval and event-booking tracking.
- **Home services** — category discovery, live service catalogue, coverage check, slot booking, technician assignment and job tracking.

The home page presents both through a two-zone 3D “living world” (celebration hall and modern home), with a static fallback when WebGL is unavailable. The old brand is gone from rendered pages; seeded login emails still use the legacy `@avan.events` domain and are intentionally documented as demo accounts.

The rebrand preserves sessions: pre-rename `avan_*` localStorage keys are moved to `heptome_*` keys once, rather than logging returning users out.

---

## 2. Theme system

### Architecture

- One provider in `lib/theme-context.tsx`; one switcher in `components/ui/ThemeToggle.tsx`.
- The theme is a `light` / `dark` class and `data-theme` attribute on `<html>`.
- `app/layout.tsx` runs an inline bootstrap before first paint, reading `heptome-theme`; first visits default to dark.
- The visitor’s explicit choice persists across refresh and navigation. There is no third “system” state.
- Storage access is wrapped in `try/catch`; if localStorage is blocked, the theme still changes for that session and persistence degrades quietly.
- Toggle entry points: desktop navbar, mobile drawer, customer/auth pages, admin sign-in and the admin sidebar. The control has an action label (`Switch to light mode` / `Switch to dark mode`), `title`, `aria-pressed`, keyboard focus styling and a visible focus ring.
- The switch applies one short colour cross-fade and removes the transition class afterwards; reduced-motion rules make the switch instant.

### Palette

| Token | Light | Dark |
|---|---|---|
| Page background | `#FAF9F6` | `#100F14` |
| Card | `#FFFFFF` | `#1B1922` |
| Elevated / popover | `#F2EFEA` (`--muted`) | `#24212D` |
| Primary text | `#22212A` | `#F7F5FA` |
| Secondary text | `#73717B` | `#B7B1C2` |
| Accent / primary | `#6D36D8` | `#A78BFA` |
| Border | `#E9E5EE` | `#37313F` |

There are no pure-black (`#000000`) page surfaces. The darkest static cinematic canvas is `#08090D`.

### Cinematic areas

Photography, the 3D scene, the wizards and the static cinematic bands are deliberately not recoloured with the app canvas. A `.immersive` wrapper locally re-points the dark token set so those bands stay visually consistent in both themes:

- home (`/`)
- all-services index (`/services`)
- venue discovery (`/venues`)
- partner landing (`/become-an-event-partner`)

The transparent navbar is scoped to those dark surfaces (`.immersive`), so light-mode navigation text stays legible. On event detail pages the transparent header is used only when a hero image exists, with a top scrim. Other headers use the themed solid surface.

### Screens audited

The automated production sweep covered 32 routes in both themes — 25 public/customer/auth routes and 7 admin routes, 64 screen checks total. It verified the applied theme, body background, toggle presence and absence of opaque-black surfaces:

`/`, `/services`, `/home-services`, `/events`, `/venues`, `/plan-event`, `/book/technician`, `/about`, `/contact`, `/help`, `/careers`, `/terms`, `/privacy`, `/become-a-professional`, `/become-an-event-partner`, `/login`, `/register`, `/forgot-password`, `/ai-event-designer`, `/event-requests`, `/bookings`, `/dashboard`, `/notifications`, `/profile`, `/favorites`, `/admin/login`, `/admin/dashboard`, `/admin/bookings`, `/admin/customers`, `/admin/technicians`, `/admin/event-requests`, `/admin/analytics`.

A separate real-data pass captured the customer event-booking detail (`/bookings/[id]`) and admin event-booking detail (`/admin/bookings/[id]`) in both themes, plus the light mobile drawer. Representative screenshots were also inspected manually for admin analytics, admin technicians, the customer dashboard, event filters, booking detail, admin booking detail and the mobile drawer.

The sweep also caught and drove fixes for:

- hardcoded white text/borders on admin status and period filters, event-request rows, booking timelines and chat panels;
- the customer dashboard’s status chips, DRAFT badge and empty event-request panel;
- the event-request proposal textarea and change/approve controls;
- the events “Filters” and “All” category controls;
- mobile drawer navigation links and the outline CTA;
- the location selector’s active option;
- the shared booking timeline’s inactive dot;
- auth inputs that became white-on-white after switching to light.

---

## 3. Admin sign-in

### Reported failure

The original report was reproduced as a **network failure**, not a credential failure: the frontend API was not running, so the browser received `ERR_CONNECTION_REFUSED`. `apiFetch` treated every thrown fetch as a generic failure and the sign-in UI could read as though the password was wrong.

### Fix

`lib/api.ts` now normalises a failed fetch to:

> Cannot reach the server. Please try again shortly. (`NETWORK_ERROR`)

A real HTTP 401 still surfaces the backend’s error. No auth architecture was rewritten, no error was suppressed and no secret is logged.

### Verified flow

1. **Form → API:** the admin form posts to `/api/v1/auth/admin/login`; the show-password control, loading state, branding and theme toggle remain.
2. **API → database:** the backend verifies the admin record and Argon2id password; inactive admins are rejected.
3. **Role:** the access token is typed `admin_access`. The admin middleware checks that token type, re-reads the admin from the database, requires `isActive`, and allows only `ADMIN` or `SUPER_ADMIN`.
4. **Session:** successful sign-in writes `heptome_admin_token` and `heptome_admin_refresh_token` (and clears pre-rename `avan_admin_*` keys). Sign-out clears both.
5. **Redirect:** the admin reaches `/admin/dashboard`; admin API calls authenticate with the stored token. A customer token cannot open the admin area; malformed/expired admin tokens are discarded.

Live checks: wrong credentials return 401 and issue no token; unauthenticated admin calls are rejected; customer tokens are rejected; valid seeded admins sign in and reach the dashboard. Provisioning is still **seed-only** — a fresh database with no `Admin` row has no first-admin bootstrap flow.

---

## 4. Data truthfulness

The audit deliberately removed invented marketing facts from the earlier build:

- Home-service prices come from the live `TechnicianService` catalogue, never from hardcoded client values.
- When a category has no bookable service, the UI says so and routes the visitor to an enquiry; it does not show a made-up price or rating.
- Venue and event details come from the live API; missing values fall back to “on request”/omission rather than invention.
- The test suite asserts the empty-catalogue and missing-data paths instead of fabricating data.

---

## 5. Verification evidence

Run on 21 October 2026 against this working tree:

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | exit 0 |
| Unit tests | `npm test` | 59/59 passed, 7 files |
| Production build | `npm run build` | exit 0 |
| Browser E2E | `E2E_CHANNEL=chrome npx playwright test` | **62/62 passed** (6.1 min) |
| Production theme sweep | ad-hoc Playwright probe | 64/64 screen checks passed |
| Real-data detail screens | ad-hoc Playwright probe | 2 routes × 2 themes captured; no opaque-black surfaces, no hydration warnings |

E2E uses the installed Chrome channel because the bundled Chromium download failed on this network. The live backend was started with `RATE_LIMIT_MAX=10000` for the definitive run; the default development limit (100 requests/15 min per IP) causes data-dependent tests to skip rather than fail, which is honest but does not exercise them. The rate-limit increase is a test-environment setting only.

The token-migration browser test was hardened after two full-suite runs showed a flaky timeout: it now checks all eight storage keys in one atomic snapshot. It passed 20/20 repeats and then in the full suite.

The earlier theme sweep ran against the production build with Playwright’s screenshot caret handling set to `caret: 'initial'`. Playwright’s default caret hiding injects `caret-color: transparent` into inputs; in dev this produced a false hydration warning that was not present in the app.

---

## 6. Known gaps and blockers

1. **No `TechnicianService` seed rows.** Every home-service category returns an empty catalogue, so a live end-to-end technician booking cannot be completed. The wizard shows the honest empty state; this is the main booking blocker.
2. **No seeded event requests or technician bookings.** The real-data visual pass covered event bookings only. The `/event-requests/[id]` and `/dashboard/booking/[id]` detail screens were not exercised with real records; their shared theme changes are covered by the build and code review, not by a live-data run.
3. **Live event-request submission not run.** It would insert a record into the shared database. The form and API exist, but the final submission path was not exercised against live data.
4. **Technician dashboard not audited.** There is no seeded technician login, so `/technician/dashboard` was not part of the theme sweep or visual pass.
5. **Admin provisioning is seed-only.** There is no first-admin bootstrap screen or CLI; the seeded accounts are required.
6. **Payments are not integrated.** Quote/payment status can be advanced administratively, but there is no gateway, invoice or refund flow.
7. **E2E requires a live backend and installed Chrome.** The suite cannot run as a self-contained CI job until the seed, browser channel and rate limit are provisioned there.
8. **Vercel Analytics is production-only.** In local production runs, analytics requests 404; this is environment noise, not an application failure.

---

## 7. Reproduce

```bash
# Backend (from backend/)
RATE_LIMIT_MAX=10000 npm run dev

# Frontend (repository root)
npm run dev
npm test
npx tsc --noEmit
npm run build
E2E_CHANNEL=chrome npx playwright test
```

PowerShell:

```powershell
$env:RATE_LIMIT_MAX='10000'; npm run dev   # in backend/
$env:E2E_CHANNEL='chrome'; npx playwright test
```

Demo accounts are listed in the root `README.md`. The E2E suite needs the backend at `http://localhost:5000` and the frontend at `http://localhost:3000`; the API's CORS origin is `http://localhost:3000`.
