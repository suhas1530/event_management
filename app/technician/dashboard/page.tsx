'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Star,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import StatusBadge from '@/components/shared/StatusBadge'
import { PageHeader, buttonClass } from '@/components/shared/Primitives'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { technicianApi, type TechnicianBooking } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

/**
 * The status transitions a technician is permitted to make, in the order they
 * happen on the day of a job. Mirrors `allowedForTechnician` in
 * backend/src/routes/technicians.ts — offering a transition the API will
 * reject would be worse than not offering it at all.
 */
const TRANSITIONS: Record<string, { label: string; next: string; tone: 'primary' | 'secondary' }[]> = {
  TECHNICIAN_ASSIGNED: [{ label: 'Confirm job', next: 'TECHNICIAN_CONFIRMED', tone: 'primary' }],
  PENDING: [{ label: 'Confirm job', next: 'TECHNICIAN_CONFIRMED', tone: 'primary' }],
  TECHNICIAN_CONFIRMED: [{ label: "I'm on the way", next: 'TECHNICIAN_ON_THE_WAY', tone: 'primary' }],
  TECHNICIAN_ON_THE_WAY: [{ label: 'I have arrived', next: 'TECHNICIAN_ARRIVED', tone: 'primary' }],
  TECHNICIAN_ARRIVED: [{ label: 'Start work', next: 'SERVICE_STARTED', tone: 'primary' }],
  SERVICE_STARTED: [{ label: 'Mark work complete', next: 'SERVICE_COMPLETED', tone: 'primary' }],
}

const UPCOMING = ['PENDING', 'TECHNICIAN_ASSIGNED', 'TECHNICIAN_CONFIRMED', 'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED', 'SERVICE_STARTED']
const FINISHED = ['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CANCELLED', 'REJECTED']

function isUpcoming(status: string) {
  return UPCOMING.includes(status?.toUpperCase?.() ?? '')
}

function money(n: number) {
  return `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`
}

