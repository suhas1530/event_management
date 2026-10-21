/**
 * Live price lookup for technician (home-service) booking categories.
 *
 * The platform stores no marketing prices: the only price a customer may see is
 * the one the booking catalogue returns for the selected service. This hook
 * reads the minimum active service price per category, and remembers *why* it
 * has no number so the UI can be honest about it:
 *
 *   number   → cheapest active service in that category
 *   'empty'  → the catalogue has no active service for the category yet
 *   'error'  → the API could not be reached
 *   null     → request in flight
 *
 * Callers must not substitute a fallback price for `null`, `'empty'` or
 * `'error'` — those states exist so a card can offer an enquiry instead of a
 * booking the backend could not fulfil.
 */
'use client'

import { useEffect, useState } from 'react'
import { technicianApi } from './api'

export type CategoryPriceState = number | 'empty' | 'error' | null

export function useCategoryPrices(categories: readonly string[]): Record<string, CategoryPriceState> {
  const [prices, setPrices] = useState<Record<string, CategoryPriceState>>({})
  /** Stable dependency: the caller usually builds its list inline. */
  const key = categories.join(',')

  useEffect(() => {
    const list = key ? key.split(',') : []
    let cancelled = false

    setPrices(Object.fromEntries(list.map(category => [category, null])))

    list.forEach(category => {
      technicianApi
        .servicesByCategory(category)
        .then(services => {
          if (cancelled) return
          const active = services.filter(service => service.isActive !== false)
          const amounts = active
            .map(service => service.basePrice)
            .filter(price => Number.isFinite(price) && price > 0)
          setPrices(current => ({
            ...current,
            [category]: amounts.length === 0 ? 'empty' : Math.min(...amounts),
          }))
        })
        .catch(() => {
          if (cancelled) return
          setPrices(current => ({ ...current, [category]: 'error' }))
        })
    })

    return () => {
      cancelled = true
    }
  }, [key])

  return prices
}
