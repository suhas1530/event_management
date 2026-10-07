'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { technicianApi } from '@/lib/api'
import { useToast } from '@/app/providers'
import type { TechnicianBooking } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'
import {
  ArrowLeft, Loader2, Wrench, MapPin, CalendarDays, Clock,
  User, Star, Phone, CheckCircle2, AlertCircle, X, Check
} from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Booking Placed', CONFIRMED: 'Booking Confirmed',
  TECHNICIAN_ASSIGNED: 'Technician Assigned', TECHNICIAN_CONFIRMED: 'Technician Confirmed',
  TECHNICIAN_ON_THE_WAY: 'Technician On The Way', TECHNICIAN_ARRIVED: 'Technician Arrived',
  SERVICE_STARTED: 'Service Started', SERVICE_COMPLETED: 'Service Completed',
  PAYMENT_COMPLETED: 'Payment Completed', REVIEW_SUBMITTED: 'Review Submitted',
  CANCELLED: 'Booking Cancelled', REJECTED: 'Booking Rejected',
}
const STATUS_ORDER = [
  'PENDING','CONFIRMED','TECHNICIAN_ASSIGNED','TECHNICIAN_CONFIRMED',
  'TECHNICIAN_ON_THE_WAY','TECHNICIAN_ARRIVED','SERVICE_STARTED',
  'SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED',
]

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }

