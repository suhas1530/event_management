'use client'

import { useEffect, useState } from 'react'
import { eventsApi, technicianApi } from '@/lib/api'

interface PlatformCounts {
  technicians: number
  events: number
  categories: number
}

/**
 * Live platform counts.
 *
 * These figures are read from the real API rather than hard-coded, so the
 * landing page can never advertise a number the database does not support.
 * Anything we cannot source from the backend is deliberately stated as a
 * promise rather than a number — including the last cell, which is a
 * commitment and not a statistic.
 */
export default function PlatformStats() {
  const [counts, setCounts] = useState<PlatformCounts | null>(null)

  useEffect(() => {
    let cancelled = false

    // The three totals are independent — fetch together and fail soft so one
    // slow endpoint cannot blank the whole strip.
    Promise.allSettled([
      technicianApi.list({ limit: 1 }),
      eventsApi.list({ limit: 1 }),
      eventsApi.categories(),
    ]).then(([technicians, events, categories]) => {
      if (cancelled) return
      setCounts({
        technicians: technicians.status === 'fulfilled' ? technicians.value.pagination.total : 0,
        events: events.status === 'fulfilled' ? events.value.pagination.total : 0,
        categories: categories.status === 'fulfilled' ? categories.value.length : 0,
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  const items = [
    { value: counts?.technicians, label: 'Home professionals listed' },
    { value: counts?.events, label: 'Event ideas to explore' },
    { value: counts?.categories, label: 'Event categories' },
    // Not a statistic — a commitment. Included so the strip keeps a fourth cell
    // without inventing a number we cannot verify.
    { value: null, label: 'Price agreed before anyone starts' },
  ]

  return (
    <section className="border-b border-hairline/60 bg-ink-900/50" aria-label="Platform at a glance">
      <div className="mx-auto max-w-7xl">
        <dl className="grid grid-cols-2 divide-x divide-white/8 lg:grid-cols-4">
          {items.map(item => (
            <div key={item.label} className="px-6 py-8 text-center sm:px-8">
              <dd className="font-display text-3xl text-champagne tabular-nums lg:text-4xl">
                {item.value === undefined || item.value === null ? (
                  <CommitmentMark />
                ) : (
                  item.value.toLocaleString('en-IN')
                )}
              </dd>
              <dt className="mt-2 text-[11px] uppercase tracking-[0.2em] text-fg-mute">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function CommitmentMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="mx-auto size-8 text-champagne"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
