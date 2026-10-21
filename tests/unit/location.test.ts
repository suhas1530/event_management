import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_LOCATION,
  LOCATION_AREAS,
  LOCATION_STORAGE_KEY,
  OTHER_CITIES,
  readLocation,
  useLocation,
  writeLocation,
} from '@/lib/location'
import { SERVICE_AREA_NAMES, SUPPORTED_CITY } from '@/lib/service-area'

describe('readLocation', () => {
  it('defaults to the supported city when nothing is stored', () => {
    expect(readLocation()).toEqual(DEFAULT_LOCATION)
    expect(DEFAULT_LOCATION.city).toBe(SUPPORTED_CITY)
    expect(DEFAULT_LOCATION.area).toBe('')
  })

  it('returns a stored location', () => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ city: SUPPORTED_CITY, area: 'Koramangala' }))
    expect(readLocation()).toEqual({ city: SUPPORTED_CITY, area: 'Koramangala' })
  })

  it('survives corrupted storage instead of throwing', () => {
    localStorage.setItem(LOCATION_STORAGE_KEY, '{not json')
    expect(readLocation()).toEqual(DEFAULT_LOCATION)

    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ area: 'Koramangala' }))
    expect(readLocation()).toEqual(DEFAULT_LOCATION)

    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(['Bengaluru']))
    expect(readLocation()).toEqual(DEFAULT_LOCATION)
  })

  it('tolerates a missing area field', () => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ city: SUPPORTED_CITY }))
    expect(readLocation()).toEqual({ city: SUPPORTED_CITY, area: '' })
  })
})

describe('writeLocation', () => {
  it('persists the choice and broadcasts it to the rest of the app', () => {
    const listener = vi.fn()
    window.addEventListener('heptome:location', listener)

    writeLocation({ city: SUPPORTED_CITY, area: 'Whitefield' })

    expect(JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY)!)).toEqual({
      city: SUPPORTED_CITY,
      area: 'Whitefield',
    })
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('heptome:location', listener)
  })
})

describe('useLocation', () => {
  it('starts from storage and updates when another component writes', () => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ city: SUPPORTED_CITY, area: 'Jayanagar' }))
    const { result } = renderHook(() => useLocation())

    expect(result.current.location.area).toBe('Jayanagar')

    act(() => {
      writeLocation({ city: SUPPORTED_CITY, area: 'Hebbal' })
    })

    expect(result.current.location.area).toBe('Hebbal')
  })

  it('exposes the same area list the coverage checker uses', () => {
    expect(LOCATION_AREAS).toEqual(SERVICE_AREA_NAMES)
    expect(OTHER_CITIES.length).toBeGreaterThan(0)
    expect(OTHER_CITIES).not.toContain(SUPPORTED_CITY)
  })
})
