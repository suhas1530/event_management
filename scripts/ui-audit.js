/**
 * Redesign evidence audit.
 *
 * Runs against a production `next start` server on port 3000 and produces:
 *   1. screenshots of every key page in both themes at desktop + mobile
 *   2. measured lab web vitals (LCP, CLS, INP proxy from event timing)
 *   3. axe-core accessibility scans in both themes
 *
 * Usage:  node scripts/ui-audit.js   (server must already be running)
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000'
const SHOT_DIR = path.join('docs', 'redesign', 'screenshots')
/* Vendored locally: the browser sandbox in this environment cannot reach the CDN. */
const AXE_SOURCE = process.env.AXE_PATH ?? path.join('docs', 'redesign', 'tools', 'axe.min.js')

const PAGES = [
  { route: '/', name: 'home' },
  { route: '/event-management', name: 'event-management' },
  { route: '/home-services', name: 'home-services' },
  { route: '/event-design-assistant', name: 'ai-design-assistant' },
  { route: '/plan-event', name: 'plan-event' },
  { route: '/book/technician', name: 'book-technician' },
  { route: '/login', name: 'login' },
  { route: '/contact', name: 'contact' },
]

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

fs.mkdirSync(SHOT_DIR, { recursive: true })

async function newPage(browser, theme, viewport) {
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  return { context, page }
}

async function settle(page, ms = 900) {
  await page.waitForLoadState('domcontentloaded')
  // give the hero image / fonts a moment so screenshots are not mid-paint
  await page.waitForTimeout(ms)
}

