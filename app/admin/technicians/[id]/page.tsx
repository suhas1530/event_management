'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { technicianApi } from '@/lib/api'
import { useToast } from '@/app/providers'
import type { TechnicianBooking, Technician } from '@/lib/api'
import {
  ArrowLeft, Loader2, Wrench, MapPin, Phone, Star,
  User, Check, CheckCircle2, X
} from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', TECHNICIAN_ASSIGNED: 'Technician Assigned',
  TECHNICIAN_CONFIRMED: 'Technician Confirmed', TECHNICIAN_ON_THE_WAY: 'On The Way',
  TECHNICIAN_ARRIVED: 'Arrived', SERVICE_STARTED: 'In Progress',
  SERVICE_COMPLETED: 'Completed', PAYMENT_COMPLETED: 'Payment Complete',
  REVIEW_SUBMITTED: 'Reviewed', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'TECHNICIAN_ASSIGNED',
  TECHNICIAN_ASSIGNED: 'TECHNICIAN_CONFIRMED', TECHNICIAN_CONFIRMED: 'TECHNICIAN_ON_THE_WAY',
  TECHNICIAN_ON_THE_WAY: 'TECHNICIAN_ARRIVED', TECHNICIAN_ARRIVED: 'SERVICE_STARTED',
  SERVICE_STARTED: 'SERVICE_COMPLETED', SERVICE_COMPLETED: 'PAYMENT_COMPLETED',
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }
function fmtDt(s: string) { return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }

