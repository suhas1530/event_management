import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BOOKABLE_HOME_GROUPS,
  ENQUIRY_HOME_GROUPS,
  ESTIMATE,
  EVENT_SERVICE_CATEGORIES,
  EVENT_TYPE_LINKS,
  GST_RATE,
  HOME_CATALOG,
  PROMO_MODULE_LABELS,
  VISIT_CHARGE,
  estimateHomeServiceTotal,
  homeGroupById,
  homeGroupsByTag,
} from '@/lib/catalog'

const read = (relative: string) => readFileSync(join(process.cwd(), relative), 'utf8')

describe('home catalog', () => {
  it('describes every advertised service line completely', () => {
    for (const group of HOME_CATALOG) {
      expect(group.id, 'id').toMatch(/^[a-z0-9-]+$/)
      expect(group.name.length, `${group.id} name`).toBeGreaterThan(3)
      expect(group.shortName.length, `${group.id} shortName`).toBeGreaterThan(3)
      expect(group.blurb.length, `${group.id} blurb`).toBeGreaterThan(20)
      expect(group.icon, `${group.id} icon`).toBeTruthy()
      expect(group.services.length, `${group.id} services`).toBeGreaterThanOrEqual(3)
      for (const service of group.services) {
        expect(service.name.trim(), `${group.id} service name`).not.toBe('')
      }
    }
  })

  it('keeps ids, names and short names unique', () => {
    const unique = (values: string[]) => new Set(values).size === values.length
    expect(unique(HOME_CATALOG.map(g => g.id))).toBe(true)
    expect(unique(HOME_CATALOG.map(g => g.name))).toBe(true)
    expect(unique(HOME_CATALOG.map(g => g.shortName))).toBe(true)
  })

  it('never stores a price — prices may only come from the API', () => {
    const serialised = JSON.stringify(HOME_CATALOG)
    expect(serialised).not.toMatch(/₹/)
    expect(serialised).not.toMatch(/"price/i)
    expect(serialised).not.toMatch(/basePrice|startingAt|amount/i)
  })

  it('gives every bookable group a distinct booking category', () => {
    const categories = BOOKABLE_HOME_GROUPS.map(g => g.bookingCategory!)
    expect(categories.length).toBeGreaterThan(0)
    expect(new Set(categories).size).toBe(categories.length)
  })

  it('splits the catalog into bookable and enquiry-only groups with nothing lost', () => {
    expect(BOOKABLE_HOME_GROUPS.length + ENQUIRY_HOME_GROUPS.length).toBe(HOME_CATALOG.length)
    expect(BOOKABLE_HOME_GROUPS.every(g => Boolean(g.bookingCategory))).toBe(true)
    expect(ENQUIRY_HOME_GROUPS.every(g => !g.bookingCategory)).toBe(true)
  })

  it('only uses booking categories the API actually accepts', () => {
    const apiSource = read('lib/api.ts')
    const union = apiSource.match(/export type TechnicianCategory =([\s\S]*?);/)?.[1] ?? ''
    const apiCategories = new Set(
      [...union.matchAll(/'([A-Z_]+)'/g)].map(match => match[1])
    )
    expect(apiCategories.size, 'TechnicianCategory union parsed from lib/api.ts').toBeGreaterThan(5)

    for (const group of BOOKABLE_HOME_GROUPS) {
      expect(apiCategories, `${group.id} → ${group.bookingCategory}`).toContain(group.bookingCategory)
    }
  })

  it('supports lookup helpers used by the pages', () => {
    const first = HOME_CATALOG[0]
    expect(homeGroupById(first.id)?.name).toBe(first.name)
    expect(homeGroupById('does-not-exist')).toBeUndefined()

    const popular = homeGroupsByTag('popular')
    expect(popular.length).toBeGreaterThan(0)
    expect(popular.every(group => group.tags.includes('popular'))).toBe(true)
    for (const tag of Object.keys(PROMO_MODULE_LABELS) as Array<keyof typeof PROMO_MODULE_LABELS>) {
      expect(homeGroupsByTag(tag).length, `${tag} module`).toBeGreaterThan(0)
    }
  })
})

describe('event service catalog', () => {
  it('maps every event service to a real step in the plan-event wizard', () => {
    const wizardSource = read('app/plan-event/page.tsx')
    const groupsLiteral = wizardSource.match(/const SERVICE_GROUPS[^=]*=\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    const wizardGroups = new Set(
      [...groupsLiteral.matchAll(/^\s*(?:'([^']+)'|([A-Za-z ]+)):\s*\[/gm)].map(match => match[1] ?? match[2])
    )
    expect(wizardGroups.size, 'SERVICE_GROUPS parsed from the wizard').toBeGreaterThan(3)

    for (const category of EVENT_SERVICE_CATEGORIES) {
      expect(wizardGroups, `${category.id} → ${category.wizardGroup}`).toContain(category.wizardGroup)
    }
  })

  it('keeps event service ids and event type filters unique', () => {
    expect(new Set(EVENT_SERVICE_CATEGORIES.map(c => c.id)).size).toBe(EVENT_SERVICE_CATEGORIES.length)
    expect(new Set(EVENT_TYPE_LINKS.map(t => t.type)).size).toBe(EVENT_TYPE_LINKS.length)
    for (const link of EVENT_TYPE_LINKS) {
      expect(link.label.trim()).not.toBe('')
      expect(link.type).toMatch(/^[A-Z_]+$/)
    }
  })
})

describe('home-service estimate', () => {
  it('matches the server arithmetic (base + visit charge, GST rounded once)', () => {
    const cases = [0, 1, 249, 499, 999, 1499, 2500]
    for (const basePrice of cases) {
      const expectedSubtotal = basePrice + VISIT_CHARGE
      const expectedTax = Math.round(expectedSubtotal * GST_RATE)
      const estimate = estimateHomeServiceTotal(basePrice)
      expect(estimate.subtotal, `subtotal for ₹${basePrice}`).toBe(expectedSubtotal)
      expect(estimate.tax, `tax for ₹${basePrice}`).toBe(expectedTax)
      expect(estimate.total, `total for ₹${basePrice}`).toBe(expectedSubtotal + expectedTax)
    }
  })

  it('keeps the visit charge and tax rate in step with the backend constants', () => {
    const backendSource = read('backend/src/services/technician.ts')
    expect(backendSource).toContain(`const visitCharge = ${VISIT_CHARGE}`)
    expect(backendSource).toContain(`const taxRate = ${GST_RATE}`)
    expect(backendSource).toContain('const subtotal = estimatedPrice + visitCharge')
    expect(backendSource).toContain('const totalAmount = subtotal + taxAmount')
  })

  it('exports a worked example that stays correct', () => {
    // ₹499 service + ₹99 visit = ₹598, 18% GST = ₹108, total ₹706.
    expect(ESTIMATE).toEqual({ basePrice: 499, subtotal: 598, tax: 108, total: 706 })
  })
})
