'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { technicianApi, adminApi } from '@/lib/api'
import type { TechnicianBooking, TechnicianStats } from '@/lib/api'
import { useToast } from '@/app/providers'
import {
  Wrench, Search, Loader2, ArrowRight, Filter,
  CheckCircle2, Clock, XCircle, IndianRupee, BarChart3
} from 'lucide-react'

const STATUS_OPTS = [
  '', 'PENDING', 'CONFIRMED', 'TECHNICIAN_ASSIGNED', 'TECHNICIAN_CONFIRMED',
  'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED', 'SERVICE_STARTED',
  'SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'CANCELLED', 'REJECTED',
]
const STATUS_LABEL: Record<string, string> = {
  '': 'All', PENDING: 'Pending', CONFIRMED: 'Confirmed',
  TECHNICIAN_ASSIGNED: 'Tech Assigned', TECHNICIAN_CONFIRMED: 'Tech Confirmed',
  TECHNICIAN_ON_THE_WAY: 'On The Way', TECHNICIAN_ARRIVED: 'Arrived',
  SERVICE_STARTED: 'In Progress', SERVICE_COMPLETED: 'Completed',
  PAYMENT_COMPLETED: 'Paid', REVIEW_SUBMITTED: 'Reviewed',
  CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const STATUS_COLOR: Record<string, string> = {
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
const CAT_OPTS = ['', 'PLUMBING', 'ELECTRICAL', 'AC_SERVICE', 'APPLIANCE_REPAIR', 'CARPENTRY', 'PAINTING', 'CLEANING', 'CCTV_INSTALLATION', 'COMPUTER_REPAIR', 'PEST_CONTROL', 'OTHER']

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/60 ${className}`} />
}

export default function AdminTechniciansPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<TechnicianStats | null>(null)
  const [bookings, setBookings] = useState<TechnicianBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [assigning, setAssigning] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 20 }
    if (status) params.status = status
    if (category) params.category = category
    technicianApi.adminAllBookings(params).then(res => {
      setBookings(res.data)
      setTotalPages(res.pagination.totalPages)
      setTotal(res.pagination.total)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    technicianApi.adminStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => { load() }, [status, category, page])

  async function handleStatusUpdate(bookingId: string, newStatus: string) {
    try {
      await technicianApi.adminUpdateStatus(bookingId, newStatus)
      toast(`Status updated to ${STATUS_LABEL[newStatus] ?? newStatus}`, 'success')
      load()
    } catch (e: unknown) {
      toast((e as { error?: string })?.error ?? 'Update failed', 'error')
    }
  }

  const filtered = search
    ? bookings.filter(b =>
        b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.addressCity?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Operations</p>
          <h1 className="mt-1 font-serif text-4xl text-foreground">Technician Bookings</h1>
          <p className="mt-1 text-xs text-muted-foreground/80">{total} total</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-5">
        {!stats ? (
          Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-20 border border-border" />)
        ) : [
          { label: 'Total', value: stats.total, icon: Wrench, color: 'text-foreground' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-300' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-blue-300' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Revenue', value: fmt(stats.revenue), icon: IndianRupee, color: 'text-gold-text' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-border bg-card p-5">
            <Icon className={`mb-2 size-4 ${color}`} />
            <p className={`text-2xl font-light ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/80" aria-hidden="true" />
          <input
            aria-label="Search technicians"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, customer, city…"
            className="w-full border border-border bg-muted/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[#d5ae79] focus:outline-none"
          />
        </div>
        <label htmlFor="tech-status" className="sr-only">Filter by technician status</label>
        <select id="tech-status" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-[#d5ae79] focus:outline-none">
          {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-card">{(STATUS_LABEL[s] ?? s) || 'All Status'}</option>)}
        </select>
        <label htmlFor="tech-category" className="sr-only">Filter by category</label>
        <select id="tech-category" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
          className="border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-[#d5ae79] focus:outline-none">
          {CAT_OPTS.map(c => <option key={c} value={c} className="bg-card">{c ? c.replace(/_/g, ' ') : 'All Categories'}</option>)}
        </select>
      </div>

      {/* Status filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {['', 'PENDING', 'TECHNICIAN_ASSIGNED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'CANCELLED'].map(s => (
          <button type="button" key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition ${status === s ? 'bg-[#d5ae79] text-[#17151d]' : 'border border-border text-muted-foreground hover:border-[#d5ae79]/40 hover:text-gold-text'}`}>
            {STATUS_LABEL[s] || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-gold-text" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground/80">No bookings found</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">
                  <th className="px-5 py-3 text-left">Booking ID</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Service</th>
                  <th className="px-5 py-3 text-left">Technician</th>
                  <th className="px-5 py-3 text-left">Date / Time</th>
                  <th className="px-5 py-3 text-left">City</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(b => (
                  <tr key={b.id} className="transition hover:bg-muted/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{b.bookingNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-foreground/90">{b.customer?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground/80">{b.customer?.phone ?? b.customer?.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-foreground/90">{b.service?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground/80">{b.category.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {b.technician ? (
                        <p className="text-foreground/90">{b.technician.name}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground/80">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <p>{fmtDate(b.scheduledDate)}</p>
                      <p className="text-xs text-muted-foreground/80">{b.timeSlotStart}–{b.timeSlotEnd}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.addressCity}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{fmt(b.totalAmount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${STATUS_COLOR[b.status] ?? 'text-muted-foreground/80 bg-muted/60'}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) handleStatusUpdate(b.id, e.target.value) }}
                        className="border border-border bg-background px-2 py-1 text-xs text-muted-foreground focus:border-[#d5ae79] focus:outline-none">
                        <option value="" disabled>Change status</option>
                        {STATUS_OPTS.filter(s => s && s !== b.status).map(s => (
                          <option key={s} value={s} className="bg-card">{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3.5">
                      <Link href={`/admin/technicians/${b.id}`} className="text-gold-text hover:text-[#e8cfa9]">
                        <ArrowRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="border border-border px-4 py-2 text-xs text-muted-foreground disabled:opacity-30 hover:border-[#d5ae79]">
                ← Prev
              </button>
              <span className="text-xs text-muted-foreground/80">Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="border border-border px-4 py-2 text-xs text-muted-foreground disabled:opacity-30 hover:border-[#d5ae79]">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
