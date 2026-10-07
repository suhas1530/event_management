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

type Tab = 'all' | 'technician' | 'events' | 'event-requests' | 'upcoming' | 'completed' | 'cancelled'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All Bookings' },
  { id: 'technician', label: 'Technician Services' },
  { id: 'events', label: 'Event Bookings' },
  { id: 'event-requests', label: 'My Event Requests' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

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
  CANCELLED: 'text-white/30 bg-white/5',
  REJECTED: 'text-red-400 bg-red-500/10',
}

const EVENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', REQUESTED: 'Requested', PENDING_REVIEW: 'Under Review',
  QUOTED: 'Quote Ready', CUSTOMER_APPROVAL: 'Awaiting Approval',
  PAYMENT_PENDING: 'Payment Due', CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const EVENT_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'text-white/40 bg-white/5', REQUESTED: 'text-blue-300 bg-blue-500/10',
  PENDING_REVIEW: 'text-yellow-300 bg-yellow-500/10', QUOTED: 'text-purple-300 bg-purple-500/10',
  CUSTOMER_APPROVAL: 'text-orange-300 bg-orange-500/10', PAYMENT_PENDING: 'text-red-300 bg-red-500/10',
  CONFIRMED: 'text-[#d7b98b] bg-[#d7b98b]/10', IN_PROGRESS: 'text-green-300 bg-green-500/10',
  COMPLETED: 'text-green-400 bg-green-500/15', CANCELLED: 'text-white/30 bg-white/5', REJECTED: 'text-red-400 bg-red-500/10',
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
  return <div className={`animate-pulse bg-white/8 ${className}`} />
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [tab, setTab] = useState<Tab>('all')
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

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'event-requests') setTab('event-requests')
  }, [])

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <SiteShell>
        <div className="flex min-h-[50vh] items-center justify-center" role="status">
          <span className="sr-only">Loading your dashboard…</span>
          <Loader2 className="size-8 animate-spin text-[#d7b98b]" aria-hidden="true" />
        </div>
      </SiteShell>
    )
  }

  // ── Tab filtering ──────────────────────────────────────────────────────────
  const now = new Date()

  const filteredTech: TechnicianBooking[] = techBookings.filter(b => {
    if (tab === 'all' || tab === 'technician') return true
    if (tab === 'upcoming') return !['SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED','CANCELLED','REJECTED'].includes(b.status)
    if (tab === 'completed') return ['SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED'].includes(b.status)
    if (tab === 'cancelled') return ['CANCELLED','REJECTED'].includes(b.status)
    return false
  })

  const filteredEvent: Booking[] = eventBookings.filter(b => {
    if (tab === 'all' || tab === 'events') return true
    if (tab === 'upcoming') return ['CONFIRMED','IN_PROGRESS'].includes(b.status) && new Date(b.eventDate) > now
    if (tab === 'completed') return b.status === 'COMPLETED'
    if (tab === 'cancelled') return ['CANCELLED','REJECTED'].includes(b.status)
    return false
  })

  const showTech = ['all','technician','upcoming','completed','cancelled'].includes(tab)
  const showEvent = ['all','events','upcoming','completed','cancelled'].includes(tab)

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
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">{greeting}</p>
            <h1 className="mt-1 font-serif text-4xl text-white lg:text-5xl">{user?.name?.split(' ')[0]}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/book/technician" className="flex items-center gap-2 bg-[#d7b98b] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
              <Wrench className="size-3.5" /> Book Technician
            </Link>
            <Link href="/plan-event" className="flex items-center gap-2 border border-white/20 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white/60 hover:border-[#d7b98b] hover:text-[#d7b98b]">
              <Sparkles className="size-3.5" /> Plan Event
            </Link>
          </div>
        </div>

        {/* ── Alert banners ── */}
        {pendingAction && (
          <Link href={`/bookings/${pendingAction.id}`}
            className="mb-5 flex items-center gap-4 border border-[#d7b98b]/30 bg-[#d7b98b]/8 px-5 py-4 transition hover:bg-[#d7b98b]/12">
            <AlertCircle className="size-5 flex-shrink-0 text-[#d7b98b]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Action required — {EVENT_STATUS_LABEL[pendingAction.status]}</p>
              <p className="text-xs text-white/50">Event booking {pendingAction.bookingNumber} needs your attention</p>
            </div>
            <ArrowRight className="size-4 flex-shrink-0 text-[#d7b98b]" />
          </Link>
        )}

        {/* ── Quick book ── */}
        <section className="mb-8 border border-white/10 bg-[#111114] p-5">
          <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-white/40">Quick book a technician</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUICK_TECHS.map(({ label, icon: Icon, cat }) => (
              <Link key={cat} href={`/book/technician?category=${cat}`}
                className="flex flex-col items-center gap-2 border border-white/10 py-4 text-center transition hover:border-[#d7b98b]/40 hover:bg-white/3">
                <Icon className="size-5 text-[#d7b98b]" />
                <span className="text-[10px] text-white/60">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 border border-white/10" />)
          ) : [
            { label: 'Total Bookings', value: eventBookings.length + techBookings.length, icon: CalendarDays },
            { label: 'Active Jobs', value: techBookings.filter(b => !['SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED','CANCELLED','REJECTED'].includes(b.status)).length, icon: Wrench },
            { label: 'Event Bookings', value: eventBookings.length, icon: Sparkles },
            { label: 'Notifications', value: notifications.length, icon: Bell },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-white/10 bg-[#111114] p-5">
              <Icon className="mb-3 size-4 text-[#d7b98b]" />
              <p className="text-2xl font-light text-white">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/40">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Upcoming event countdown ── */}
        {upcomingEvent && (
          <Link href={`/bookings/${upcomingEvent.id}`}
            className="mb-8 flex items-center gap-5 border border-[#d7b98b]/20 bg-[#d7b98b]/5 p-5 transition hover:bg-[#d7b98b]/8">
            {upcomingEvent.event?.heroImages?.[0] && (
              <div className="hidden size-16 flex-shrink-0 overflow-hidden sm:block">
                <img src={upcomingEvent.event.heroImages[0]} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7b98b]">Upcoming event</p>
              <p className="mt-1 font-serif text-xl text-white">{upcomingEvent.event?.title ?? 'Your event'}</p>
              <p className="text-xs text-white/50">{fmtDate(upcomingEvent.eventDate)} · {upcomingEvent.guestCount} guests</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-light text-[#d7b98b]">{daysUntil(upcomingEvent.eventDate)}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">days away</p>
            </div>
          </Link>
        )}

        {/* ── Active tech job ── */}
        {activeTechJob && (
          <Link href={`/dashboard/booking/${activeTechJob.id}`}
            className="mb-8 flex items-center gap-4 border border-cyan-500/20 bg-cyan-500/5 p-4 transition hover:bg-cyan-500/8">
            <Wrench className="size-5 flex-shrink-0 text-cyan-400" />
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Active service booking</p>
              <p className="mt-0.5 text-sm text-white">{activeTechJob.service?.name ?? 'Technician service'} · {activeTechJob.bookingNumber}</p>
              <p className="text-xs text-white/40">{fmtDate(activeTechJob.scheduledDate)}</p>
            </div>
            <span className={`px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${TECH_STATUS_COLOR[activeTechJob.status]}`}>
              {TECH_STATUS_LABEL[activeTechJob.status]}
            </span>
            <ArrowRight className="size-4 flex-shrink-0 text-white/30" />
          </Link>
        )}

        {/* ── Tabs ── */}
        <div className="mb-6 overflow-x-auto border-b border-white/10">
          <div className="flex gap-0 whitespace-nowrap">
            {TABS.map(t => (
              <button type="button" key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-[11px] uppercase tracking-[0.18em] transition ${tab === t.id ? 'border-b-2 border-[#d7b98b] text-[#d7b98b]' : 'text-white/40 hover:text-white/70'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 border border-white/10" />)}</div>
        ) : (
          <>
            {['all', 'event-requests'].includes(tab) && (eventRequests.length > 0 || tab === 'event-requests') && (
              <section className="mb-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">My event requests</p>
                  <Link href="/plan-event" className="text-[10px] uppercase tracking-[0.15em] text-[#d7b98b] hover:underline">Plan another event</Link>
                </div>
                {eventRequests.length > 0 ? <div className="flex flex-col divide-y divide-white/8 border border-white/10">
                  {(tab === 'all' ? eventRequests.slice(0, 4) : eventRequests).map(request => (
                    <div key={request.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/2.5">
                      <div className="flex size-10 flex-shrink-0 items-center justify-center border border-[#d7b98b]/20 bg-[#d7b98b]/5"><Sparkles className="size-4 text-[#d7b98b]" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{request.eventType.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-white/40">{request.eventDate ? fmtDate(request.eventDate) : 'Date flexible'} · {request.guestCount ? `${request.guestCount} guests` : 'Guest count open'}{request.city ? ` · ${request.city}` : ''}</p>
                        <p className="mt-1 text-[10px] text-white/25">{request.requestNumber}</p>
                      </div>
                      <span className={`border px-2.5 py-1 text-[9px] uppercase tracking-widest ${request.status === 'DRAFT' ? 'border-white/15 bg-white/5 text-white/50' : 'border-[#d7b98b]/20 bg-[#d7b98b]/10 text-[#d7b98b]'}`}>
                        {request.status === 'DRAFT' ? 'Draft' : request.status.replaceAll('_', ' ').toLowerCase()}
                      </span>
                      <Link href={request.status === 'DRAFT' ? `/plan-event?id=${request.id}` : `/event-requests/${request.id}`} className="flex items-center gap-1.5 text-xs text-[#d7b98b] hover:underline">
                        {request.status === 'DRAFT' ? 'Continue' : 'View requirements'} <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ))}
                </div> : <div className="border border-white/10 px-5 py-8 text-center"><p className="text-sm text-white/55">No event requests yet</p><p className="mt-1 text-xs text-white/35">Tell us what you are planning and our event team will shape a custom proposal.</p><Link href="/plan-event" className="mt-4 inline-flex items-center gap-2 bg-[#d7b98b] px-4 py-2.5 text-xs text-[#17130e]">Plan an event <ArrowRight className="size-3.5" /></Link></div>}
              </section>
            )}

            {/* ── Technician bookings ── */}
            {showTech && filteredTech.length > 0 && (
              <div className="mb-6">
                {tab === 'all' && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Technician services</p>
                    <Link href="?tab=technician" className="text-[10px] uppercase tracking-[0.15em] text-[#d7b98b] hover:underline" onClick={() => setTab('technician')}>View all</Link>
                  </div>
                )}
                <div className="flex flex-col divide-y divide-white/8 border border-white/10">
                  {(tab === 'all' ? filteredTech.slice(0, 3) : filteredTech).map(b => (
                    <Link key={b.id} href={`/dashboard/booking/${b.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/3">
                      <div className="flex size-10 flex-shrink-0 items-center justify-center border border-white/10 bg-white/3">
                        <Wrench className="size-4 text-[#d7b98b]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-white">{b.service?.name ?? 'Technician service'}</p>
                        <p className="mt-0.5 text-xs text-white/40">
                          {b.bookingNumber} · {fmtDate(b.scheduledDate)} · {b.timeSlotStart}–{b.timeSlotEnd}
                        </p>
                        <p className="text-xs text-white/30">{b.addressCity}</p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${TECH_STATUS_COLOR[b.status]}`}>
                          {TECH_STATUS_LABEL[b.status]}
                        </span>
                        <span className="text-xs text-white/40">{fmt(b.totalAmount)}</span>
                      </div>
                      <ArrowRight className="size-4 flex-shrink-0 text-white/20 transition group-hover:text-[#d7b98b]" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Event bookings ── */}
            {showEvent && filteredEvent.length > 0 && (
              <div className="mb-6">
                {tab === 'all' && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Event bookings</p>
                    <Link href="?tab=events" className="text-[10px] uppercase tracking-[0.15em] text-[#d7b98b] hover:underline" onClick={() => setTab('events')}>View all</Link>
                  </div>
                )}
                <div className="flex flex-col divide-y divide-white/8 border border-white/10">
                  {(tab === 'all' ? filteredEvent.slice(0, 3) : filteredEvent).map(b => (
                    <Link key={b.id} href={`/bookings/${b.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/3">
                      <div className="size-10 flex-shrink-0 overflow-hidden border border-white/10 bg-white/3">
                        {b.event?.heroImages?.[0]
                          ? <img src={b.event.heroImages[0]} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center"><Sparkles className="size-4 text-white/20" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-white">{b.event?.title ?? 'Event'}</p>
                        <p className="mt-0.5 text-xs text-white/40">{b.bookingNumber} · {fmtDate(b.eventDate)} · {b.guestCount} guests</p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${EVENT_STATUS_COLOR[b.status]}`}>
                          {EVENT_STATUS_LABEL[b.status]}
                        </span>
                        {b.totalAmount > 0 && <span className="text-xs text-white/40">{fmt(b.totalAmount)}</span>}
                      </div>
                      <ArrowRight className="size-4 flex-shrink-0 text-white/20 transition group-hover:text-[#d7b98b]" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredTech.length === 0 && filteredEvent.length === 0 && (tab === 'event-requests' ? eventRequests.length === 0 : true) && (
              <div className="flex flex-col items-center border border-white/8 py-16 text-center">
                <CalendarDays className="mb-4 size-10 text-white/20" />
                <p className="text-sm text-white/50">No bookings found</p>
                <p className="mt-1 text-xs text-white/30">
                  {tab === 'technician' ? 'Book a technician to get started.' : tab === 'events' ? 'Browse events to plan your next celebration.' : 'Your bookings will appear here.'}
                </p>
                <div className="mt-5 flex gap-3">
                  <Link href="/book/technician" className="flex items-center gap-2 bg-[#d7b98b] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
                    <Wrench className="size-3.5" /> Book Technician
                  </Link>
                  <Link href="/plan-event" className="flex items-center gap-2 border border-white/20 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white/60 hover:border-[#d7b98b]">
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
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Recent notifications</p>
              <Link href="/notifications" className="text-[10px] uppercase tracking-[0.15em] text-[#d7b98b] hover:underline">View all</Link>
            </div>
            <div className="flex flex-col divide-y divide-white/8 border border-white/10">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="flex items-start gap-3 px-5 py-3.5">
                  <Bell className="mt-0.5 size-4 flex-shrink-0 text-[#d7b98b]" />
                  <div>
                    <p className="text-sm text-white/80">{n.title}</p>
                    <p className="mt-0.5 text-xs text-white/40 line-clamp-1">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-white/25">{fmtDate(n.createdAt)}</p>
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
