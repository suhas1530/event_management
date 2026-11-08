import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

/**
 * Theme audit — screenshots plus a computed-style contrast sweep.
 *
 * The contrast probe resolves each text colour against the nearest opaque
 * ancestor background, skips photography-backed text (too many intentional
 * white-on-image treatments to judge mechanically) and reports anything below
 * the WCAG AA threshold for its font size.
 */

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3000'
const OUT = 'test-results/theme-audit'
await fs.mkdir(OUT, { recursive: true })

const ROUTES = [
  '/',
  '/events',
  '/home-services',
  '/services',
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
  '/event-management',
  '/login',
  '/register',
  '/forgot-password',
  '/ai-event-designer',
  '/admin/login',
]

const browser = await chromium.launch({
  channel: 'chrome',
  // Keep third-party extensions out of the audit profile so they cannot
  // mutate form fields before React hydrates and skew the console results.
  args: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const report = { system: {}, routes: [], console: [], mobile: [] }
const consoleErrors = []
page.on('console', message => {
  if (message.type() !== 'error') return
  const text = message.text()
  if (/Failed to load resource|net::ERR|ERR_CONNECTION|WebSocket/i.test(text)) return
  consoleErrors.push({ url: page.url(), text })
})
page.on('pageerror', error => consoleErrors.push({ url: page.url(), text: `pageerror: ${error.message}` }))

/* ── 1. System mode is the first-visit default and follows the OS ────────── */
for (const scheme of ['light', 'dark']) {
  await page.emulateMedia({ colorScheme: scheme })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.removeItem('heptome-theme'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  report.system[scheme] = await page.evaluate(() => ({
    mode: document.documentElement.dataset.themeMode,
    theme: document.documentElement.dataset.theme,
    body: getComputedStyle(document.body).backgroundColor,
  }))
}

const contrastProbe = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  function parse(color) {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = 'rgba(1, 2, 3, 0.123)'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 }
  }

  function luminance({ r, g, b }) {
    const channel = value => {
      const v = value / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  function blend(fg, bg) {
    return {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    }
  }

  function ratio(a, b) {
    const x = luminance(a)
    const y = luminance(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  function backgroundFor(element) {
    const layers = []
    let node = element
    while (node && layers.length < 14) {
      const style = getComputedStyle(node)
      if (style.backgroundImage && style.backgroundImage !== 'none') return null
      const colour = parse(style.backgroundColor)
      if (colour.a > 0.002) layers.push(colour)
      if (colour.a >= 0.999) break
      node = node.parentElement
    }
    let base = layers.length
      ? layers[layers.length - 1]
      : parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base.a < 0.999) base = { ...base, a: 1 }
    let result = base
    for (let i = layers.length - 2; i >= 0; i -= 1) result = blend(layers[i], result)
    return result
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  }

  function photoBacked(element) {
    const rect = element.getBoundingClientRect()
    let node = element
    for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
      for (const image of node.querySelectorAll('img')) {
        const position = getComputedStyle(image).position
        if (position !== 'absolute' && position !== 'fixed') continue
        if (intersects(rect, image.getBoundingClientRect())) return true
      }
    }
    return false
  }

  /**
   * A transparent fixed header sits over the hero photograph. Its contrast is
   * a visual decision (light type over a deliberately dark scrim), not one the
   * nearest opaque ancestor can model, so leave it out of the mechanical probe.
   */
  function transparentHeader(element) {
    const header = element.closest('header')
    if (!header) return false
    const background = parse(getComputedStyle(header).backgroundColor)
    return background.a < 0.35
  }

  function selector(element) {
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const classes =
      typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : ''
    return `${tag}${id}${classes}`
  }

  const failures = []
  const seen = new Set()
  const elements = document.querySelectorAll('body *')

  for (const element of elements) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'PATH'].includes(element.tagName)) continue
    if (element.closest('[aria-hidden="true"], .sr-only')) continue
    const style = getComputedStyle(element)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue
    const rect = element.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) continue
    if (transparentHeader(element) || photoBacked(element)) continue

    const text = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) continue

    const background = backgroundFor(element)
    if (!background) continue
    const foreground = parse(style.color)
    if (foreground.a < 0.05) continue
    const composited = blend(foreground, background)
    const contrast = ratio(composited, background)
    const fontSize = Number.parseFloat(style.fontSize)
    const weight = Number.parseInt(style.fontWeight, 10) || 400
    const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700)
    const required = large ? 3 : 4.5

    if (contrast + 0.05 < required) {
      const key = `${selector(element)}|${text.slice(0, 40)}`
      if (seen.has(key)) continue
      seen.add(key)
      failures.push({
        selector: selector(element),
        text: text.slice(0, 90),
        colour: style.color,
        background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
        contrast: Number(contrast.toFixed(2)),
        required,
        fontSize,
        weight,
      })
    }
  }

  /* Placeholders are text too. */
  for (const input of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    const style = getComputedStyle(input)
    const placeholder = getComputedStyle(input, '::placeholder')
    const rect = input.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1 || photoBacked(input)) continue
    const background = backgroundFor(input)
    if (!background) continue
    const foreground = parse(placeholder.color)
    const contrast = ratio(blend(foreground, background), background)
    if (contrast + 0.05 < 4.5) {
      failures.push({
        selector: `${selector(input)}::placeholder`,
        text: input.getAttribute('placeholder') ?? '',
        colour: placeholder.color,
        background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
        contrast: Number(contrast.toFixed(2)),
        required: 4.5,
        fontSize: Number.parseFloat(style.fontSize),
        weight: 400,
      })
    }
  }

  return {
    failures: failures.slice(0, 80),
    failureCount: failures.length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFg: getComputedStyle(document.body).color,
  }
}

