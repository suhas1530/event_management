'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { bookingsApi } from '@/lib/api'
import type { Booking, Quote, TimelineEntry, Message } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle,
  Send, Check, X, CreditCard, CalendarDays, Users, MapPin,
  MessageCircle, FileText, ReceiptText, ChevronDown, ChevronUp
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', REQUESTED: 'Booking Requested', PENDING_REVIEW: 'Planner Reviewing',
  QUOTED: 'Quote Prepared', CUSTOMER_APPROVAL: 'Awaiting Your Approval',
  PAYMENT_PENDING: 'Payment Due', CONFIRMED: 'Booking Confirmed',
  IN_PROGRESS: 'Event in Progress', COMPLETED: 'Event Completed',
  CANCELLED: 'Booking Cancelled', REJECTED: 'Booking Rejected',
}
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-white/40', REQUESTED: 'text-blue-300', PENDING_REVIEW: 'text-yellow-300',
  QUOTED: 'text-purple-300', CUSTOMER_APPROVAL: 'text-orange-300', PAYMENT_PENDING: 'text-red-300',
  CONFIRMED: 'text-[#d7b98b]', IN_PROGRESS: 'text-green-300', COMPLETED: 'text-green-400',
  CANCELLED: 'text-white/30', REJECTED: 'text-red-400',
}

