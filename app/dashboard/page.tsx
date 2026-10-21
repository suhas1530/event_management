'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { bookingsApi, eventRequestsApi, notificationsApi, technicianApi } from '@/lib/api'
import type { Booking, EventRequest, Notification, TechnicianBooking } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'
import {
  Wrench, Sparkles, CalendarDays, Bell, ArrowRight, MapPin, Star,
  CheckCircle2, AlertCircle, Loader2, Clock, Zap, Droplets, Wind,
  Hammer, Paintbrush2, Tv2, Shield, Plus, LayoutDashboard
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * The dashboard is organised the way Heptome sells: anything belonging to an
 * event sits under "My Events", anything booked as a doorstep service under
 * "My Home Services". Status is a secondary filter *inside* each vertical, so
 * neither list ever mixes the two operations.
 */
type Tab = 'overview' | 'events' | 'home'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'My Events' },
  { id: 'home', label: 'My Home Services' },
]

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Upcoming / active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

/**
 * Deep links, including the ids used before the dashboard was split, so old
 * bookmarks and the booking wizard's success screen keep working.
 */
function tabFromParam(value: string | null): Tab | null {
  if (value === 'events' || value === 'event-requests') return 'events'
  if (value === 'home' || value === 'technician') return 'home'
  if (value === 'overview' || value === 'all') return 'overview'
  return null
}

const TECH_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', TECHNICIAN_ASSIGNED: 'Technician Assigned',
  TECHNICIAN_CONFIRMED: 'Tech Confirmed', TECHNICIAN_ON_THE_WAY: 'On The Way',
  TECHNICIAN_ARRIVED: 'Arrived', SERVICE_STARTED: 'In Progress',
  SERVICE_COMPLETED: 'Completed', PAYMENT_COMPLETED: 'Paid', REVIEW_SUBMITTED: 'Reviewed',
  CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const TECH_STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-300 bg-yellow-500/10',
  CONFIRMED: 'text-blue-300 bg-blue-500/10',
  TECHNICIAN_ASSIGNED: 'text-purple-300 bg-purple-500/10',
  TECHNICIAN_CONFIRMED: 'text-purple-300 bg-purple-500/10',
  TECHNICIAN_ON_THE_WAY: 'text-cyan-300 bg-cyan-500/10',
  TECHNICIAN_ARRIVED: 'text-teal-300 bg-teal-500/10',
  SERVICE_STARTED: 'text-orange-300 bg-orange-500/10',
  SERVICE_COMPLETED: 'text-green-400 bg-green-500/15',
  PAYMENT_COMPLETED: 'text-green-400 bg-green-500/15',
  REVIEW_SUBMITTED: 'text-green-300 bg-green-500/10',
  CANCELLED: 'text-muted-foreground/80 bg-muted/60',
  REJECTED: 'text-red-400 bg-red-500/10',
}

const EVENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', REQUESTED: 'Requested', PENDING_REVIEW: 'Under Review',
  QUOTED: 'Quote Ready', CUSTOMER_APPROVAL: 'Awaiting Approval',
  PAYMENT_PENDING: 'Payment Due', CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const EVENT_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'text-muted-foreground bg-muted/60', REQUESTED: 'text-blue-300 bg-blue-500/10',
  PENDING_REVIEW: 'text-yellow-300 bg-yellow-500/10', QUOTED: 'text-purple-300 bg-purple-500/10',
  CUSTOMER_APPROVAL: 'text-orange-300 bg-orange-500/10', PAYMENT_PENDING: 'text-red-300 bg-red-500/10',
  CONFIRMED: 'text-[#d5ae79] bg-[#d5ae79]/10', IN_PROGRESS: 'text-green-300 bg-green-500/10',
  COMPLETED: 'text-green-400 bg-green-500/15', CANCELLED: 'text-muted-foreground/80 bg-muted/60', REJECTED: 'text-red-400 bg-red-500/10',
}

