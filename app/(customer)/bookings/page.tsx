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
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Your events</p>
            <h1 className="mt-1 font-serif text-4xl text-white">Bookings</h1>
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
                    ? 'bg-[#d7b98b] text-[#1c1915]'
                    : 'border border-white/15 text-white/50 hover:border-[#d7b98b] hover:text-[#d7b98b]'
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
            <Loader2 className="size-8 animate-spin text-[#d7b98b]" aria-hidden="true" />
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
            <ul className="divide-y divide-white/8 border border-white/10" role="list">
              {bookings.map(b => (
                <li key={b.id}>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="group flex items-center gap-4 px-5 py-5 transition-colors duration-200 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    {/* Event image */}
                    <div className="size-14 flex-shrink-0 overflow-hidden bg-white/8">
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
                          <CalendarDays className="size-5 text-white/20" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{b.event?.title ?? 'Event'}</p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {b.bookingNumber} ·{' '}
                        {new Date(b.eventDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {b.venue && ` · ${b.venue.name}`}
                      </p>
                      <p className="mt-0.5 text-xs text-white/30">{b.guestCount} guests</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={b.status} size="sm" />
                      {b.totalAmount > 0 && (
                        <span className="text-xs text-white/40">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <ArrowRight
                      className="size-4 flex-shrink-0 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#d7b98b]"
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
                  className="min-h-11 border border-white/15 px-4 py-2 text-xs text-white/60 transition-colors duration-200 hover:border-[#d7b98b] hover:text-[#d7b98b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-white/60"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" /> Prev
                </button>
                <span className="text-xs text-white/40" aria-live="polite">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="min-h-11 border border-white/15 px-4 py-2 text-xs text-white/60 transition-colors duration-200 hover:border-[#d7b98b] hover:text-[#d7b98b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-white/60"
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
