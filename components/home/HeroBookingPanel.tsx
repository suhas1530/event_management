'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CalendarHeart, Loader2, Sparkles, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOME_EVENT_TYPES } from '@/lib/home-content'
import { BOOKABLE_HOME_GROUPS } from '@/lib/catalog'
import { checkCoverage } from '@/lib/service-area'
import { readLocation } from '@/lib/location'

export type BookingMode = 'celebration' | 'home'

const fieldClass =
  'w-full min-h-11 rounded-lg border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-subtle-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'

/**
 * Floating booking panel over the hero photography.
 *
 * Both verticals start here. Event selections are handed to the event-request
 * wizard through query params; home-service selections are handed to the
 * technician booking wizard the same way. Nothing is stored locally and no API
 * request fires until the visitor continues — the panel only pre-fills the real
 * forms, so there is exactly one source of truth per booking.
 */
export default function HeroBookingPanel() {
  const router = useRouter()

  const [mode, setMode] = useState<BookingMode>('celebration')
  const [pending, setPending] = useState(false)
  const [eventType, setEventType] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')

  const [category, setCategory] = useState('')
  const [pincode, setPincode] = useState('')
  const [homeDate, setHomeDate] = useState('')
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  function handleEventSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    const params = new URLSearchParams()
    if (eventType) params.set('type', eventType)
    if (date) params.set('date', date)
    if (guests) params.set('guests', guests)
    const query = params.toString()
    router.push(query ? `/plan-event?${query}` : '/plan-event')
  }

  function handleHomeSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!category) {
      setError('Choose the service you need so we can match the right professional.')
      return
    }
    if (!/^[0-9]{6}$/.test(pincode)) {
      setError('Enter a valid 6-digit pincode so we can confirm coverage.')
      return
    }

    const location = readLocation()
    const coverage = checkCoverage({ city: location.city, pincode })
    if (!coverage.supported) {
      setError(coverage.reason ?? 'We do not serve this pincode yet.')
      return
    }

    setPending(true)
    const params = new URLSearchParams({ category, pincode })
    if (homeDate) params.set('date', homeDate)
    router.push(`/book/technician?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface/95 p-5 text-foreground shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl">
      <div
        className="mb-4 grid grid-cols-2 rounded-xl border border-border bg-muted/60 p-1"
        role="tablist"
        aria-label="What would you like to book?"
      >
        {(
          [
            { id: 'celebration' as const, label: 'Event', icon: CalendarHeart },
            { id: 'home' as const, label: 'Home service', icon: Wrench },
          ]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id)
              setError('')
              setPending(false)
            }}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p
          className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-5 text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {mode === 'celebration' ? (
        <form onSubmit={handleEventSubmit} aria-label="Start planning your event">
          <p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-gold-text">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Start your event plan
          </p>

          <div className="flex flex-col gap-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Event type
              </span>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className={fieldClass}>
                <option value="">Any occasion</option>
                {HOME_EVENT_TYPES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Date
                </span>
                <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Guests
                </span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  inputMode="numeric"
                  placeholder="120"
                  value={guests}
                  onChange={e => setGuests(e.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_-10px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {pending ? 'Opening your plan…' : 'Check availability'}
            </button>

            <p className="text-center text-[11px] leading-5 text-muted-foreground">
              Free to start · No payment until you approve a plan
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleHomeSubmit} aria-label="Book a home service">
          <p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-primary">
            <Wrench className="size-3.5" aria-hidden="true" />
            Book at your doorstep
          </p>

          <div className="flex flex-col gap-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Service
              </span>
              <select value={category} onChange={e => setCategory(e.target.value)} className={fieldClass} required>
                <option value="">Choose a service</option>
                {BOOKABLE_HOME_GROUPS.map(group => (
                  <option key={group.id} value={group.bookingCategory}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Pincode
                </span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="560034"
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  className={fieldClass}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Preferred date
                </span>
                <input type="date" min={today} value={homeDate} onChange={e => setHomeDate(e.target.value)} className={fieldClass} />
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {pending ? 'Opening services…' : 'See services & prices'}
            </button>

            <p className="text-center text-[11px] leading-5 text-muted-foreground">
              Prices come from the live service catalog · pay after the work is done
            </p>
          </div>
        </form>
      )}

      <div className="mt-4 border-t border-border-subtle pt-3.5 text-center">
        <Link
          href={mode === 'celebration' ? '/home-services' : '/events'}
          className="text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {mode === 'celebration' ? 'Looking for home services instead?' : 'Planning a celebration instead?'}
        </Link>
      </div>
    </div>
  )
}