/* ------------------------------------------------------------------ */
/* 1. screenshots                                                      */
/* ------------------------------------------------------------------ */
async function captureScreenshots(browser) {
  const captured = []
  for (const { route, name } of PAGES) {
    for (const theme of ['light', 'dark']) {
      for (const [label, viewport] of Object.entries(VIEWPORTS)) {
        const { context, page } = await newPage(browser, theme, viewport)
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await settle(page)
        const file = path.join(SHOT_DIR, `${name}--${theme}-${label}.jpg`)
        await page.screenshot({ path: file, type: 'jpeg', quality: 72 })
        captured.push(file)
        await context.close()
      }
    }
  }
  // one full-page capture of the homepage in each theme, for the full story
  for (const theme of ['light', 'dark']) {
    const { context, page } = await newPage(browser, theme, VIEWPORTS.desktop)
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await settle(page, 1400)
    const file = path.join(SHOT_DIR, `home--${theme}-desktop-fullpage.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality: 70, fullPage: true })
    captured.push(file)
    await context.close()
  }
  return captured
}

/* ------------------------------------------------------------------ */
/* 2. measured web vitals                                              */
/* ------------------------------------------------------------------ */
const VITALS_INIT = `(() => {
  window.__vitals = { lcp: 0, cls: 0, events: [], paints: {}, images: {} }
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__vitals.lcp = Math.max(window.__vitals.lcp, e.startTime)
  }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value
  }).observe({ type: 'layout-shift', buffered: true })
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.interactionId) {
        window.__vitals.events.push({ name: e.name, duration: e.duration, start: e.startTime })
      }
    }
  }).observe({ type: 'event', buffered: true, durationThreshold: 16 })
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__vitals.paints[e.name] = Math.round(e.startTime)
  }).observe({ type: 'paint', buffered: true })
})()`

async function measureRun(browser, viewport, theme) {
  const { context, page } = await newPage(browser, theme, viewport)
  await page.addInitScript(VITALS_INIT)

  const imageStats = {}
  page.on('response', async response => {
    const url = response.url()
    if (!url.includes('/_next/image')) return
    const type = (response.headers()['content-type'] || 'unknown').split(';')[0]
    imageStats[type] = (imageStats[type] || 0) + 1
  })

  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 90_000 })
  await page.waitForTimeout(1200)

  // interaction 1 — hero "next story"
  await page.getByRole('button', { name: 'Next story' }).click()
  await page.waitForTimeout(700)

  // interaction 2 — mobile: open the drawer; desktop: open the partners menu
  if (viewport.width < 1024) {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.waitForTimeout(500)
    await page.keyboard.press('Escape')
  } else {
    await page.getByRole('button', { name: 'Partners' }).click()
    await page.waitForTimeout(500)
    await page.keyboard.press('Escape')
  }
  await page.waitForTimeout(900)

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const durations = window.__vitals.events.map(e => e.duration)
    return {
      lcp: Math.round(window.__vitals.lcp),
      cls: Number(window.__vitals.cls.toFixed(4)),
      inpProxy: Math.round(Math.max(0, ...durations)),
      fcp: window.__vitals.paints['first-contentful-paint'] ?? null,
      ttfb: nav ? Math.round(nav.responseStart) : null,
      load: nav ? Math.round(nav.loadEventEnd) : null,
      events: window.__vitals.events.map(e => ({ name: e.name, duration: Math.round(e.duration) })),
    }
  })
  metrics.images = imageStats
  await context.close()
  return metrics
}

const median = values => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function measureVitals(browser) {
  const report = {}
  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    const runs = []
    for (let i = 0; i < 3; i += 1) runs.push(await measureRun(browser, viewport, 'light'))
    report[label] = {
      runs,
      median: {
        lcp: median(runs.map(r => r.lcp)),
        cls: median(runs.map(r => r.cls)),
        inpProxy: median(runs.map(r => r.inpProxy)),
        fcp: median(runs.map(r => r.fcp)),
        ttfb: median(runs.map(r => r.ttfb)),
      },
      imageContentTypes: runs[0].images,
    }
  }
  return report
}

/* ------------------------------------------------------------------ */
/* 3. axe-core accessibility                                           */
/* ------------------------------------------------------------------ */
const AXE_PAGES = [
  { route: '/', theme: 'light', viewport: 'desktop' },
  { route: '/', theme: 'dark', viewport: 'mobile' },
  { route: '/event-management', theme: 'light', viewport: 'desktop' },
  { route: '/home-services', theme: 'dark', viewport: 'desktop' },
  { route: '/event-design-assistant', theme: 'light', viewport: 'desktop' },
  { route: '/plan-event', theme: 'dark', viewport: 'desktop' },
  { route: '/book/technician', theme: 'light', viewport: 'mobile' },
  { route: '/login', theme: 'dark', viewport: 'desktop' },
]

async function runAxe(browser) {
  if (!fs.existsSync(AXE_SOURCE)) {
    console.warn(`axe: source not found at ${AXE_SOURCE}, skipping accessibility scans`)
    return []
  }
  const axeSource = fs.readFileSync(AXE_SOURCE, 'utf8')
  const results = []
  for (const spec of AXE_PAGES) {
    const { context, page } = await newPage(browser, spec.theme, VIEWPORTS[spec.viewport])
    await page.goto(BASE + spec.route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await settle(page, 1100)
    await page.addScriptTag({ content: axeSource })
    const scan = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const res = await axe.run(document, {
        resultTypes: ['violations'],
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
      })
      return res.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 5).map(n => n.target.join(' ')),
        count: v.nodes.length,
      }))
    })
    results.push({ ...spec, violations: scan })
    await context.close()
  }
  return results
}

;(async () => {
  const browser = await chromium.launch({ channel: 'chrome' })

  const screenshots = await captureScreenshots(browser)
  console.log(`screenshots: ${screenshots.length} files in ${SHOT_DIR}`)

  const vitals = await measureVitals(browser)
  console.log('measured vitals:')
  for (const [label, data] of Object.entries(vitals)) {
    console.log(
      `  ${label}: LCP ${data.median.lcp}ms | CLS ${data.median.cls} | INP(proxy) ${data.median.inpProxy}ms | FCP ${data.median.fcp}ms | TTFB ${data.median.ttfb}ms`,
    )
    console.log(`  ${label}: next/image responses by type: ${JSON.stringify(data.imageContentTypes)}`)
  }

  const axe = await runAxe(browser)
  let total = 0
  for (const r of axe) {
    const serious = r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    total += r.violations.length
    console.log(`axe ${r.theme}/${r.viewport} ${r.route}: ${r.violations.length} violation types (${serious.length} serious/critical)`)
    for (const v of r.violations) console.log(`   - [${v.impact}] ${v.id} (${v.count} nodes): ${v.help}`)
  }
  console.log(`axe total violation types across scans: ${total}`)

  fs.writeFileSync(
    path.join('docs', 'redesign', 'ui-audit.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, vitals, axe, screenshots }, null, 2),
  )
  console.log('wrote docs/redesign/ui-audit.json')

  await browser.close()
})().catch(error => {
  console.error(error)
  process.exit(1)
})
