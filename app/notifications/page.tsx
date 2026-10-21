'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader, buttonClass } from '@/components/shared/Primitives'
import { useToast } from '@/components/ui/Toast'
import { notificationsApi, type Notification } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

/** Notification types carry their own icon + tone so the feed reads at a glance. */
const TYPE_META: Record<string, { label: string; className: string }> = {
  BOOKING_CREATED: { label: 'Booking', className: 'text-sky-300 bg-sky-500/12 ring-sky-500/25' },
  BOOKING_UPDATED: { label: 'Update', className: 'text-sky-300 bg-sky-500/12 ring-sky-500/25' },
  BOOKING_CONFIRMED: { label: 'Confirmed', className: 'text-emerald-300 bg-emerald-500/12 ring-emerald-500/25' },
  BOOKING_COMPLETED: { label: 'Completed', className: 'text-emerald-300 bg-emerald-500/12 ring-emerald-500/25' },
  PAYMENT: { label: 'Payment', className: 'text-amber-300 bg-amber-500/12 ring-amber-500/25' },
  PROPOSAL: { label: 'Proposal', className: 'text-primary bg-primary/12 ring-primary/25' },
  EVENT_REQUEST: { label: 'Event request', className: 'text-primary bg-primary/12 ring-primary/25' },
  REVIEW: { label: 'Review', className: 'text-muted-foreground bg-muted/60 ring-white/12' },
  SYSTEM: { label: 'System', className: 'text-muted-foreground bg-muted/60 ring-white/12' },
}

function metaFor(type: string) {
  return TYPE_META[type?.toUpperCase?.()] ?? { label: 'Notice', className: 'text-muted-foreground bg-muted/60 ring-white/12' }
}

/**
 * Notifications carry their target inside the `data` JSON payload. Event
 * bookings and technician bookings live on different detail routes, so we
 * resolve the right one here instead of guessing in the template.
 */
function linkFor(n: Notification): string | null {
  const data = (n.data ?? {}) as Record<string, unknown>
  const eventBookingId = typeof data.bookingId === 'string' ? data.bookingId : null
  const techBookingId =
    typeof data.techBookingId === 'string'
      ? data.techBookingId
      : typeof data.technicianBookingId === 'string'
        ? data.technicianBookingId
        : null
  const requestId =
    typeof data.requestId === 'string'
      ? data.requestId
      : typeof data.eventRequestId === 'string'
        ? data.eventRequestId
        : null

  if (techBookingId) return `/dashboard/booking/${techBookingId}`
  if (eventBookingId) return `/bookings/${eventBookingId}`
  if (requestId) return `/event-requests/${requestId}`
  return null
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const res = await notificationsApi.list({ limit: 50 })
      setItems(res.data ?? [])
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

  async function markAll() {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      await load()
      toast('All notifications marked as read.', 'success')
    } catch {
      toast('We could not update your notifications.', 'error')
    } finally {
      setMarkingAll(false)
    }
  }

  async function markOne(id: string) {
    // Optimistic — avoids a visible lag on tap.
    setItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await notificationsApi.markRead(id)
    } catch {
      void load()
    }
  }

  const unread = items.filter(n => !n.isRead).length

  if (!authLoading && !isAuthenticated) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-5 py-24">
          <EmptyState
            icon={BellOff}
            title="Sign in to see your notifications"
            description="Booking updates, proposal activity and payment reminders will appear here once you are signed in."
            action={{ label: 'Log in', href: '/login' }}
            secondaryAction={{ label: 'Create an account', href: '/register' }}
          />
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-16 lg:px-8">
        <PageHeader
          eyebrow="Your account"
          title="Notifications"
          description={unread > 0 ? `You have ${unread} unread update${unread === 1 ? '' : 's'}.` : 'You are all caught up.'}
          actions={
            unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                disabled={markingAll}
                className={buttonClass('secondary', 'md')}
              >
                {markingAll ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCheck className="size-4" aria-hidden="true" />
                )}
                Mark all as read
              </button>
            ) : undefined
          }
        />

        <div className="mt-10">
          {loading ? (
            <ul className="space-y-3" role="list" aria-label="Loading notifications">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="rounded-2xl border border-border-subtle bg-muted/50 p-5">
                  <div className="flex gap-4">
                    <Skeleton className="size-9 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <ErrorState
              title="We couldn't load your notifications."
              description="Something went wrong on our side. Please try again."
              onRetry={() => void load()}
            />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border-subtle bg-muted/50">
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="When a booking moves forward or a proposal is ready, you will hear about it here first."
                action={{ label: 'Book a technician', href: '/book/technician' }}
                secondaryAction={{ label: 'Plan an event', href: '/plan-event' }}
              />
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {items.map(item => {
                const meta = metaFor(item.type)
                const href = linkFor(item)
                const body = (
                  <>
                    <span
                      className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-xl text-[0.6875rem] font-semibold uppercase tracking-wider ring-1 ring-inset',
                        meta.className
                      )}
                      aria-hidden="true"
                    >
                      {meta.label.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[0.9375rem] font-medium text-foreground/90">{item.title}</p>
                        {!item.isRead && (
                          <span className="size-1.5 rounded-full bg-primary" aria-label="Unread" />
                        )}
                      </div>
                      {item.message && (
                        <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">{item.message}</p>
                      )}
                      <p className="mt-1.5 text-xs text-muted-foreground/80">
                        {meta.label} · {relativeTime(item.createdAt)}
                      </p>
                    </div>
                  </>
                )

                const shared = cn(
                  'flex w-full gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ease-out',
                  item.isRead
                    ? 'border-border-subtle bg-muted/50 hover:border-border'
                    : 'border-primary/25 bg-primary/[0.05] hover:border-primary/40'
                )

                return (
                  <li key={item.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => !item.isRead && void markOne(item.id)}
                        className={cn(shared, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void markOne(item.id)}
                        className={shared}
                      >
                        {body}
                      </button>
                    )}
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