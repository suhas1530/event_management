/**
 * Final delivery audit.
 *
 * Captures every public surface in both themes at desktop and mobile, measures
 * overflow, broken images, console/page errors, hero behaviour, lab web vitals
 * and axe-core violations. Evidence lands in FINAL_AUDIT_DIR.
 *
 * Usage: node scripts/final-audit.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3000'
const OUT = process.env.FINAL_AUDIT_DIR ?? path.join(process.env.TEMP ?? '.', 'heptome-final-audit')
const AXE = path.join('docs', 'redesign', 'tools', 'axe.min.js')

await fs.mkdir(OUT, { recursive: true })

const PAGES = [
  { route: '/', name: 'home' },
  { route: '/events', name: 'events' },
  { route: '/venues', name: 'venues' },
  { route: '/services', name: 'services' },
  { route: '/home-services', name: 'home-services' },
  { route: '/event-management', name: 'event-management' },
  { route: '/event-design-assistant', name: 'event-design-assistant' },
  { route: '/plan-event', name: 'plan-event' },
  { route: '/book/technician', name: 'book-technician' },
  { route: '/about', name: 'about' },
  { route: '/contact', name: 'contact' },
  { route: '/help', name: 'help' },
  { route: '/careers', name: 'careers' },
  { route: '/terms', name: 'terms' },
  { route: '/privacy', name: 'privacy' },
  { route: '/become-a-professional', name: 'become-a-professional' },
  { route: '/become-an-event-partner', name: 'become-an-event-partner' },
  { route: '/login', name: 'login' },
  { route: '/register', name: 'register' },
  { route: '/forgot-password', name: 'forgot-password' },
  { route: '/ai-event-designer', name: 'ai-event-designer' },
]

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
})

async function makePage(theme, viewport, extra = {}) {
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    deviceScaleFactor: 1,
    reducedMotion: extra.reducedMotion ?? 'no-preference',
  })
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []

  page.on('console', message => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/Failed to load resource|net::ERR|ERR_CONNECTION|WebSocket/i.test(text)) return
    consoleErrors.push(text)
  })
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({ status: response.status(), url: response.url() })
    }
  })

  return { context, page, consoleErrors, pageErrors, failedRequests }
}

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 600) {
    await page.evaluate(value => window.scrollTo(0, value), y)
    await page.waitForTimeout(90)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(350)
}

const PAGE_PROBE = () => {
  const root = document.documentElement
  const visible = element => {
    const style = getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    const rect = element.getBoundingClientRect()
    return rect.width > 1 && rect.height > 1
  }
  const offenders = Array.from(document.querySelectorAll('body *'))
    .filter(element => {
      if (element.closest('[aria-hidden="true"]')) return false
      const style = getComputedStyle(element)
      if (['fixed', 'absolute'].includes(style.position) && element.tagName !== 'SECTION') return false
      const rect = element.getBoundingClientRect()
      return rect.width > 2 && (rect.right > root.clientWidth + 1 || rect.left < -1)
    })
    .slice(0, 8)
    .map(element => {
      const rect = element.getBoundingClientRect()
      return `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 50)} [${Math.round(rect.left)}..${Math.round(rect.right)}]`
    })

  const brokenImages = Array.from(document.images)
    .filter(image => visible(image) && (!image.complete || image.naturalWidth === 0))
    .map(image => image.currentSrc || image.src)

  const headings = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean)
  const h1Count = document.querySelectorAll('h1').length
  const hasMain = Boolean(document.querySelector('main, [role="main"]'))
  const hasHeader = Boolean(document.querySelector('header'))
  const hasFooter = Boolean(document.querySelector('footer, [role="contentinfo"]'))
  const emptyLinks = Array.from(document.querySelectorAll('a')).filter(
    a => !a.getAttribute('href') || a.getAttribute('href') === '#',
  ).length
  const imagesWithoutAlt = Array.from(document.images).filter(
    image => !image.hasAttribute('alt') && visible(image),
  ).length

  return {
    title: document.title,
    h1Count,
    headings,
    hasMain,
    hasHeader,
    hasFooter,
    emptyLinks,
    imagesWithoutAlt,
    overflow: root.scrollWidth - root.clientWidth,
    offenders,
    brokenImages,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFg: getComputedStyle(document.body).color,
  }
}

const pageReports = []

for (const theme of ['light', 'dark']) {
  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    for (const { route, name } of PAGES) {
      const session = await makePage(theme, viewport)
      const { context, page } = session
      let status = null
      try {
        const response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        status = response?.status() ?? null
        await page.waitForTimeout(500)
        await scrollThrough(page)
        const probe = await page.evaluate(PAGE_PROBE)
        await page.screenshot({
          path: path.join(OUT, `${name}--${theme}-${label}.jpg`),
          type: 'jpeg',
          quality: 78,
        })
        pageReports.push({
          theme,
          viewport: label,
          route,
          status,
          finalUrl: page.url(),
          ...probe,
          consoleErrors: [...new Set(session.consoleErrors)].slice(0, 10),
          pageErrors: [...new Set(session.pageErrors)].slice(0, 10),
          failedRequests: session.failedRequests.slice(0, 10),
        })
      } catch (error) {
        pageReports.push({
          theme,
          viewport: label,
          route,
          status,
          error: error.message,
        })
      }
      await context.close()
      console.log(`${theme.padEnd(5)} ${label.padEnd(7)} ${route.padEnd(28)} ${status}`)
    }
  }
}

/* ── Full-page homepage evidence ─────────────────────────────────────────── */
for (const theme of ['light', 'dark']) {
  const { context, page } = await makePage(theme, VIEWPORTS.desktop)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  await scrollThrough(page)
  await page.waitForTimeout(800)
  await page.screenshot({
    path: path.join(OUT, `home--${theme}-full.jpg`),
    type: 'jpeg',
    quality: 72,
    fullPage: true,
  })
  await context.close()
}

