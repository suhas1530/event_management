import { describe, expect, it } from 'vitest'
import {
  SERVICE_AREAS,
  SERVICE_AREA_NAMES,
  SUPPORTED_CITY,
  UNSUPPORTED_PINCODES,
  checkCoverage,
} from '@/lib/service-area'

describe('service coverage', () => {
  it('accepts a pincode inside a served locality', () => {
    const result = checkCoverage({ city: 'Bengaluru', pincode: '560001' })
    expect(result.supported).toBe(true)
    expect(result.area?.name).toBe('Central Bengaluru')
  })

  it('matches the city case-insensitively and tolerates whitespace', () => {
    expect(checkCoverage({ city: '  bengaluru ', pincode: ' 560034 ' }).supported).toBe(true)
    // City is optional: the pincode alone is enough evidence of coverage.
    expect(checkCoverage({ pincode: '560034' }).supported).toBe(true)
  })

  it('rejects a malformed pincode with a reason the customer can act on', () => {
    for (const pincode of ['', '12345', '56001a', '5600345']) {
      const result = checkCoverage({ city: SUPPORTED_CITY, pincode })
      expect(result.supported, pincode || '(empty)').toBe(false)
      expect(result.reason).toMatch(/6-digit pincode/i)
    }
  })

  it('explains explicitly excluded pincodes', () => {
    const [pincode, reason] = Object.entries(UNSUPPORTED_PINCODES)[0]
    const result = checkCoverage({ city: SUPPORTED_CITY, pincode })
    expect(result.supported).toBe(false)
    expect(result.reason).toBe(reason)
  })

  it('refuses a city Heptome does not serve yet', () => {
    const result = checkCoverage({ city: 'Mumbai', pincode: '400001' })
    expect(result.supported).toBe(false)
    expect(result.reason).toContain(SUPPORTED_CITY)
  })

  it('refuses a Bengaluru pincode with no partner coverage', () => {
    const result = checkCoverage({ city: SUPPORTED_CITY, pincode: '560999' })
    expect(result.supported).toBe(false)
    expect(result.area).toBeUndefined()
    expect(result.reason).toContain('560999')
  })

  it('keeps the area table consistent', () => {
    expect(SERVICE_AREAS.length).toBeGreaterThan(0)
    for (const area of SERVICE_AREAS) {
      expect(area.city).toBe(SUPPORTED_CITY)
      expect(area.pincodePrefixes.length).toBeGreaterThan(0)
      for (const prefix of area.pincodePrefixes) {
        expect(prefix, `${area.name} pincode`).toMatch(/^[0-9]{6}$/)
      }
    }
    expect(new Set(SERVICE_AREA_NAMES).size).toBe(SERVICE_AREA_NAMES.length)
    // Every advertised pincode must actually resolve, otherwise the coverage
    // table promises an area the checker would reject.
    for (const area of SERVICE_AREAS) {
      for (const pincode of area.pincodePrefixes) {
        expect(checkCoverage({ city: SUPPORTED_CITY, pincode }).supported, pincode).toBe(true)
      }
    }
  })
})
