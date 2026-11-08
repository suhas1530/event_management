import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const logs = []
page.on('console', message => {
  if (message.type() === 'error') logs.push(message.text())
})
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const state = await page.evaluate(() => ({
  emailStyle: document.querySelector('#login-email')?.getAttribute('style'),
  passwordStyle: document.querySelector('#login-password')?.getAttribute('style'),
  active: document.activeElement?.id,
  autofill: {
    email: document.querySelector('#login-email')?.matches(':-webkit-autofill'),
    password: document.querySelector('#login-password')?.matches(':-webkit-autofill'),
  },
}))
console.log(JSON.stringify(state, null, 2))
console.log(logs.map(log => log.split('\n')[0]).join('\n') || 'no console errors')
await browser.close()
