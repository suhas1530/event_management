/**
 * Customer location selection.
 *
 * The chosen location is stored in `localStorage` under one key and shared by
 * the header selector, the home-services landing page and the booking wizard,
 * so a customer never has to type their area twice. Heptome serves a single
 * city today (`lib/service-area.ts`); the selector still lets a customer see
 * what is covered before they start a booking.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { SERVICE_AREA_NAMES, SUPPORTED_CITY } from './service-area'

export const LOCATION_STORAGE_KEY = 'heptome_location'

export interface SelectedLocation {
  city: string
  /** Optional locality inside the city; empty = city-wide. */
  area: string
}

export const DEFAULT_LOCATION: SelectedLocation = { city: SUPPORTED_CITY, area: '' }

/** Cities Heptome does not serve yet — shown so the selector is honest. */
export const OTHER_CITIES = ['Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune'] as const

export const LOCATION_AREAS: string[] = SERVICE_AREA_NAMES

export function readLocation(): SelectedLocation {
  if (typeof window === 'undefined') return DEFAULT_LOCATION
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY)
    if (!raw) return DEFAULT_LOCATION
    const parsed = JSON.parse(raw) as Partial<SelectedLocation>
    if (typeof parsed?.city !== 'string') return DEFAULT_LOCATION
    return { city: parsed.city, area: typeof parsed.area === 'string' ? parsed.area : '' }
  } catch {
    return DEFAULT_LOCATION
  }
}

export function writeLocation(location: SelectedLocation) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
    window.dispatchEvent(new CustomEvent('heptome:location', { detail: location }))
  } catch {
    /* storage disabled — the in-memory value still applies for this session */
  }
}

/** Read + update the customer's saved location. */
export function useLocation() {
  const [location, setLocationState] = useState<SelectedLocation>(DEFAULT_LOCATION)

  useEffect(() => {
    setLocationState(readLocation())
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<SelectedLocation>).detail
      if (detail) setLocationState(detail)
    }
    window.addEventListener('heptome:location', onChange)
    return () => window.removeEventListener('heptome:location', onChange)
  }, [])

  const setLocation = useCallback((next: SelectedLocation) => {
    setLocationState(next)
    writeLocation(next)
  }, [])

  return { location, setLocation }
}