export default function AdminTechBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [booking, setBooking] = useState<TechnicianBooking | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedTech, setSelectedTech] = useState('')

  const load = () => {
    technicianApi.adminBookingById(id)
      .then(b => { setBooking(b); setSelectedTech(b.technicianId ?? '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    technicianApi.list({ isVerified: true, isAvailable: true, limit: 20 })
      .then(res => setTechnicians(res.data))
      .catch(() => {})
  }, [id])

  async function handleStatusUpdate(newStatus: string) {
    setUpdating(true)
    try {
      await technicianApi.adminUpdateStatus(id, newStatus)
      toast(`Status → ${STATUS_LABEL[newStatus] ?? newStatus}`, 'success')
      load()
    } catch (e: unknown) {
      toast((e as { error?: string })?.error ?? 'Update failed', 'error')
    } finally { setUpdating(false) }
  }

  async function handleAssignTechnician() {
    if (!selectedTech) return
    setUpdating(true)
    try {
      await technicianApi.adminAssignTechnician(id, selectedTech)
      toast('Technician assigned!', 'success')
      load()
    } catch (e: unknown) {
      toast((e as { error?: string })?.error ?? 'Assignment failed', 'error')
    } finally { setUpdating(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="size-8 animate-spin text-gold-text" />
    </div>
  )
  if (!booking) return (
    <div className="py-20 text-center text-sm text-muted-foreground">
      Booking not found.{' '}
      <Link href="/admin/technicians" className="text-gold-text hover:underline">← Back</Link>
    </div>
  )

  const nextStatus = NEXT_STATUS[booking.status]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/technicians" className="inline-flex items-center gap-2 text-xs text-muted-foreground/80 hover:text-gold-text">
          <ArrowLeft className="size-3" /> All technician bookings
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-gold-text">{booking.bookingNumber}</p>
            <h1 className="mt-1 font-serif text-3xl text-foreground">{booking.service?.name ?? 'Technician Service'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{booking.category.replace(/_/g, ' ')} · {fmtDate(booking.scheduledDate)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {nextStatus && (
              <button type="button" onClick={() => handleStatusUpdate(nextStatus)} disabled={updating}
                className="flex items-center gap-2 bg-[#d5ae79] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#17151d] hover:bg-[#e8cfa9] disabled:opacity-50">
                <CheckCircle2 className="size-4" />
                {updating ? 'Updating…' : `Mark: ${STATUS_LABEL[nextStatus]}`}
              </button>
            )}
            {!['CANCELLED','REJECTED','PAYMENT_COMPLETED','REVIEW_SUBMITTED'].includes(booking.status) && (
              <button type="button" onClick={() => handleStatusUpdate('CANCELLED')} disabled={updating}
                className="flex items-center gap-2 border border-red-500/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                <X className="size-4" /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="space-y-5 lg:col-span-2">
          {/* Customer */}
          <AdminSection title="Customer">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Name', booking.customer?.name],
                ['Email', booking.customer?.email],
                ['Phone', booking.customer?.phone],
              ].map(([k, v]) => v && (
                <div key={k as string}>
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">{k}</dt>
                  <dd className="mt-1 text-foreground/90">{v}</dd>
                </div>
              ))}
            </dl>
          </AdminSection>

          {/* Service details */}
          <AdminSection title="Service details">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Service', booking.service?.name],
                ['Category', booking.category.replace(/_/g, ' ')],
                ['Date', fmtDate(booking.scheduledDate)],
                ['Time slot', `${booking.timeSlotStart} – ${booking.timeSlotEnd}`],
                ['Request type', booking.requestType],
                ['Payment method', booking.paymentMethod ?? '—'],
              ].map(([k, v]) => v && (
                <div key={k as string}>
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">{k}</dt>
                  <dd className="mt-1 text-foreground/90">{v}</dd>
                </div>
              ))}
            </dl>
            {booking.customerNotes && (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">Customer description</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{booking.customerNotes}</p>
              </div>
            )}
          </AdminSection>

          {/* Address */}
          <AdminSection title="Service address">
            <p className="flex items-start gap-2 text-sm text-foreground/90">
              <MapPin className="mt-0.5 size-4 flex-shrink-0 text-gold-text" />
              {[booking.addressLine1, booking.addressLine2, booking.addressCity, booking.addressState, booking.addressPincode].filter(Boolean).join(', ')}
            </p>
            <p className="mt-1 ml-6 text-xs text-muted-foreground/80">{booking.addressLabel}</p>
          </AdminSection>

          {/* Assign technician */}
          <AdminSection title="Assign technician">
            {booking.technician ? (
              <div className="mb-4 flex items-center gap-4 border border-[#d5ae79]/20 bg-[#d5ae79]/5 p-4">
                <div className="relative size-12 overflow-hidden rounded-full border border-border bg-muted/60">
                  {booking.technician.avatar
                    ? <img src={booking.technician.avatar} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-muted-foreground">{booking.technician.name?.[0]}</div>}
                  {booking.technician.isVerified && (
                    <div className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#d5ae79]">
                      <Check className="size-2.5 text-[#0b0b0d]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{booking.technician.name}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="size-3 fill-[#d5ae79] text-gold-text" />{booking.technician.rating.toFixed(1)}</span>
                    <span>{booking.technician.completedJobs} jobs</span>
                  </div>
                </div>
                <a href={`tel:${booking.technician.phone}`}
                  className="ml-auto flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-[#d5ae79] hover:text-gold-text">
                  <Phone className="size-3.5" /> Call
                </a>
              </div>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">No technician assigned yet.</p>
            )}
            <div className="flex gap-3">
              <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)}
                className="flex-1 border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-[#d5ae79] focus:outline-none">
                <option value="">Select technician…</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id} className="bg-card">
                    {t.name} · {t.category.replace(/_/g, ' ')} · ★{t.rating.toFixed(1)}
                  </option>
                ))}
              </select>
              <button onClick={handleAssignTechnician} disabled={!selectedTech || updating}
                className="flex items-center gap-1.5 bg-[#d5ae79] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#17151d] hover:bg-[#e8cfa9] disabled:opacity-40" type="button">
                {updating ? <Loader2 className="size-4 animate-spin" /> : <User className="size-4" />}
                Assign
              </button>
            </div>
          </AdminSection>
        </div>

        {/* Right — pricing + timeline + status */}
        <div className="space-y-5">
          {/* Status control */}
          <AdminSection title="Change status">
            <div className="flex flex-col gap-1.5">
              {Object.entries(STATUS_LABEL).filter(([k]) => k && k !== booking.status).map(([k, label]) => (
                <button type="button" key={k} onClick={() => handleStatusUpdate(k)} disabled={updating}
                  className="flex items-center justify-between border border-border px-3 py-2.5 text-sm text-muted-foreground transition hover:border-[#d5ae79]/40 hover:text-gold-text disabled:opacity-40">
                  <span>{label}</span>
                  <Check className="size-3.5 opacity-0 hover:opacity-100" />
                </button>
              ))}
            </div>
          </AdminSection>

          {/* Pricing */}
          <AdminSection title="Pricing">
            <div className="flex flex-col gap-2 text-sm">
              {[
                ['Est. Service', fmt(booking.estimatedPrice)],
                ['Visit charge', fmt(booking.visitCharge)],
                ...(booking.finalPrice ? [['Final price', fmt(booking.finalPrice)]] : []),
                ...(booking.materialCost > 0 ? [['Materials', fmt(booking.materialCost)]] : []),
                ...(booking.discountAmount > 0 ? [['Discount', `−${fmt(booking.discountAmount)}`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground/90">{v}</span>
                </div>
              ))}
              <div className="my-1 border-t border-border" />
              <div className="flex justify-between font-medium">
                <span className="text-foreground">Total</span>
                <span className="text-gold-text">{fmt(booking.totalAmount)}</span>
              </div>
              <div className="mt-1">
                <span className={`text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 ${booking.paymentStatus === 'COMPLETED' ? 'text-green-400 bg-green-500/15' : 'text-yellow-300 bg-yellow-500/10'}`}>
                  Payment: {booking.paymentStatus}
                </span>
              </div>
            </div>
          </AdminSection>

          {/* Timeline */}
          <AdminSection title="Timeline">
            {(booking.timeline?.length ?? 0) > 0 ? (
              <ol className="relative border-l border-border pl-5 space-y-4">
                {booking.timeline!.map((entry, i) => {
                  const isLast = i === (booking.timeline?.length ?? 0) - 1
                  return (
                    <li key={entry.id}>
                      <div className={`absolute -left-2 flex size-4 items-center justify-center rounded-full border ${isLast ? 'border-[#d5ae79] bg-[#d5ae79]' : 'border-border bg-background'}`} />
                      <p className="text-[10px] uppercase tracking-[0.15em] text-gold-text">{entry.title}</p>
                      {entry.description && <p className="mt-0.5 text-xs text-muted-foreground">{entry.description}</p>}
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80">{fmtDt(entry.createdAt)}</p>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground/80">No timeline entries</p>
            )}
          </AdminSection>

          {/* Review */}
          {booking.review && (
            <AdminSection title="Customer review">
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-4 ${i < booking.review!.rating ? 'fill-[#d5ae79] text-gold-text' : 'text-muted-foreground/80'}`} />
                ))}
              </div>
              {booking.review.comment && (
                <p className="text-sm leading-6 text-muted-foreground italic">"{booking.review.comment}"</p>
              )}
            </AdminSection>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">{title}</p>
      {children}
    </div>
  )
}