export default function TechBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [booking, setBooking] = useState<TechnicianBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    technicianApi.bookingById(id).then(setBooking).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated, id])

  async function handleCancel() {
    if (!booking) return
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(true)
    try {
      await technicianApi.cancelBooking(booking.id, 'Cancelled by customer')
      toast('Booking cancelled', 'info')
      router.push('/dashboard')
    } catch (e: unknown) {
      toast((e as { error?: string })?.error ?? 'Cancellation failed', 'error')
    } finally { setCancelling(false) }
  }

  async function handleSubmitReview() {
    if (!booking) return
    setSubmittingReview(true)
    try {
      await technicianApi.submitReview(booking.id, review)
      toast('Review submitted! Thank you.', 'success')
      setShowReview(false)
      const updated = await technicianApi.bookingById(id)
      setBooking(updated)
    } catch (e: unknown) {
      toast((e as { error?: string })?.error ?? 'Failed to submit review', 'error')
    } finally { setSubmittingReview(false) }
  }

  if (loading || authLoading) return (
    <SiteShell>
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <span className="sr-only">Loading booking…</span>
        <Loader2 className="size-8 animate-spin text-[#d7b98b]" aria-hidden="true" />
      </div>
    </SiteShell>
  )
  if (!booking) return (
    <SiteShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-white/50">Booking not found</p>
        <Link href="/dashboard" className="mt-3 text-xs text-[#d7b98b] hover:underline">← Dashboard</Link>
      </div>
    </SiteShell>
  )

  const currentStatusIdx = STATUS_ORDER.indexOf(booking.status)
  const isCancellable = ['PENDING','CONFIRMED','TECHNICIAN_ASSIGNED'].includes(booking.status)
  const canReview = ['SERVICE_COMPLETED','PAYMENT_COMPLETED'].includes(booking.status) && !booking.review

  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-5 py-10 lg:px-0">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white">{booking.service?.name ?? 'Technician Service'}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/50">
              <Wrench className="size-3.5 text-[#d7b98b]" aria-hidden="true" />
              {booking.category.replace(/_/g, ' ')}
            </p>
            <p className="mt-1 font-mono text-xs text-[#d7b98b]">{booking.bookingNumber}</p>
            <p className={`mt-2 text-sm font-medium`}>{STATUS_LABEL[booking.status] ?? booking.status}</p>
          </div>
          <div className="flex gap-3">
            {canReview && (
              <button type="button" onClick={() => setShowReview(true)}
                className="flex items-center gap-2 bg-[#d7b98b] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
                <Star className="size-4" /> Leave Review
              </button>
            )}
            {isCancellable && (
              <button type="button" onClick={handleCancel} disabled={cancelling}
                className="flex items-center gap-2 border border-red-500/30 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                <X className="size-4" /> {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Details */}
          <div className="space-y-5 lg:col-span-2">
            {/* Info cards */}
            <Section title="Service details">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ['Service', booking.service?.name],
                  ['Category', booking.category.replace(/_/g, ' ')],
                  ['Date', fmtDate(booking.scheduledDate)],
                  ['Time', `${booking.timeSlotStart} – ${booking.timeSlotEnd}`],
                  ['Status', STATUS_LABEL[booking.status]],
                  ['Payment', booking.paymentMethod ?? 'Not selected'],
                ].map(([k, v]) => v && (
                  <div key={k as string}>
                    <dt className="text-[10px] uppercase tracking-[0.15em] text-white/35">{k}</dt>
                    <dd className="mt-1 text-white/80">{v}</dd>
                  </div>
                ))}
              </dl>
              {booking.customerNotes && (
                <div className="mt-4 border-t border-white/8 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Your description</p>
                  <p className="mt-1 text-sm leading-6 text-white/60">{booking.customerNotes}</p>
                </div>
              )}
            </Section>

            {/* Address */}
            <Section title="Service address">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 flex-shrink-0 text-[#d7b98b]" />
                <p className="text-sm text-white/70">
                  {[booking.addressLine1, booking.addressLine2, booking.addressCity, booking.addressState, booking.addressPincode].filter(Boolean).join(', ')}
                </p>
              </div>
              <p className="mt-1 ml-7 text-xs text-white/35">{booking.addressLabel}</p>
            </Section>

            {/* Technician */}
            {booking.technician ? (
              <Section title="Your technician">
                <div className="flex items-center gap-4">
                  <div className="relative size-14 flex-shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
                    {booking.technician.avatar
                      ? <img src={booking.technician.avatar} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-xl text-white/40">{booking.technician.name?.[0]}</div>}
                    {booking.technician.isVerified && (
                      <div className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[#d7b98b]">
                        <Check className="size-3 text-[#0b0b0d]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{booking.technician.name}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Star className="size-3 fill-[#d7b98b] text-[#d7b98b]" />{booking.technician.rating.toFixed(1)}</span>
                      <span>{booking.technician.completedJobs} jobs</span>
                      <span>{booking.technician.experience}y exp</span>
                    </div>
                  </div>
                  <a href={`tel:${booking.technician.phone}`}
                    className="ml-auto flex items-center gap-1.5 border border-white/15 px-3 py-2 text-xs text-white/50 hover:border-[#d7b98b] hover:text-[#d7b98b]">
                    <Phone className="size-3.5" /> Call
                  </a>
                </div>
              </Section>
            ) : (
              <div className="border border-white/10 bg-[#111114] p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Technician</p>
                <p className="mt-2 text-sm text-white/50">A technician will be assigned to your booking shortly.</p>
              </div>
            )}
          </div>

          {/* Right — pricing + timeline */}
          <div className="space-y-5">
            <Section title="Price summary">
              <div className="flex flex-col gap-2 text-sm">
                <PriceLine label="Service charge" value={fmt(booking.estimatedPrice)} />
                <PriceLine label="Visit charge" value={fmt(booking.visitCharge)} />
                {booking.materialCost > 0 && <PriceLine label="Materials" value={fmt(booking.materialCost)} />}
                {booking.discountAmount > 0 && <PriceLine label="Discount" value={`−${fmt(booking.discountAmount)}`} />}
                <div className="my-1 border-t border-white/10" />
                <div className="flex justify-between font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-[#d7b98b]">{fmt(booking.totalAmount)}</span>
                </div>
                {booking.paidAmount > 0 && <PriceLine label="Paid" value={fmt(booking.paidAmount)} green />}
                {booking.balanceAmount > 0 && <PriceLine label="Balance due" value={fmt(booking.balanceAmount)} red />}
              </div>
            </Section>

            {/* Timeline */}
            <Section title="Booking timeline">
              {(booking.timeline?.length ?? 0) > 0 ? (
                <ol className="relative border-l border-white/15 pl-5 space-y-5">
                  {booking.timeline!.map((entry, i) => {
                    const isLast = i === (booking.timeline?.length ?? 0) - 1
                    return (
                      <li key={entry.id}>
                        <div className={`absolute -left-2 flex size-4 items-center justify-center rounded-full border ${isLast ? 'border-[#d7b98b] bg-[#d7b98b]' : 'border-white/20 bg-[#0b0b0d]'}`}>
                          {isLast && <div className="size-1.5 rounded-full bg-[#0b0b0d]" />}
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#d7b98b]">{entry.title}</p>
                        {entry.description && <p className="mt-0.5 text-xs text-white/50">{entry.description}</p>}
                        <p className="mt-0.5 text-[10px] text-white/25">
                          {new Date(entry.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <p className="text-xs text-white/30">Timeline updates will appear here.</p>
              )}
            </Section>
          </div>
        </div>
      </main>

      {/* Review modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md border border-white/15 bg-[#111114] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-white">Rate your experience</h2>
              <button type="button" onClick={() => setShowReview(false)}><X className="size-5 text-white/40 hover:text-white" /></button>
            </div>
            <div className="mb-4 flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setReview(r => ({ ...r, rating: n }))}>
                  <Star className={`size-7 transition ${n <= review.rating ? 'fill-[#d7b98b] text-[#d7b98b]' : 'text-white/20'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={review.comment}
              onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
              rows={4}
              placeholder="Tell us about your experience with the technician…"
              className="w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#d7b98b] focus:outline-none resize-none"
            />
            <button type="button" onClick={handleSubmitReview} disabled={submittingReview}
              className="mt-4 w-full bg-[#d7b98b] py-3 text-[11px] uppercase tracking-[0.2em] text-[#1c1915] hover:bg-[#e8cfa0] disabled:opacity-50">
              {submittingReview ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </SiteShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-[#111114] p-5">
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-white/35">{title}</p>
      {children}
    </div>
  )
}

function PriceLine({ label, value, green, red }: { label: string; value: string; green?: boolean; red?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className={green ? 'text-green-400' : red ? 'text-red-300' : 'text-white/70'}>{value}</span>
    </div>
  )
}
