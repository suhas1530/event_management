import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const out = 'test-results/theme-audit'
await fs.mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const routes = ['/', '/events', '/home-services', '/services', '/venues', '/plan-event', '/ai-event-designer', '/login', '/admin/login', '/dashboard', '/about', '/contact']
for (const theme of ['light', 'dark']) {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(t => localStorage.setItem('heptome-theme', t), theme)
  for (const route of routes) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(400)
    const name = `${theme}${route.replace(/\//g, '_') || '_home'}.png`
    await page.screenshot({ path: `${out}/${name}`, fullPage: route === '/' })
    const probe = await page.evaluate(() => {
      const body = getComputedStyle(document.body)
      const html = document.documentElement
      const heading = document.querySelector('h1')
      const input = document.querySelector('input:not([type=hidden])')
      return {
        theme: html.dataset.theme,
        bg: body.backgroundColor,
        fg: body.color,
        headingColor: heading ? getComputedStyle(heading).color : null,
        inputBg: input ? getComputedStyle(input).backgroundColor : null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }
    })
    console.log(theme, route, JSON.stringify(probe))
  }
}
await browser.close()
