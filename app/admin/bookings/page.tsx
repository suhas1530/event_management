'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import type { Booking } from '@/lib/api'
import { Search, ArrowRight, Loader2, Filter } from 'lucide-react'

const STATUSES = ['', 'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED']
const STATUS_LABELS: Record<string, string> = {
  '': 'All', REQUESTED: 'Requested', PENDING_REVIEW: 'Under Review', QUOTED: 'Quoted',
  PAYMENT_PENDING: 'Payment Due', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'text-info bg-info-muted', PENDING_REVIEW: 'text-warning bg-warning-muted',
  QUOTED: 'text-primary bg-primary-muted', PAYMENT_PENDING: 'text-destructive bg-destructive-muted',
  CONFIRMED: 'text-gold-text bg-gold/10', IN_PROGRESS: 'text-success bg-success-muted',
  COMPLETED: 'text-success bg-success-muted', CANCELLED: 'text-muted-foreground bg-muted/60',
  REJECTED: 'text-destructive bg-destructive-muted',
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit: 20 }
    if (status) params.status = status
    adminApi.bookings(params).then(res => {
      setBookings(res.data)
      setTotalPages(res.pagination.totalPages)
      setTotal(res.pagination.total)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [status, page])

  const filtered = search
    ? bookings.filter(b =>
        b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.event?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Operations</p>
          <h1 className="mt-1 font-serif text-4xl text-foreground">Bookings</h1>
          <p className="mt-1 text-xs text-muted-foreground">{total} total</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input aria-label="Search bookings" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, customer, event…"
            className="w-full border border-border bg-muted/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
        </div>
        <label htmlFor="booking-status" className="sr-only">Filter by booking status</label>
        <select id="booking-status" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none">
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
        </select>
      </div>

      {/* Status filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {['', 'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED'].map(s => (
          <button type="button" key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition ${status === s ? 'bg-gold text-gold-foreground' : 'border border-border text-muted-foreground hover:border-gold/40 hover:text-gold-text'}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-gold-text" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">No bookings found</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-5 py-3 text-left">ID</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Event</th>
                  <th className="px-5 py-3 text-left">Event Date</th>
                  <th className="px-5 py-3 text-left">Guests</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-left">Payment</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Created</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map(b => (
                  <tr key={b.id} className="transition hover:bg-muted/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{b.bookingNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-foreground/90">{b.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{b.user?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.event?.title ?? '—'}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(b.eventDate)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.guestCount}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{b.totalAmount > 0 ? fmt(b.totalAmount) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] uppercase tracking-[0.1em] ${b.paymentStatus === 'COMPLETED' ? 'text-success' : b.paymentStatus === 'PARTIAL' ? 'text-warning' : 'text-muted-foreground'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${STATUS_COLORS[b.status] ?? 'text-muted-foreground bg-muted/60'}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{fmtDate(b.createdAt)}</td>
                    <td className="px-3 py-3.5">
                      <Link href={`/admin/bookings/${b.id}`} className="text-gold-text hover:text-gold-soft">
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
                className="border border-border px-4 py-2 text-xs text-muted-foreground disabled:opacity-30 hover:border-gold">← Prev</button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="border border-border px-4 py-2 text-xs text-muted-foreground disabled:opacity-30 hover:border-gold">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
