'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import StatusBadge from '@/components/shared/StatusBadge'
import { PageHeader, buttonClass } from '@/components/shared/Primitives'
import { Skeleton } from '@/components/ui/Skeleton'
import { eventRequestsApi, type EventRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

/** Groups the 18 backend statuses into three buckets a customer can scan. */
const BUCKETS = {
  active: ['REQUIREMENT_SUBMITTED', 'UNDER_REVIEW', 'EVENT_MANAGER_ASSIGNED', 'REQUIREMENT_DISCUSSION',
    'PROPOSAL_PREPARING', 'PROPOSAL_SENT', 'CUSTOMER_REVIEWING', 'CHANGES_REQUESTED',
    'PROPOSAL_APPROVED', 'ADVANCE_PAYMENT_PENDING', 'ADVANCE_PAYMENT_RECEIVED',
    'EVENT_CONFIRMED', 'PLANNING_IN_PROGRESS', 'EVENT_PREPARATION', 'EVENT_DAY'],
  done: ['EVENT_COMPLETED', 'COMPLETED', 'FINAL_PAYMENT'],
  draft: ['DRAFT'],
} as const

type Bucket = keyof typeof BUCKETS

const FILTERS: { key: Bucket | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress' },
  { key: 'draft', label: 'Drafts' },
  { key: 'done', label: 'Completed' },
]

function bucketOf(status: string): Bucket {
  const key = status?.toUpperCase?.() ?? ''
  if ((BUCKETS.draft as readonly string[]).includes(key)) return 'draft'
  if ((BUCKETS.done as readonly string[]).includes(key)) return 'done'
  return 'active'
}

function formatEventDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 0 && days < 30) return `In ${days} days`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EventRequestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [requests, setRequests] = useState<EventRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<Bucket | 'all'>('all')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      setRequests(await eventRequestsApi.list())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    void load()
  }, [authLoading, load])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter(r => {
      if (filter !== 'all' && bucketOf(r.status) !== filter) return false
      if (!q) return true
      return (
        r.eventType?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.requestNumber?.toLowerCase().includes(q)
      )
    })
  }, [requests, filter, query])

  if (!authLoading && !isAuthenticated) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-5 py-24">
          <EmptyState
            icon={Sparkles}
            title="Sign in to see your event requests"
            description="Your requirement submissions, proposals and approvals all live here."
            action={{ label: 'Log in', href: '/login' }}
            secondaryAction={{ label: 'Plan an event', href: '/plan-event' }}
          />
        </div>
      </SiteShell>
    )
  }

  const counts = useMemo(() => {
    const base: Record<Bucket, number> = { active: 0, draft: 0, done: 0 }
    for (const r of requests) base[bucketOf(r.status)] += 1
    return base
  }, [requests])

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-16 lg:px-8">
        <PageHeader
          eyebrow="Your account"
          title="Event requests"
          description="Every requirement you have submitted, with the proposal stage it has reached."
          actions={
            <Link href="/plan-event" className={buttonClass('primary', 'md')}>
              <Sparkles className="size-4" aria-hidden="true" />
              Start a new request
            </Link>
          }
        />

        {/* Search + filter */}
        {!loading && !error && requests.length > 0 && (
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30"
                aria-hidden="true"
              />
              <label htmlFor="request-search" className="sr-only">
                Search event requests
              </label>
              <input
                id="request-search"
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by event, city or reference"
                className="w-full rounded-lg border border-white/12 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 transition-colors duration-200 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="flex items-center gap-2" role="group" aria-label="Filter requests">
              <Filter className="size-4 shrink-0 text-white/25" aria-hidden="true" />
              {FILTERS.map(f => {
                const active = filter === f.key
                const count = f.key === 'all' ? requests.length : counts[f.key]
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200',
                      active
                        ? 'bg-primary/12 text-primary ring-1 ring-inset ring-primary/30'
                        : 'text-white/45 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {f.label}
                    <span className="ml-1.5 text-white/30">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <ul className="space-y-3" role="list" aria-label="Loading event requests">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-52" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <ErrorState
              title="We couldn't load your event requests."
              description="Something went wrong on our side. Please try again."
              onRetry={() => void load()}
            />
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
              <EmptyState
                icon={Sparkles}
                title="No event requests yet"
                description="Tell us what you are planning and an event manager will design a proposal around your requirements."
                action={{ label: 'Plan your event', href: '/plan-event' }}
                secondaryAction={{ label: 'Browse events', href: '/events' }}
              />
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
              <EmptyState
                icon={Search}
                title="Nothing matches those filters"
                description="Try a different search term, or clear the filter to see all your requests."
                onAction={() => {
                  setQuery('')
                  setFilter('all')
                }}
              />
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {visible.map(request => {
                const countdown = formatEventDate(request.eventDate)
                return (
                  <li key={request.id}>
                    <Link
                      href={`/event-requests/${request.id}`}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="truncate text-[0.9375rem] font-medium text-white/90">
                            {request.eventType}
                          </h2>
                          <StatusBadge status={request.status} size="sm" />
                        </div>
                        <p className="mt-1 text-xs text-white/30">{request.requestNumber}</p>

                        <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/45">
                          {request.eventDate && (
                            <li className="flex items-center gap-1.5">
                              <CalendarDays className="size-3.5 text-white/25" aria-hidden="true" />
                              <span>
                                {new Date(request.eventDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {countdown && <span className="text-primary/80">· {countdown}</span>}
                            </li>
                          )}
                          {request.guestCount ? (
                            <li className="flex items-center gap-1.5">
                              <Users className="size-3.5 text-white/25" aria-hidden="true" />
                              {request.guestCount} guests
                            </li>
                          ) : null}
                          {request.city && (
                            <li className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-white/25" aria-hidden="true" />
                              {request.city}
                            </li>
                          )}
                          {request.budgetLabel && <li>{request.budgetLabel}</li>}
                        </ul>
                      </div>

                      <ArrowRight
                        className="size-4 shrink-0 self-start text-white/20 transition-colors duration-200 group-hover:translate-x-0.5 group-hover:text-primary sm:self-auto"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </SiteShell>
  )
}