function formatSlot(date: string, start: string, end: string) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Date to be confirmed'
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${day} · ${start}–${end}`
}

export default function TechnicianDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const { toast } = useToast()

  const [jobs, setJobs] = useState<TechnicianBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'finished'>('upcoming')

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const res = await technicianApi.myJobs({ limit: 50 })
      setJobs(res.data ?? [])
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

  const visible = useMemo(
    () => jobs.filter(j => (tab === 'upcoming' ? isUpcoming(j.status) : FINISHED.includes(j.status?.toUpperCase?.() ?? ''))),
    [jobs, tab]
  )

  /** Only jobs that actually need attention today. */
  const active = useMemo(() => jobs.filter(j => j.status?.toUpperCase?.() !== 'SERVICE_COMPLETED' && !FINISHED.includes(j.status?.toUpperCase?.() ?? '')), [jobs])

  const stats = useMemo(() => {
    const completed = jobs.filter(j => j.status === 'SERVICE_COMPLETED').length
    const pendingPayout = jobs
      .filter(j => j.status === 'SERVICE_COMPLETED')
      .reduce((sum, j) => sum + Math.max((j.totalAmount ?? 0) - (j.paidAmount ?? 0), 0), 0)
    return { active: active.length, completed, pendingPayout }
  }, [jobs, active])

  async function advance(job: TechnicianBooking, next: string, label: string) {
    setBusyId(job.id)
    try {
      await technicianApi.updateJobStatus(job.id, next)
      await load()
      toast(`${job.bookingNumber} — ${label}.`, 'success')
    } catch (err) {
      toast((err as { error?: string })?.error ?? 'We could not update that job.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-5 py-24">
          <EmptyState
            icon={Wrench}
            title="Sign in to view your jobs"
            description="Your assigned work, schedule and status updates live here."
            action={{ label: 'Log in', href: '/login' }}
          />
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-16 lg:px-8">
        <PageHeader
          eyebrow="Technician workspace"
          title={`Welcome back${user?.name?.split(' ')[0] ? `, ${user.name.split(' ')[0]}` : ''}`}
          description="Jobs assigned to you, and the next step you need to take on each one."
          actions={
            <button
              type="button"
              onClick={() => void logout()}
              className={buttonClass('secondary', 'md')}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          }
        />

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Active jobs', value: stats.active, icon: CalendarClock, tone: 'text-sky-300' },
            { label: 'Jobs completed', value: stats.completed, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Awaiting payout', value: money(stats.pendingPayout), icon: IndianRupee, tone: 'text-amber-300' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2.5">
                <Icon className={cn('size-4', tone)} aria-hidden="true" />
                <p className="text-label text-white/40">{label}</p>
              </div>
              <p className="mt-3 font-serif text-2xl text-white tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-10 flex items-center gap-2 border-b border-white/8" role="tablist" aria-label="Job status">
          {([
            { key: 'upcoming' as const, label: 'Upcoming & active' },
            { key: 'finished' as const, label: 'Completed & closed' },
          ]).map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                '-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white/45 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <ul className="space-y-4" role="list" aria-label="Loading jobs">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <ErrorState
              title="We couldn't load your jobs."
              description="Something went wrong on our side. Please try again."
              onRetry={() => void load()}
            />
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
              <EmptyState
                icon={tab === 'upcoming' ? CalendarClock : CheckCircle2}
                title={tab === 'upcoming' ? 'No active jobs' : 'Nothing completed yet'}
                description={
                  tab === 'upcoming'
                    ? 'When work is assigned to you it will appear here with the address, time slot and the next action to take.'
                    : 'Jobs you finish will be listed here once the customer confirms the work.'
                }
              />
            </div>
          ) : (
            <ul className="space-y-4" role="list">
              {visible.map(job => {
                const actions = TRANSITIONS[job.status?.toUpperCase?.() ?? ''] ?? []
                return (
                  <li key={job.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-[0.9375rem] font-medium text-white/90">
                            {job.service?.name ?? job.category.replaceAll('_', ' ').toLowerCase()}
                          </h2>
                          <StatusBadge status={job.status} size="sm" />
                        </div>
                        <p className="mt-1 text-xs text-white/30">{job.bookingNumber}</p>

                        {job.serviceDescription && (
                          <p className="mt-3 text-pretty text-sm leading-6 text-white/55">
                            {job.serviceDescription}
                          </p>
                        )}

                        <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
                          <li className="flex items-center gap-1.5">
                            <CalendarClock className="size-3.5 text-white/25" aria-hidden="true" />
                            {formatSlot(job.scheduledDate, job.timeSlotStart, job.timeSlotEnd)}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-white/25" aria-hidden="true" />
                            {job.addressLabel || job.addressCity}
                          </li>
                          {job.customer?.phone && (
                            <li className="flex items-center gap-1.5">
                              <Phone className="size-3.5 text-white/25" aria-hidden="true" />
                              {job.customer.phone}
                            </li>
                          )}
                          <li className="flex items-center gap-1.5 font-medium text-white/60">
                            <IndianRupee className="size-3.5 text-white/25" aria-hidden="true" />
                            {money(job.totalAmount)}
                          </li>
                        </ul>

                        {/* Full address — needed on the day, so not truncated away. */}
                        <p className="mt-2.5 text-xs leading-5 text-white/35">
                          {job.addressLine1}
                          {job.addressLine2 ? `, ${job.addressLine2}` : ''}, {job.addressCity}
                          {job.addressState ? `, ${job.addressState}` : ''} — {job.addressPincode}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <Link
                          href={`/dashboard/booking/${job.id}`}
                          className="text-[0.8125rem] font-medium text-primary underline-offset-4 hover:underline"
                        >
                          View details
                        </Link>
                      </div>
                    </div>

                    {/* Next action */}
                    {actions.length > 0 && (
                      <div className="mt-5 border-t border-white/8 pt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="flex items-start gap-2 text-sm text-white/50">
                            <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                            <span>
                              Next step: <span className="text-white/80">{actions[0].label.toLowerCase()}</span>
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => void advance(job, actions[0].next, actions[0].label)}
                            disabled={busyId === job.id}
                            className={buttonClass(actions[0].tone, 'md')}
                          >
                            {busyId === job.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <ArrowRight className="size-4" aria-hidden="true" />
                            )}
                            {actions[0].label}
                          </button>
                        </div>
                      </div>
                    )}

                    {job.customerNotes && (
                      <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3.5 text-xs leading-5 text-white/45">
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
                        <span>
                          <span className="text-white/65">Customer note:</span> {job.customerNotes}
                        </span>
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
          <h2 className="flex items-center gap-2.5 text-base font-medium text-white/90">
            <Star className="size-[18px] text-primary" aria-hidden="true" />
            Your work, your profile
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Customers see your rating, completed job count and service areas when they book. Keeping your
            profile current is the single best way to receive more work.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/profile" className={buttonClass('secondary', 'md')}>
              View profile
            </Link>
            <Link href="/help" className={buttonClass('ghost', 'md')}>
              Get help
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
