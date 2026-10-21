'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { bookingsApi } from '@/lib/api'
import type { Booking } from '@/lib/api'
import { CalendarDays, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge, { resolveStatus } from '@/components/shared/StatusBadge'
import { buttonClass } from '@/lib/button-styles'
import { cn } from '@/lib/utils'

/** Labels come from the shared status vocabulary so every screen agrees. */
const labelFor = (status: string) => resolveStatus(status).label

/** Statuses offered as filters — mirrors what /bookings actually accepts. */
const FILTERS = ['', 'REQUESTED', 'QUOTED', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function BookingsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 10 }
    if (filter) params.status = filter
    bookingsApi.list(params).then(res => {
      setBookings(res.data)
      setTotalPages(res.pagination.totalPages)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated, page, filter])

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Your events</p>
            <h1 className="mt-1 font-serif text-4xl text-foreground">Bookings</h1>
          </div>
          <Link href="/events" className={buttonClass('primary', 'md')}>
            Browse events
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter bookings by status">
          {FILTERS.map(s => {
            const active = filter === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => { setFilter(s); setPage(1) }}
                className={cn(
                  'min-h-11 px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-[#d5ae79] text-[#17151d]'
                    : 'border border-border text-muted-foreground hover:border-[#d5ae79] hover:text-gold-text'
                )}
              >
                {s ? labelFor(s) : 'All'}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20" role="status">
            <span className="sr-only">Loading your bookings…</span>
            <Loader2 className="size-8 animate-spin text-gold-text" aria-hidden="true" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={filter ? `No ${labelFor(filter).toLowerCase()} bookings` : 'No bookings yet'}
            description={
              filter
                ? 'Try a different status filter, or clear it to see everything.'
                : 'Once you book an event it will appear here with its quote, payment and timeline.'
            }
            action={filter ? undefined : { label: 'Browse events', href: '/events' }}
            secondaryAction={filter ? { label: 'Clear filter', href: '/bookings' } : undefined}
          />
        ) : (
          <>
            <ul className="divide-y divide-white/8 border border-border" role="list">
              {bookings.map(b => (
                <li key={b.id}>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="group flex items-center gap-4 px-5 py-5 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    {/* Event image */}
                    <div className="size-14 flex-shrink-0 overflow-hidden bg-muted/60">
                      {b.event?.heroImages?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote, user-supplied event imagery
                        <img
                          src={b.event.heroImages[0]}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <CalendarDays className="size-5 text-muted-foreground/80" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{b.event?.title ?? 'Event'}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {b.bookingNumber} ·{' '}
                        {new Date(b.eventDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {b.venue && ` · ${b.venue.name}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/80">{b.guestCount} guests</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={b.status} size="sm" />
                      {b.totalAmount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <ArrowRight
                      className="size-4 flex-shrink-0 text-muted-foreground/80 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gold-text"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Bookings pagination">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="min-h-11 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors duration-200 hover:border-[#d5ae79] hover:text-gold-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" /> Prev
                </button>
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="min-h-11 border border-border px-4 py-2 text-xs text-muted-foreground transition-colors duration-200 hover:border-[#d5ae79] hover:text-gold-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                >
                  Next <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </SiteShell>
  )
}
