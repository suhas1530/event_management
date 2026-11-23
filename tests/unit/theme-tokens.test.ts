import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The premium Warm Ivory / Midnight Premium palette is a contract: every
 * utility, module and inline style reads these semantic tokens. Pinning them
 * here stops a stray bright-white card or off-brand accent from creeping back
 * into one theme while the other still looks correct.
 */

const cssPath = resolve(process.cwd(), 'app/globals.css')
const css = readFileSync(cssPath, 'utf8')

function section(start: string): string {
  const from = css.indexOf(start)
  expect(from, `missing ${start}`).toBeGreaterThan(-1)
  const end = css.indexOf('\n}', from)
  expect(end, `unterminated ${start}`).toBeGreaterThan(from)
  return css.slice(from, end)
}

const light = section(':root {')
const dark = section('\n.dark {')

function token(block: string, name: string): string {
  const match = block.match(new RegExp(`\\s${name}:\\s*([^;]+);`))
  expect(match, `missing token ${name}`).not.toBeNull()
  return match![1].trim().toLowerCase()
}

const LIGHT_PALETTE: Record<string, string> = {
  background: '#f8f6f2',
  foreground: '#25251f',
  surface: '#ffffff',
  'surface-elevated': '#ffffff',
  'surface-secondary': '#f0ece5',
  border: '#e6e1d8',
  input: '#ffffff',
  primary: '#283b32',
  'primary-foreground': '#ffffff',
  secondary: '#f0ece5',
  accent: '#b99b69',
  'accent-foreground': '#25251f',
  muted: '#f0ece5',
  'muted-foreground': '#68645d',
  card: '#ffffff',
  'card-foreground': '#25251f',
  success: '#26734d',
  warning: '#a66a20',
  destructive: '#b64040',
}

const DARK_PALETTE: Record<string, string> = {
  background: '#171b19',
  foreground: '#f4f0e8',
  surface: '#202622',
  'surface-elevated': '#272f2a',
  'surface-secondary': '#272f2a',
  border: '#353e37',
  input: '#222923',
  primary: '#a9bca9',
  'primary-foreground': '#171b19',
  secondary: '#272f2a',
  accent: '#c5a878',
  'accent-foreground': '#171b19',
  muted: '#272f2a',
  'muted-foreground': '#c0c1b9',
  card: '#202622',
  'card-foreground': '#f4f0e8',
  success: '#78b991',
  warning: '#d9ad6b',
  destructive: '#e58a82',
}

describe('semantic theme tokens', () => {
  it('maps the full warm-ivory palette in :root', () => {
    for (const [name, expected] of Object.entries(LIGHT_PALETTE)) {
      expect(token(light, `--${name}`), `--${name}`).toBe(expected)
    }
  })

  it('maps the full midnight-premium palette in .dark', () => {
    for (const [name, expected] of Object.entries(DARK_PALETTE)) {
      expect(token(dark, `--${name}`), `--${name}`).toBe(expected)
    }
  })

  it('keeps every theme on its own colour scheme and never mixes the two', () => {
    expect(light).toContain('color-scheme: light')
    expect(dark).toContain('color-scheme: dark')
    expect(token(light, '--background')).not.toBe(token(dark, '--background'))
    expect(token(light, '--card')).not.toBe(token(dark, '--card'))
  })

  it('exposes display and brand faces without a conflicting font system', () => {
    expect(css).toContain('--font-display: var(--font-manrope)')
    expect(css).toContain('--font-brand: var(--font-space)')
    expect(css).toContain('--font-sans: var(--font-inter)')
  })
})

/** WCAG 2.1 relative luminance / contrast ratio. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

describe('token contrast', () => {
  const pairs: Array<[string, string, string]> = [
    ['light body / canvas', '#25251f', '#f8f6f2'],
    ['light secondary / canvas', '#68645d', '#f8f6f2'],
    ['light secondary / card', '#68645d', '#ffffff'],
    ['light subtle / card', '#6f6b62', '#ffffff'],
    ['light primary button', '#ffffff', '#283b32'],
    ['light champagne text / card', '#7a5f2e', '#ffffff'],
    ['dark body / canvas', '#f4f0e8', '#171b19'],
    ['dark secondary / card', '#c0c1b9', '#202622'],
    ['dark muted / card', '#92978f', '#202622'],
    ['dark primary button', '#171b19', '#a9bca9'],
    ['dark champagne text / card', '#dcc18c', '#202622'],
  ]

  it.each(pairs)('%s clears WCAG AA for normal text', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })
})