/* ── Hero behaviour ──────────────────────────────────────────────────────── */
const heroReport = {}
{
  const session = await makePage('light', VIEWPORTS.desktop)
  const { context, page } = session
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(800)

  heroReport.imageCount = await page.locator('#hero img').count()
  heroReport.slideButtons = await page.getByRole('group', { name: 'Choose a photograph' }).getByRole('button').count()
  heroReport.initialCounter = await page.locator('#hero').getByText('01 / 08', { exact: true }).isVisible()

  const boxBefore = await page.locator('#hero h1').boundingBox()
  await page.waitForTimeout(7000)
  heroReport.autoplayed = await page.locator('#hero').getByText('02 / 08', { exact: true }).isVisible()
  const boxAfter = await page.locator('#hero h1').boundingBox()
  heroReport.copyStable = Boolean(
    boxBefore && boxAfter && Math.abs(boxBefore.x - boxAfter.x) < 1 && Math.abs(boxBefore.y - boxAfter.y) < 1,
  )

  await page.getByRole('button', { name: 'Next photograph' }).click()
  heroReport.nextWorks = await page.locator('#hero').getByText('03 / 08', { exact: true }).isVisible()
  await page.getByRole('button', { name: 'Previous photograph' }).click()
  heroReport.previousWorks = await page.locator('#hero').getByText('02 / 08', { exact: true }).isVisible()

  await page.getByRole('button', { name: 'Pause slideshow' }).click()
  await page.waitForTimeout(6000)
  heroReport.pauseWorks = await page.locator('#hero').getByText('02 / 08', { exact: true }).isVisible()
  await page.getByRole('button', { name: 'Play slideshow' }).click()

  await page.locator('#hero').focus()
  await page.keyboard.press('End')
  heroReport.keyboardEnd = await page.locator('#hero').getByText('08 / 08', { exact: true }).isVisible()
  await page.keyboard.press('Home')
  heroReport.keyboardHome = await page.locator('#hero').getByText('01 / 08', { exact: true }).isVisible()

  const currentSrc = await page.locator('#hero img').nth(0).getAttribute('src')
  heroReport.firstImageSrc = currentSrc

  await context.close()
}
{
  const session = await makePage('light', VIEWPORTS.desktop, { reducedMotion: 'reduce' })
  const { context, page } = session
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(6000)
  heroReport.reducedMotionStopsAutoplay = await page.locator('#hero').getByText('01 / 08', { exact: true }).isVisible()
  await context.close()
}

/* ── Lab vitals ──────────────────────────────────────────────────────────── */
const VITALS = `(() => {
  window.__v = { lcp: 0, cls: 0 }
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__v.lcp = Math.max(window.__v.lcp, e.startTime)
  }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value
  }).observe({ type: 'layout-shift', buffered: true })
})()`