const TIMELINE_ORDER: string[] = [
  'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'CUSTOMER_APPROVAL',
  'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED',
]

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }
function fmtTime(s: string) { return new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

export default function BookingDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'quote' | 'messages' | 'timeline'>('overview')
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [approvingQuote, setApprovingQuote] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace('/login') }, [authLoading, isAuthenticated, router])

  const load = async () => {
    if (!id) return
    try {
      const [b, q, t, m] = await Promise.all([
        bookingsApi.byId(id),
        bookingsApi.quotes(id).catch(() => []),
        bookingsApi.timeline(id).catch(() => []),
        bookingsApi.messages(id).catch(() => []),
      ])
      setBooking(b); setQuotes(q); setTimeline(t); setMessages(m)
    } catch { setError('Booking not found') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated, id])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleApproveQuote(quoteId: string) {
    if (!booking) return
    setApprovingQuote(quoteId)
    try {
      await bookingsApi.approveQuote(booking.id, quoteId)
      await load()
    } catch (e: unknown) { alert((e as { error?: string })?.error ?? 'Failed to approve quote') }
    finally { setApprovingQuote(null) }
  }

  async function handleRejectQuote(quoteId: string) {
    if (!booking) return
    try {
      await bookingsApi.rejectQuote(booking.id, quoteId)
      await load()
    } catch {}
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!booking || !msgText.trim()) return
    setSendingMsg(true)
    try {
      const msg = await bookingsApi.sendMessage(booking.id, { content: msgText })
      setMessages(prev => [...prev, msg])
      setMsgText('')
    } catch {} finally { setSendingMsg(false) }
  }

  async function handleInitiatePayment() {
    if (!booking) return
    setPaymentLoading(true)
    try {
      const payment = await bookingsApi.initiatePayment(booking.id, {
        amount: booking.balanceAmount,
        method: 'BANK_TRANSFER',
        currency: 'INR',
      })
      alert(`Payment initiated!\n\nPayment ID: ${payment.id}\nAmount: ${fmt(payment.amount)}\n\nFor Razorpay/Stripe integration, connect a payment gateway.`)
      await load()
    } catch (e: unknown) {
      alert((e as { error?: string })?.error ?? 'Failed to initiate payment')
    } finally { setPaymentLoading(false) }
  }

  if (loading || authLoading) return (
    <Shell><div className="flex items-center justify-center py-40"><Loader2 className="size-8 animate-spin text-[#d7b98b]" /></div></Shell>
  )
  if (error || !booking) return (
    <Shell><div className="py-20 text-center"><p className="text-white/50">{error || 'Booking not found'}</p><Link href="/bookings" className="mt-4 inline-block text-xs text-[#d7b98b] hover:underline">← Back to bookings</Link></div></Shell>
  )

  const sentQuote = quotes.find(q => q.status === 'SENT')
  const approvedQuote = quotes.find(q => q.status === 'APPROVED')

  return (
    <Shell>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/bookings" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-[#d7b98b]">
          <ArrowLeft className="size-3" /> All bookings
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">{booking.bookingNumber}</p>
            <h1 className="mt-1 font-serif text-4xl text-white">{booking.event?.title ?? 'Your Event'}</h1>
            <p className={`mt-2 text-sm ${STATUS_COLORS[booking.status]}`}>{STATUS_LABELS[booking.status]}</p>
          </div>
          {booking.status === 'PAYMENT_PENDING' && (
            <button type="button" onClick={handleInitiatePayment} disabled={paymentLoading}
              className="flex items-center gap-2 bg-[#d7b98b] px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#1c1915] hover:bg-[#e8cfa0] disabled:opacity-50">
              <CreditCard className="size-4" />
              {paymentLoading ? 'Processing…' : `Pay ${fmt(booking.balanceAmount)}`}
            </button>
          )}
        </div>
      </div>

      {/* Alert — quote waiting for approval */}
      {sentQuote && (
        <div className="mb-6 border border-[#d7b98b]/30 bg-[#d7b98b]/8 p-5">
          <p className="font-medium text-white">A quote is waiting for your approval</p>
          <p className="mt-1 text-sm text-white/60">
            Total: <span className="text-[#d7b98b]">{fmt(sentQuote.totalAmount)}</span> · Valid until {fmtDate(sentQuote.validUntil)}
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => handleApproveQuote(sentQuote.id)} disabled={approvingQuote === sentQuote.id}
              className="flex items-center gap-2 bg-[#d7b98b] px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#1c1915] hover:bg-[#e8cfa0] disabled:opacity-50">
              <Check className="size-4" /> {approvingQuote === sentQuote.id ? 'Approving…' : 'Approve'}
            </button>
            <button type="button" onClick={() => handleRejectQuote(sentQuote.id)}
              className="flex items-center gap-2 border border-white/20 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/60 hover:border-red-400 hover:text-red-400">
              <X className="size-4" /> Decline
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-0 border-b border-white/10">
        {(['overview', 'quote', 'messages', 'timeline'] as const).map(t => (
          <button type="button" key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition ${activeTab === t ? 'border-b-2 border-[#d7b98b] text-[#d7b98b]' : 'text-white/40 hover:text-white/70'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Event details */}
            <Section title="Event details">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Event', booking.event?.title],
                  ['Date', fmtDate(booking.eventDate)],
                  ['Guests', `${booking.guestCount} guests`],
                  ['Venue', booking.venue?.name ?? '—'],
                  ['Package', booking.package?.name ?? '—'],
                  ['Location', booking.venue?.city ?? booking.event?.location ?? '—'],
                ].map(([k, v]) => v && (
                  <div key={k as string}>
                    <dt className="text-[10px] uppercase tracking-[0.15em] text-white/40">{k}</dt>
                    <dd className="mt-1 text-sm text-white/80">{v}</dd>
                  </div>
                ))}
              </dl>
              {booking.notes && <p className="mt-4 text-sm leading-6 text-white/50 border-t border-white/8 pt-4">{booking.notes}</p>}
            </Section>

            {/* Services */}
            {(booking.items?.length ?? 0) > 0 && (
              <Section title="Services included">
                <div className="flex flex-col gap-2">
                  {booking.items!.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-white/70">{item.service?.name ?? 'Service'} × {item.quantity}</span>
                      <span className="text-white/50">{fmt(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Price summary */}
          <div>
            <Section title="Price summary">
              <dl className="flex flex-col gap-3 text-sm">
                <PriceLine label="Subtotal" value={fmt(booking.subtotal)} />
                <PriceLine label="Tax (18% GST)" value={fmt(booking.taxAmount)} />
                {booking.discountAmount > 0 && <PriceLine label="Discount" value={`−${fmt(booking.discountAmount)}`} accent />}
                <div className="my-1 border-t border-white/10" />
                <PriceLine label="Total" value={fmt(booking.totalAmount)} bold />
                {booking.paidAmount > 0 && <PriceLine label="Paid" value={fmt(booking.paidAmount)} accent />}
                {booking.balanceAmount > 0 && <PriceLine label="Balance due" value={fmt(booking.balanceAmount)} red />}
              </dl>
              <div className="mt-4">
                <span className={`inline-block px-2 py-1 text-[9px] uppercase tracking-[0.1em] ${booking.paymentStatus === 'COMPLETED' ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/10 text-orange-300'}`}>
                  Payment: {booking.paymentStatus}
                </span>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* Quotes tab */}
      {activeTab === 'quote' && (
        <div>
          {quotes.length === 0 ? (
            <Empty icon={ReceiptText} title="No quotes yet" desc="Your event planner will prepare a quote for you shortly." />
          ) : (
            <div className="flex flex-col gap-4">
              {quotes.map(q => (
                <div key={q.id} className="border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7b98b]">Quote v{q.version}</p>
                      <p className="mt-1 text-2xl font-serif text-white">{fmt(q.totalAmount)}</p>
                    </div>
                    <span className={`px-3 py-1 text-[9px] uppercase tracking-[0.15em] ${
                      q.status === 'APPROVED' ? 'bg-green-500/15 text-green-400' :
                      q.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                      q.status === 'SENT' ? 'bg-[#d7b98b]/10 text-[#d7b98b]' : 'bg-white/5 text-white/40'
                    }`}>{q.status}</span>
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    {(q.items as any[]).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-2">
                        <span className="text-white/70">{item.name} × {item.quantity}</span>
                        <span className="text-white/50">{fmt(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-white/40 border-t border-white/8 pt-3">
                    <span>Subtotal: {fmt(q.subtotal)} · Tax: {fmt(q.taxAmount)} · Discount: {fmt(q.discountAmount)}</span>
                    <span>Valid until: {fmtDate(q.validUntil)}</span>
                    {q.notes && <span className="mt-2 text-white/50">{q.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages tab */}
      {activeTab === 'messages' && (
        <div className="flex flex-col" style={{ height: '60vh' }}>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
            {messages.length === 0
              ? <Empty icon={MessageCircle} title="No messages yet" desc="Send a message to your event planner." />
              : messages.map(m => {
                  const isMe = m.senderId === user?.id
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 text-sm leading-6 ${isMe ? 'bg-[#d7b98b] text-[#1c1915]' : 'border border-white/10 bg-white/5 text-white/80'}`}>
                        {!isMe && <p className="text-[10px] uppercase tracking-[0.1em] mb-1 opacity-60">{m.sender?.name}</p>}
                        {m.content}
                        <p className={`mt-1 text-[10px] ${isMe ? 'text-[#1c1915]/60' : 'text-white/30'}`}>{fmtTime(m.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-3 border-t border-white/10 pt-4">
            <input value={msgText} onChange={e => setMsgText(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#d7b98b] focus:outline-none" />
            <button type="submit" disabled={sendingMsg || !msgText.trim()}
              className="flex items-center gap-2 bg-[#d7b98b] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-[#1c1915] hover:bg-[#e8cfa0] disabled:opacity-40">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div className="max-w-xl">
          {timeline.length === 0
            ? <Empty icon={Clock} title="No timeline yet" desc="Updates will appear here as your booking progresses." />
            : (
              <ol className="relative border-l border-white/15 pl-6 space-y-8">
                {timeline.map((entry, i) => (
                  <li key={entry.id} className="relative">
                    <div className={`absolute -left-[25px] flex size-4 items-center justify-center rounded-full border ${i === timeline.length - 1 ? 'border-[#d7b98b] bg-[#d7b98b]' : 'border-white/30 bg-[#111114]'}`}>
                      {i === timeline.length - 1 && <div className="size-1.5 rounded-full bg-[#1c1915]" />}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7b98b]">{entry.title}</p>
                    {entry.description && <p className="mt-1 text-sm leading-6 text-white/60">{entry.description}</p>}
                    <p className="mt-1 text-[10px] text-white/30">{fmtDate(entry.createdAt)} at {fmtTime(entry.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-10">{children}</div>
    </SiteShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 p-5">
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-white/40">{title}</p>
      {children}
    </div>
  )
}

function PriceLine({ label, value, bold, accent, red }: { label: string; value: string; bold?: boolean; accent?: boolean; red?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={bold ? 'font-medium text-white' : 'text-white/50'}>{label}</dt>
      <dd className={`${bold ? 'font-medium text-white' : ''} ${accent ? 'text-[#d7b98b]' : ''} ${red ? 'text-red-300' : ''} ${!bold && !accent && !red ? 'text-white/50' : ''}`}>{value}</dd>
    </div>
  )
}

function Empty({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Icon className="mb-3 size-8 text-white/20" />
      <p className="text-sm text-white/50">{title}</p>
      <p className="mt-1 text-xs text-white/30">{desc}</p>
    </div>
  )
}