const QUICK_TECHS = [
  { label: 'Plumber', icon: Droplets, cat: 'PLUMBING' },
  { label: 'Electrician', icon: Zap, cat: 'ELECTRICAL' },
  { label: 'AC Service', icon: Wind, cat: 'AC_SERVICE' },
  { label: 'Carpenter', icon: Hammer, cat: 'CARPENTRY' },
  { label: 'Painter', icon: Paintbrush2, cat: 'PAINTING' },
  { label: 'Cleaning', icon: Sparkles, cat: 'CLEANING' },
]

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86400000)
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/60 ${className}`} />
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [tab, setTab] = useState<Tab>('overview')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [eventBookings, setEventBookings] = useState<Booking[]>([])
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([])
  const [techBookings, setTechBookings] = useState<TechnicianBooking[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    Promise.all([
      bookingsApi.list({ limit: 20 }),
      eventRequestsApi.list(),
      technicianApi.myBookings({ limit: 20 }),
      notificationsApi.list({ limit: 8, isRead: false }),
    ]).then(([ev, requests, tech, notifs]) => {
      setEventBookings(ev.data)
      setEventRequests(requests)
      setTechBookings(tech.data)
      setNotifications(notifs.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated])

  /* The active tab lives in `?tab=`; syncing on popstate keeps the browser
     back button (and a refreshed page) on the right vertical. */
  useEffect(() => {
    const sync = () => {
      const next = tabFromParam(new URLSearchParams(window.location.search).get('tab'))
      setTab(next ?? 'overview')
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  /** Switch tabs and keep the address bar in step (no server round-trip). */
  const selectTab = (next: Tab) => {
    setTab(next)
    const params = new URLSearchParams(window.location.search)
    if (next === 'overview') params.delete('tab')
    else params.set('tab', next)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
  }

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <SiteShell>
        <div className="flex min-h-[50vh] items-center justify-center" role="status">
          <span className="sr-only">Loading your dashboard…</span>
          <Loader2 className="size-8 animate-spin text-gold-text" aria-hidden="true" />
        </div>
      </SiteShell>
    )
  }

  // ── Tab filtering ──────────────────────────────────────────────────────────
  const now = new Date()

  const matchesStatusFilter = (status: string, eventDate?: string) => {
    if (statusFilter === 'active') {
      return eventDate
        ? ['CONFIRMED', 'IN_PROGRESS'].includes(status) && new Date(eventDate) > now
        : !['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'REVIEW_SUBMITTED', 'CANCELLED', 'REJECTED'].includes(status)
    }
    if (statusFilter === 'completed') {
      return eventDate ? status === 'COMPLETED' : ['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'REVIEW_SUBMITTED'].includes(status)
    }
    if (statusFilter === 'cancelled') return ['CANCELLED', 'REJECTED'].includes(status)
    return true
  }

  const showTech = tab === 'overview' || tab === 'home'
  const showEvent = tab === 'overview' || tab === 'events'

  const filteredTech: TechnicianBooking[] = showTech
    ? techBookings.filter(b => matchesStatusFilter(b.status))
    : []

  const filteredEvent: Booking[] = showEvent
    ? eventBookings.filter(b => matchesStatusFilter(b.status, b.eventDate))
    : []

  const pendingAction = eventBookings.find(b => ['QUOTED','CUSTOMER_APPROVAL','PAYMENT_PENDING'].includes(b.status))
  const upcomingEvent = eventBookings.find(b => b.status === 'CONFIRMED' && new Date(b.eventDate) > now)
  const activeTechJob = techBookings.find(b => !['SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED','CANCELLED','REJECTED'].includes(b.status))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">{greeting}</p>
            <h1 className="mt-1 font-serif text-4xl text-foreground lg:text-5xl">{user?.name?.split(' ')[0]}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/book/technician" className="flex items-center gap-2 bg-primary px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary-hover">
              <Wrench className="size-3.5" /> Book a Home Service
            </Link>
            <Link href="/plan-event" className="flex items-center gap-2 border border-border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:border-[#d5ae79] hover:text-gold-text">
              <Sparkles className="size-3.5" /> Plan an Event
            </Link>
          </div>
        </div>

        {/* ── Alert banners ── */}
        {showEvent && pendingAction && (
          <Link href={`/bookings/${pendingAction.id}`}
            className="mb-5 flex items-center gap-4 border border-[#d5ae79]/30 bg-[#d5ae79]/8 px-5 py-4 transition hover:bg-[#d5ae79]/12">
            <AlertCircle className="size-5 flex-shrink-0 text-gold-text" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Action required — {EVENT_STATUS_LABEL[pendingAction.status]}</p>
              <p className="text-xs text-muted-foreground">Event booking {pendingAction.bookingNumber} needs your attention</p>
            </div>
            <ArrowRight className="size-4 flex-shrink-0 text-gold-text" />
          </Link>
        )}

        {/* ── Quick book (home services) ── */}
        {showTech && (
          <section className="mb-8 border border-border bg-card p-5">
            <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Quick book a home service</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {QUICK_TECHS.map(({ label, icon: Icon, cat }) => (
                <Link key={cat} href={`/book/technician?category=${cat}`}
                  className="flex flex-col items-center gap-2 border border-border py-4 text-center transition hover:border-[#d5ae79]/40 hover:bg-muted/60">
                  <Icon className="size-5 text-gold-text" />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Stats ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 border border-border" />)
          ) : [
            { label: 'Total Bookings', value: eventBookings.length + techBookings.length, icon: CalendarDays },
            { label: 'Active Jobs', value: techBookings.filter(b => !['SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED','CANCELLED','REJECTED'].includes(b.status)).length, icon: Wrench },
            { label: 'Event Bookings', value: eventBookings.length, icon: Sparkles },
            { label: 'Notifications', value: notifications.length, icon: Bell },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-border bg-card p-5">
              <Icon className="mb-3 size-4 text-gold-text" />
              <p className="text-2xl font-light text-foreground">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Upcoming event countdown ── */}
        {showEvent && upcomingEvent && (
          <Link href={`/bookings/${upcomingEvent.id}`}
            className="mb-8 flex items-center gap-5 border border-[#d5ae79]/20 bg-[#d5ae79]/5 p-5 transition hover:bg-[#d5ae79]/8">
            {upcomingEvent.event?.heroImages?.[0] && (
              <div className="hidden size-16 flex-shrink-0 overflow-hidden sm:block">
                <img src={upcomingEvent.event.heroImages[0]} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-text">Upcoming event</p>
              <p className="mt-1 font-serif text-xl text-foreground">{upcomingEvent.event?.title ?? 'Your event'}</p>
              <p className="text-xs text-muted-foreground">{fmtDate(upcomingEvent.eventDate)} · {upcomingEvent.guestCount} guests</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-light text-gold-text">{daysUntil(upcomingEvent.eventDate)}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">days away</p>
            </div>
          </Link>
        )}

        {/* ── Active home-service job ── */}
        {showTech && activeTechJob && (
          <Link href={`/dashboard/booking/${activeTechJob.id}`}
            className="mb-8 flex items-center gap-4 border border-cyan-500/20 bg-cyan-500/5 p-4 transition hover:bg-cyan-500/8">
            <Wrench className="size-5 flex-shrink-0 text-cyan-400" />
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Active service booking</p>
              <p className="mt-0.5 text-sm text-foreground">{activeTechJob.service?.name ?? 'Technician service'} · {activeTechJob.bookingNumber}</p>
              <p className="text-xs text-muted-foreground">{fmtDate(activeTechJob.scheduledDate)}</p>
            </div>
            <span className={`px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${TECH_STATUS_COLOR[activeTechJob.status]}`}>
              {TECH_STATUS_LABEL[activeTechJob.status]}
            </span>
            <ArrowRight className="size-4 flex-shrink-0 text-muted-foreground/80" />
          </Link>
        )}

        {/* ── Vertical tabs ── */}
        <div className="mb-4 border-b border-border">
          <div className="flex gap-0 overflow-x-auto whitespace-nowrap" role="tablist" aria-label="What to show">
            {TABS.map(t => (
              <button type="button" key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => selectTab(t.id)}
                className={`px-5 py-3 text-[11px] uppercase tracking-[0.18em] transition ${tab === t.id ? 'border-b-2 border-[#d5ae79] text-gold-text' : 'text-muted-foreground hover:text-foreground/90'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Status filter (secondary, inside a vertical) ── */}
        {tab !== 'overview' && (
          <div className="mb-6 flex flex-wrap gap-2">
            {STATUS_FILTERS.map(f => (
              <button type="button" key={f.id} onClick={() => setStatusFilter(f.id)} aria-pressed={statusFilter === f.id}
                className={`border px-3.5 py-1.5 text-[10px] uppercase tracking-[0.15em] transition ${statusFilter === f.id ? 'border-primary bg-primary/15 text-accent' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 border border-border" />)}</div>
        ) : (
          <>
            {(tab === 'overview' || tab === 'events') && (eventRequests.length > 0 || tab === 'events') && (
              <section className="mb-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">My event requests</p>
                  {tab === 'events'
                    ? <Link href="/plan-event" className="text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline">Plan another event</Link>
                    : <Link href="?tab=events" className="text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline" onClick={() => selectTab('events')}>View all</Link>}
                </div>
                {eventRequests.length > 0 ? <div className="flex flex-col divide-y divide-border-subtle border border-border">
                  {(tab === 'overview' ? eventRequests.slice(0, 4) : eventRequests).map(request => (
                    <div key={request.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-muted/60">
                      <div className="flex size-10 flex-shrink-0 items-center justify-center border border-[#d5ae79]/20 bg-[#d5ae79]/5"><Sparkles className="size-4 text-[#d5ae79]" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{request.eventType.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{request.eventDate ? fmtDate(request.eventDate) : 'Date flexible'} · {request.guestCount ? `${request.guestCount} guests` : 'Guest count open'}{request.city ? ` · ${request.city}` : ''}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/80">{request.requestNumber}</p>
                      </div>
                      <span className={`border px-2.5 py-1 text-[9px] uppercase tracking-widest ${request.status === 'DRAFT' ? 'border-border bg-muted text-muted-foreground' : 'border-[#d5ae79]/20 bg-[#d5ae79]/10 text-[#d5ae79]'}`}>
                        {request.status === 'DRAFT' ? 'Draft' : request.status.replaceAll('_', ' ').toLowerCase()}
                      </span>
                      <Link href={request.status === 'DRAFT' ? `/plan-event?id=${request.id}` : `/event-requests/${request.id}`} className="flex items-center gap-1.5 text-xs text-gold-text hover:underline">
                        {request.status === 'DRAFT' ? 'Continue' : 'View requirements'} <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ))}
                </div> : <div className="border border-border px-5 py-8 text-center"><p className="text-sm text-foreground">No event requests yet</p><p className="mt-1 text-xs text-muted-foreground">Tell us what you are planning and our event team will shape a custom proposal.</p><Link href="/plan-event" className="mt-4 inline-flex items-center gap-2 bg-[#d5ae79] px-4 py-2.5 text-xs text-[#17151d]">Plan an event <ArrowRight className="size-3.5" /></Link></div>}
              </section>
            )}

            {/* ── Home service bookings (the "My Home Services" vertical) ── */}
            {showTech && filteredTech.length > 0 && (
              <div className="mb-6">
                {tab === 'overview' && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Home service bookings</p>
                    <Link href="?tab=home" className="text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline" onClick={() => selectTab('home')}>View all</Link>
                  </div>
                )}
                <div className="flex flex-col divide-y divide-white/8 border border-border">
                  {(tab === 'overview' ? filteredTech.slice(0, 3) : filteredTech).map(b => (
                    <Link key={b.id} href={`/dashboard/booking/${b.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/60">
                      <div className="flex size-10 flex-shrink-0 items-center justify-center border border-border bg-muted/60">
                        <Wrench className="size-4 text-gold-text" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-foreground">{b.service?.name ?? 'Technician service'}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {b.bookingNumber} · {fmtDate(b.scheduledDate)} · {b.timeSlotStart}–{b.timeSlotEnd}
                        </p>
                        <p className="text-xs text-muted-foreground/80">{b.addressCity}</p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${TECH_STATUS_COLOR[b.status]}`}>
                          {TECH_STATUS_LABEL[b.status]}
                        </span>
                        <span className="text-xs text-muted-foreground">{fmt(b.totalAmount)}</span>
                      </div>
                      <ArrowRight className="size-4 flex-shrink-0 text-muted-foreground/80 transition group-hover:text-gold-text" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Event bookings ── */}
            {showEvent && filteredEvent.length > 0 && (
              <div className="mb-6">
                {tab === 'overview' && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Event bookings</p>
                    <Link href="?tab=events" className="text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline" onClick={() => selectTab('events')}>View all</Link>
                  </div>
                )}
                <div className="flex flex-col divide-y divide-white/8 border border-border">
                  {(tab === 'overview' ? filteredEvent.slice(0, 3) : filteredEvent).map(b => (
                    <Link key={b.id} href={`/bookings/${b.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/60">
                      <div className="size-10 flex-shrink-0 overflow-hidden border border-border bg-muted/60">
                        {b.event?.heroImages?.[0]
                          ? <img src={b.event.heroImages[0]} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center"><Sparkles className="size-4 text-muted-foreground/80" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-foreground">{b.event?.title ?? 'Event'}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{b.bookingNumber} · {fmtDate(b.eventDate)} · {b.guestCount} guests</p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${EVENT_STATUS_COLOR[b.status]}`}>
                          {EVENT_STATUS_LABEL[b.status]}
                        </span>
                        {b.totalAmount > 0 && <span className="text-xs text-muted-foreground">{fmt(b.totalAmount)}</span>}
                      </div>
                      <ArrowRight className="size-4 flex-shrink-0 text-muted-foreground/80 transition group-hover:text-gold-text" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state — only when the current view genuinely has nothing.
                On "My Events" a pending request still counts as content. */}
            {filteredTech.length === 0 &&
              filteredEvent.length === 0 &&
              (tab === 'events' ? eventRequests.length === 0 : true) && (
                <div className="flex flex-col items-center border border-border-subtle py-16 text-center">
                  <CalendarDays className="mb-4 size-10 text-muted-foreground/80" />
                  <p className="text-sm text-muted-foreground">
                    {tab === 'home' ? 'No home service bookings yet' : tab === 'events' ? 'No event bookings yet' : 'No bookings yet'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {tab === 'home'
                      ? 'Pick a service and choose a slot — you will see the booking here straight away.'
                      : tab === 'events'
                        ? 'Browse events, or tell us what you are planning and our event team will shape a proposal.'
                        : 'Start with an event or a home service — everything you book shows up here.'}
                  </p>
                  <div className="mt-5 flex gap-3">
                    <Link href="/book/technician" className="flex items-center gap-2 bg-primary px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary-hover">
                      <Wrench className="size-3.5" /> Book a Home Service
                    </Link>
                    <Link href="/plan-event" className="flex items-center gap-2 border border-border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:border-[#d5ae79]">
                      <Sparkles className="size-3.5" /> Plan an Event
                    </Link>
                  </div>
                </div>
              )}
          </>
        )}

        {/* ── Notifications ── */}
        {notifications.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Recent notifications</p>
              <Link href="/notifications" className="text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline">View all</Link>
            </div>
            <div className="flex flex-col divide-y divide-white/8 border border-border">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="flex items-start gap-3 px-5 py-3.5">
                  <Bell className="mt-0.5 size-4 flex-shrink-0 text-gold-text" />
                  <div>
                    <p className="text-sm text-foreground/90">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/80">{fmtDate(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </SiteShell>
  )
}