/* ── 2. Every public route, both themes ──────────────────────────────────── */
for (const theme of ['light', 'dark']) {
  await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(value => localStorage.setItem('heptome-theme', value), theme)

  for (const route of ROUTES) {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' }).catch(() => null)
    await page.waitForTimeout(450)
    const probe = await page.evaluate(contrastProbe)
    const record = {
      theme,
      route,
      status: response?.status() ?? null,
      url: page.url(),
      ...probe,
    }
    report.routes.push(record)
    const name = `${theme}${route.replace(/\//g, '_') || '_home'}.png`
    await page.screenshot({
      path: `${OUT}/${name}`,
      fullPage: false,
      animations: 'disabled',
      // Playwright hides the caret by writing an inline style onto every input.
      // In Next.js dev that can land before hydration and produce a false
      // hydration warning, so leave the caret untouched for this audit.
      caret: 'initial',
    })
    console.log(
      theme.padEnd(5),
      route.padEnd(26),
      `contrast:${String(record.failureCount).padStart(2)}`,
      `overflow:${record.overflow}`,
      record.bodyBg,
    )
  }
}

/* ── 3. Responsive smoke test for the densest routes ────────────────────── */
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1366, 1920]
const RESPONSIVE_ROUTES = ['/', '/events', '/home-services', '/plan-event', '/book/technician', '/login']
await page.emulateMedia({ colorScheme: 'light' })
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => localStorage.setItem('heptome-theme', 'light'))

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
  for (const route of RESPONSIVE_ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForTimeout(300)
    const metrics = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const offenders = overflow > 0
        ? Array.from(document.querySelectorAll('body *'))
            .filter(element => {
              const rect = element.getBoundingClientRect()
              return rect.right > document.documentElement.clientWidth + 1 && rect.width > 2
            })
            .slice(0, 6)
            .map(element => {
              const rect = element.getBoundingClientRect()
              return `${element.tagName.toLowerCase()}.${String(element.className).split(/\s+/).slice(0, 2).join('.')} (${Math.round(rect.width)}px)`
            })
        : []
      return { overflow, offenders }
    })
    report.mobile.push({ width, route, ...metrics })
    if (metrics.overflow > 0) console.log('OVERFLOW', width, route, metrics.overflow, metrics.offenders)
  }
  await page.screenshot({
    path: `${OUT}/responsive-${width}-home.png`,
    fullPage: false,
    animations: 'disabled',
    caret: 'initial',
  })
}

report.console = consoleErrors
await fs.writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2))

const totalFailures = report.routes.reduce((sum, route) => sum + route.failureCount, 0)
const failingRoutes = report.routes.filter(route => route.failureCount > 0).length
console.log(`\nSystem mode: ${JSON.stringify(report.system)}`)
console.log(`Contrast failures: ${totalFailures} across ${failingRoutes}/${report.routes.length} route-theme runs`)
console.log(`Console/page errors: ${consoleErrors.length}`)
console.log(`Horizontal overflow runs: ${report.mobile.filter(item => item.overflow > 0).length}`)

await browser.close()
