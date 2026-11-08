'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEFAULT_LOCATION,
  LOCATION_AREAS,
  OTHER_CITIES,
  useLocation,
  type SelectedLocation,
} from '@/lib/location'
import { SUPPORTED_CITY } from '@/lib/service-area'

/**
 * Where the customer is.
 *
 * Heptome serves one city for doorstep services today, so the selector does two
 * jobs: it stores the customer's area for prefill, and it tells the truth about
 * coverage *before* someone starts a booking they cannot finish (an unserved
 * city is labelled "coming soon" rather than offered).
 */

interface LocationListProps {
  location: SelectedLocation
  onSelect: (next: SelectedLocation) => void
  /** `flat` drops the outer frame — used inside the mobile drawer. */
  variant?: 'panel' | 'flat'
}

export function LocationList({ location, onSelect, variant = 'panel' }: LocationListProps) {
  const optionClass = (active: boolean) =>
    cn(
      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none',
      active
        ? 'bg-primary/15 text-foreground'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:bg-muted/60'
    )

  return (
    <div className={cn(variant === 'panel' && 'border border-border bg-popover')}>
      <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Doorstep services
      </p>

      <div className="p-1.5" role="menu" aria-label="Service area">
        <button
          type="button"
          role="menuitemradio"
          aria-checked={location.city === SUPPORTED_CITY && location.area === ''}
          onClick={() => onSelect({ ...DEFAULT_LOCATION })}
          className={optionClass(location.city === SUPPORTED_CITY && location.area === '')}
        >
          <span>
            All of {SUPPORTED_CITY}
            <span className="ml-2 text-[11px] text-muted-foreground">city-wide</span>
          </span>
          {location.city === SUPPORTED_CITY && location.area === '' && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
        </button>

        {LOCATION_AREAS.map(area => {
          const active = location.city === SUPPORTED_CITY && location.area === area
          return (
            <button
              key={area}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              onClick={() => onSelect({ city: SUPPORTED_CITY, area })}
              className={optionClass(active)}
            >
              {area}
              {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <div className="border-t border-border-subtle px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Not available yet</p>
        <ul className="mt-2 space-y-1.5" role="list">
          {OTHER_CITIES.map(city => (
            <li key={city} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              {city}
              <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Event partners are booked across India — only doorstep home services are limited to {SUPPORTED_CITY}.
        </p>
      </div>
    </div>
  )
}

interface LocationSelectorProps {
  className?: string
}

export default function LocationSelector({ className }: LocationSelectorProps) {
  const { location, setLocation } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = location.area || location.city

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex max-w-[13rem] items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[0.8125rem] text-foreground/90 transition-colors duration-200 hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">
          <span className="sr-only">Selected location: </span>
          {label}
        </span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[var(--z-popover)] mt-2 w-72 animate-scale-in">
          <LocationList
            location={location}
            onSelect={next => {
              setLocation(next)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
