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
  tone?: 'dark' | 'light'
  /** `flat` drops the outer frame — used inside the mobile drawer. */
  variant?: 'panel' | 'flat'
}

export function LocationList({ location, onSelect, tone = 'dark', variant = 'panel' }: LocationListProps) {
  const light = tone === 'light'
  const optionClass = (active: boolean) =>
    cn(
      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none',
      light
        ? active
          ? 'bg-hept-lavender text-hept-charcoal'
          : 'text-muted-foreground hover:bg-hept-lavender/60 hover:text-hept-charcoal focus-visible:bg-hept-lavender/60'
        : active
          ? 'bg-primary/15 text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:bg-muted/60'
    )

  return (
    <div className={cn(variant === 'panel' && (light ? 'border border-hept-line bg-card' : 'border border-border bg-popover'))}>
      <p
        className={cn(
          'px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.18em]',
          light ? 'text-[#77737f]' : 'text-muted-foreground/80'
        )}
      >
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
            <span className={cn('ml-2 text-[11px]', light ? 'text-[#77737f]' : 'text-muted-foreground/80')}>city-wide</span>
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

      <div className={cn('border-t px-3 py-3', light ? 'border-hept-line' : 'border-border-subtle')}>
        <p className={cn('text-[10px] uppercase tracking-[0.18em]', light ? 'text-[#77737f]' : 'text-muted-foreground/80')}>
          Not available yet
        </p>
        <ul className="mt-2 space-y-1.5" role="list">
          {OTHER_CITIES.map(city => (
            <li
              key={city}
              className={cn('flex items-center gap-2 text-sm', light ? 'text-[#77737f]' : 'text-muted-foreground/80')}
            >
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              {city}
              <span className={cn('ml-auto text-[10px] uppercase tracking-[0.12em]', light ? 'text-[#a09ba8]' : 'text-muted-foreground/80')}>
                Coming soon
              </span>
            </li>
          ))}
        </ul>
        <p className={cn('mt-3 text-xs leading-5', light ? 'text-muted-foreground' : 'text-muted-foreground/80')}>
          Event partners are booked across India — only doorstep home services are limited to {SUPPORTED_CITY}.
        </p>
      </div>
    </div>
  )
}

interface LocationSelectorProps {
  /** `chrome` = dark header bar, `light` = ivory surface. */
  tone?: 'dark' | 'light'
  className?: string
}

export default function LocationSelector({ tone = 'dark', className }: LocationSelectorProps) {
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

  const light = tone === 'light'
  const label = location.area || location.city

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex max-w-[13rem] items-center gap-2 rounded-lg border px-3 py-2 text-[0.8125rem] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          light
            ? 'border-hept-line bg-card text-muted-foreground hover:border-hept-purple/40 hover:text-hept-charcoal'
            : 'border-border bg-muted/50 text-foreground/90 hover:border-primary/40 hover:text-foreground'
        )}
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
            tone={tone}
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
