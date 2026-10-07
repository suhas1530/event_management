'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  IndianRupee,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import StatusBadge from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/Primitives'
import { Skeleton } from '@/components/ui/Skeleton'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'

type Period = '7d' | '30d' | '90d' | '12m'

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
]

interface RevenuePoint {
  date: string
  amount: number
}

interface BookingAnalytics {
  byStatus: Array<{ status: string; count: number }>
  byEventType: Array<{ type: string; count: number }>
  recentBookings: import('@/lib/api').Booking[]
}

function money(n: number) {
  return `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`
}

/** Compact axis label — the chart only needs enough to orient the reader. */
function axisLabel(value: string, period: Period) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  if (period === '12m') return d.toLocaleDateString('en-IN', { month: 'short' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/**
 * Revenue and booking analytics.
 *
 * Every figure here comes from the live `/admin/analytics/*` endpoints — this
 * page deliberately contains no hard-coded numbers.
 */
export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [bookings, setBookings] = useState<BookingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [r, b] = await Promise.all([adminApi.revenueAnalytics(period), adminApi.bookingAnalytics()])
      setRevenue(r)
      setBookings(b)
    } catch (err) {
      setError((err as { error?: string })?.error ?? 'We could not load analytics.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void load()
  }, [load])

  const { peak, total } = useMemo(() => {
    const sum = revenue.reduce((acc, p) => acc + (p.amount ?? 0), 0)
    return { peak: Math.max(...revenue.map(p => p.amount), 1), total: sum }
  }, [revenue])

  const statusMax = Math.max(...(bookings?.byStatus.map(s => s.count) ?? [1]), 1)
  const typeMax = Math.max(...(bookings?.byEventType.map(t => t.count) ?? [1]), 1)

  /** Move the period control into the header without duplicating PageHeader. */
  const periodControl = (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-1"
      role="group"
      aria-label="Reporting period"
    >
      {PERIODS.map(p => {
        const active = p.key === period
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            aria-pressed={active}
            className={cn(
              'min-h-9 rounded-md px-3 text-[0.8125rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-primary/12 text-primary ring-1 ring-inset ring-primary/30' : 'text-white/45 hover:text-white'
            )}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs text-white/45 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Dashboard
        </Link>
        <PageHeader
          eyebrow="Insights"
          title="Analytics"
          description="Revenue and booking performance, straight from the database."
          className="mt-4"
          actions={periodControl}
        />
      </div>

      {error ? (
        <ErrorState
          title="We couldn't load analytics."
          description={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <div className="space-y-6" role="list" aria-label="Loading analytics">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map(i => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-8 w-32" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-6 h-48 w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <p className="flex items-center gap-2 text-label text-white/40">
                <IndianRupee className="size-4 text-primary" aria-hidden="true" />
                Revenue ({PERIODS.find(p => p.key === period)?.label.toLowerCase()})
              </p>
              <p className="mt-3 font-serif text-3xl text-white tabular-nums">{money(total)}</p>
            </article>
            <article className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <p className="flex items-center gap-2 text-label text-white/40">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                Bookings recorded
              </p>
              <p className="mt-3 font-serif text-3xl text-white tabular-nums">
                {(bookings?.byStatus ?? []).reduce((sum, s) => sum + s.count, 0).toLocaleString('en-IN')}
              </p>
            </article>
          </div>

          {/* Revenue chart */}
          <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-medium text-white/90">
                <BarChart3 className="size-[18px] text-primary" aria-hidden="true" />
                Revenue over time
              </h2>
              <p className="text-xs text-white/35">Peak {money(peak)}</p>
            </div>

            {revenue.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={TrendingUp}
                  title="No revenue in this period"
                  description="Once bookings are confirmed and paid, revenue will plot here."
                />
              </div>
            ) : (
              <>
                {/* Bars. Each is a labelled list item so the data is available
                    to assistive tech, not only as a visual chart. */}
                <ul className="mt-6 flex h-48 items-end gap-1.5" role="list" aria-label="Revenue by period">
                  {revenue.map(point => {
                    const pct = Math.max((point.amount / peak) * 100, point.amount > 0 ? 2 : 0)
                    return (
                      <li key={point.date} className="group relative flex h-full flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-primary/25 transition-colors duration-200 group-hover:bg-primary/50"
                          style={{ height: `${pct}%` }}
                          title={`${axisLabel(point.date, period)} — ${money(point.amount)}`}
                        />
                        <span className="sr-only">
                          {axisLabel(point.date, period)}: {money(point.amount)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-3 flex items-center justify-between text-[0.6875rem] text-white/30">
                  <span>{axisLabel(revenue[0].date, period)}</span>
                  <span>{axisLabel(revenue[revenue.length - 1].date, period)}</span>
                </div>
              </>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bookings by status */}
            <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="text-base font-medium text-white/90">Bookings by status</h2>
              {(bookings?.byStatus.length ?? 0) === 0 ? (
                <p className="mt-4 text-sm text-white/40">No bookings recorded yet.</p>
              ) : (
                <ul className="mt-5 space-y-3" role="list">
                  {bookings!.byStatus
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map(row => (
                      <li key={row.status}>
                        <div className="flex items-center justify-between gap-3">
                          <StatusBadge status={row.status} size="sm" />
                          <span className="text-sm text-white/60 tabular-nums">{row.count}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${(row.count / statusMax) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            {/* Bookings by event type */}
            <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <h2 className="text-base font-medium text-white/90">Popular event types</h2>
              {(bookings?.byEventType.length ?? 0) === 0 ? (
                <p className="mt-4 text-sm text-white/40">No event bookings recorded yet.</p>
              ) : (
                <ol className="mt-5 space-y-3" role="list">
                  {bookings!.byEventType
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((row, index) => (
                      <li key={row.type} className="flex items-center gap-3">
                        <span className="w-5 shrink-0 text-xs text-white/25 tabular-nums">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                          {row.type.replaceAll('_', ' ').toLowerCase()}
                        </span>
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/8 sm:block">
                          <div
                            className="h-full rounded-full bg-primary/40"
                            style={{ width: `${(row.count / typeMax) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-sm text-white/50 tabular-nums">{row.count}</span>
                      </li>
                    ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
