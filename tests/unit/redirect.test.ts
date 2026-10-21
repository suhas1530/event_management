import { describe, expect, it } from 'vitest'
import { readRedirectParam, safeRedirect } from '@/lib/redirect'

describe('safeRedirect', () => {
  it('accepts same-origin relative paths, including query strings', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard')
    expect(safeRedirect('/book/technician?category=AC_SERVICE&pincode=560034')).toBe(
      '/book/technician?category=AC_SERVICE&pincode=560034'
    )
    expect(safeRedirect('/dashboard?tab=home')).toBe('/dashboard?tab=home')
  })

  it('rejects everything that could leave the site', () => {
    expect(safeRedirect('//evil.example/login')).toBeNull()
    expect(safeRedirect('https://evil.example')).toBeNull()
    expect(safeRedirect('http://evil.example')).toBeNull()
    expect(safeRedirect('javascript:alert(1)')).toBeNull()
    expect(safeRedirect('/\\evil.example')).toBeNull()
    expect(safeRedirect('dashboard')).toBeNull()
    expect(safeRedirect('')).toBeNull()
    expect(safeRedirect(null)).toBeNull()
    expect(safeRedirect(undefined)).toBeNull()
  })
})

describe('readRedirectParam', () => {
  it('prefers `redirect` over `next`', () => {
    expect(readRedirectParam('?redirect=/book/technician&next=/dashboard')).toBe('/book/technician')
  })

  it('falls back to `next` when `redirect` is absent', () => {
    expect(readRedirectParam('?next=/plan-event')).toBe('/plan-event')
  })

  it('ignores unsafe values in both params', () => {
    expect(readRedirectParam('?redirect=https://evil.example')).toBeNull()
    expect(readRedirectParam('?next=//evil.example')).toBeNull()
    expect(readRedirectParam('')).toBeNull()
  })
})