const vitals = {}
for (const [label, viewport] of Object.entries(VIEWPORTS)) {
  const runs = []
  for (let i = 0; i < 2; i += 1) {
    const session = await makePage('light', viewport)
    const { context, page } = session
    await page.addInitScript(VITALS)
    const imageTypes = {}
    page.on('response', response => {
      if (!response.url().includes('/_next/image')) return
      const type = (response.headers()['content-type'] || 'unknown').split(';')[0]
      imageTypes[type] = (imageTypes[type] || 0) + 1
    })
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 90_000 })
    await page.waitForTimeout(1800)
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]
      return {
        lcp: Math.round(window.__v.lcp),
        cls: Number(window.__v.cls.toFixed(4)),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        ttfb: nav ? Math.round(nav.responseStart) : null,
        load: nav ? Math.round(nav.loadEventEnd) : null,
      }
    })
    runs.push({ ...metrics, imageTypes })
    await context.close()
  }
  const median = key => {
    const values = runs.map(run => run[key]).filter(value => typeof value === 'number').sort((a, b) => a - b)
    return values[Math.floor(values.length / 2)] ?? null
  }
  vitals[label] = {
    runs,
    median: { lcp: median('lcp'), cls: median('cls'), fcp: median('fcp'), ttfb: median('ttfb') },
    imageTypes: runs[0].imageTypes,
  }
  console.log('vitals', label, JSON.stringify(vitals[label].median), JSON.stringify(vitals[label].imageTypes))
}

/* ── axe-core ────────────────────────────────────────────────────────────── */
const axeSource = await fs.readFile(AXE, 'utf8')
const axeTargets = [
  { route: '/', theme: 'light', viewport: 'desktop' },
  { route: '/', theme: 'dark', viewport: 'mobile' },
  { route: '/event-management', theme: 'light', viewport: 'desktop' },
  { route: '/home-services', theme: 'dark', viewport: 'desktop' },
  { route: '/plan-event', theme: 'light', viewport: 'desktop' },
  { route: '/book/technician', theme: 'dark', viewport: 'mobile' },
  { route: '/login', theme: 'dark', viewport: 'desktop' },
]
const axeReports = []
for (const target of axeTargets) {
  const session = await makePage(target.theme, VIEWPORTS[target.viewport])
  const { context, page } = session
  await page.goto(BASE + target.route, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  await page.addScriptTag({ content: axeSource })
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
    })
    return result.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      count: violation.nodes.length,
      targets: violation.nodes.slice(0, 4).map(node => node.target.join(' ')),
    }))
  })
  axeReports.push({ ...target, violations })
  console.log('axe', `${target.theme}/${target.viewport}`, target.route, violations.length)
  await context.close()
}

const summary = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  pages: pageReports,
  hero: heroReport,
  vitals,
  axe: axeReports,
}
await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2))

const overflowRuns = pageReports.filter(report => (report.overflow ?? 0) > 1)
const brokenImageRuns = pageReports.filter(report => (report.brokenImages?.length ?? 0) > 0)
const consoleErrorRuns = pageReports.filter(report => (report.consoleErrors?.length ?? 0) > 0)
const pageErrorRuns = pageReports.filter(report => (report.pageErrors?.length ?? 0) > 0)
const axeTypes = axeReports.reduce((sum, report) => sum + report.violations.length, 0)
const axeSerious = axeReports.reduce(
  (sum, report) => sum + report.violations.filter(v => ['serious', 'critical'].includes(v.impact)).length,
  0,
)

console.log('\n=== SUMMARY ===')
console.log('hero', JSON.stringify(heroReport, null, 2))
console.log('overflow runs:', overflowRuns.length, overflowRuns.map(r => `${r.theme}/${r.viewport} ${r.route} ${r.overflow}`))
console.log('broken image runs:', brokenImageRuns.length, brokenImageRuns.map(r => `${r.theme}/${r.viewport} ${r.route}`))
console.log('console error runs:', consoleErrorRuns.length)
for (const run of consoleErrorRuns) console.log('  ', run.theme, run.viewport, run.route, run.consoleErrors)
console.log('page error runs:', pageErrorRuns.length)
for (const run of pageErrorRuns) console.log('  ', run.theme, run.viewport, run.route, run.pageErrors)
console.log('axe violation types:', axeTypes, 'serious/critical types:', axeSerious)
for (const report of axeReports) {
  for (const violation of report.violations) {
    console.log(`  [${violation.impact}] ${report.route} ${violation.id} (${violation.count}): ${violation.targets.join(' | ')}`)
  }
}
console.log('evidence:', OUT)

await browser.close()
