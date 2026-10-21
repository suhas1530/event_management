'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { adminApi } from '@/lib/api'
import type { Booking, Quote, Message } from '@/lib/api'
import {
  ArrowLeft, Loader2, Send, Check, Save, FileText,
  UserCheck, Clock, ChevronDown, X
} from 'lucide-react'

const STATUS_OPTIONS = [
  'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'CUSTOMER_APPROVAL',
  'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED',
]
const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Requested', PENDING_REVIEW: 'Under Review', QUOTED: 'Quoted',
  CUSTOMER_APPROVAL: 'Awaiting Approval', PAYMENT_PENDING: 'Payment Due',
  CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
  CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}
const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'text-blue-300', PENDING_REVIEW: 'text-yellow-300', QUOTED: 'text-purple-300',
  CUSTOMER_APPROVAL: 'text-orange-300', PAYMENT_PENDING: 'text-red-300',
  CONFIRMED: 'text-gold-text', IN_PROGRESS: 'text-green-300', COMPLETED: 'text-green-400',
  CANCELLED: 'text-muted-foreground/80', REJECTED: 'text-red-400',
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function fmtTime(s: string) { return new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

type Tab = 'overview' | 'quote' | 'messages' | 'timeline' | 'documents'

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [quoteForm, setQuoteForm] = useState({ items: '', notes: '', validDays: '7', discount: '0', tax: '18' })
  const [creatingQuote, setCreatingQuote] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const [b, m] = await Promise.all([
        adminApi.booking(id),
        adminApi.messages(id).catch(() => []),
      ])
      setBooking(b)
      setMessages(m)
      setInternalNotes(b.internalNotes ?? '')
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleStatusChange(newStatus: string) {
    if (!booking) return
    setStatusUpdating(true)
    try {
      await adminApi.updateBooking(id, { status: newStatus })
      await load()
    } catch {}
    finally { setStatusUpdating(false) }
  }

  async function handleSaveNotes() {
    if (!booking) return
    setSavingNotes(true)
    try {
      await adminApi.updateBooking(id, { internalNotes })
    } catch {}
    finally { setSavingNotes(false) }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!msgText.trim()) return
    setSendingMsg(true)
    try {
      const msg = await adminApi.sendMessage(id, msgText)
      setMessages(prev => [...prev, msg])
      setMsgText('')
    } catch {} finally { setSendingMsg(false) }
  }

  async function handleCreateQuote() {
    if (!booking) return
    // Parse items from a simple "Name,qty,price" per line format
    const lines = quoteForm.items.trim().split('\n').filter(l => l.trim())
    if (!lines.length) { alert('Add at least one item: Name, Qty, Price per line'); return }
    const items = lines.map(line => {
      const [name, qtyStr, priceStr] = line.split(',').map(s => s.trim())
      const quantity = parseInt(qtyStr ?? '1') || 1
      const unitPrice = parseFloat(priceStr ?? '0') || 0
      return { serviceId: booking.eventId, name, quantity, unitPrice, totalPrice: quantity * unitPrice }
    })
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
    const discount = parseFloat(quoteForm.discount) || 0
    const tax = ((subtotal - discount) * parseFloat(quoteForm.tax)) / 100
    const total = subtotal - discount + tax
    const validUntil = new Date(Date.now() + parseInt(quoteForm.validDays) * 86400000).toISOString()

    setCreatingQuote(true)
    try {
      const q = await adminApi.createQuote(id, { bookingId: id, items, subtotal, taxAmount: tax, discountAmount: discount, totalAmount: total, validUntil, notes: quoteForm.notes })
      await adminApi.sendQuote(id, q.id)
      alert('Quote created and sent to customer!')
      await load()
      setTab('overview')
    } catch (e: unknown) {
      alert((e as { error?: string })?.error ?? 'Failed to create quote')
    } finally { setCreatingQuote(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-gold-text" /></div>
  if (!booking) return <div className="py-20 text-center text-sm text-muted-foreground">Booking not found</div>

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-xs text-muted-foreground/80 hover:text-gold-text">
          <ArrowLeft className="size-3" /> All bookings
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-gold-text">{booking.bookingNumber}</p>
            <h1 className="mt-1 font-serif text-3xl text-foreground">{booking.event?.title ?? 'Booking'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.user?.name} · {fmtDate(booking.eventDate)} · {booking.guestCount} guests
            </p>
          </div>
          {/* Status selector */}
          <div className="flex items-center gap-3">
            {statusUpdating && <Loader2 className="size-4 animate-spin text-gold-text" />}
            <select value={booking.status} onChange={e => handleStatusChange(e.target.value)}
              className={`border border-border bg-card px-3 py-2 text-sm focus:border-[#d5ae79] focus:outline-none ${STATUS_COLORS[booking.status]}`}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="text-foreground bg-card">{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {(['overview', 'quote', 'messages', 'timeline', 'documents'] as Tab[]).map(t => (
            <button type="button" key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition ${tab === t ? 'border-b-2 border-[#d5ae79] text-gold-text' : 'text-muted-foreground hover:text-foreground/90'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <AdminSection title="Customer">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                {[['Name', booking.user?.name], ['Email', booking.user?.email], ['Phone', booking.user?.phone ?? '—']].map(([k, v]) => (
                  <div key={k as string}><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">{k}</dt><dd className="mt-1 text-foreground/90">{v}</dd></div>
                ))}
              </dl>
            </AdminSection>

            <AdminSection title="Event details">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                {[
                  ['Event', booking.event?.title],
                  ['Date', fmtDate(booking.eventDate)],
                  ['Guests', `${booking.guestCount}`],
                  ['Venue', booking.venue?.name ?? '—'],
                  ['Package', booking.package?.name ?? '—'],
                  ['Budget', booking.budget ? fmt(booking.budget) : '—'],
                  ['Notes', booking.notes ?? '—'],
                  ['Special requests', booking.specialRequests ?? '—'],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string}><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">{k}</dt><dd className="mt-1 text-foreground/90">{v}</dd></div>
                ))}
              </dl>
            </AdminSection>

            <AdminSection title="Internal notes">
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={4}
                placeholder="Internal notes visible to admin only…"
                className="w-full bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/80 focus:outline-none resize-none" />
              <button onClick={handleSaveNotes} disabled={savingNotes}
                className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline disabled:opacity-50" type="button">
                <Save className="size-3" /> {savingNotes ? 'Saving…' : 'Save notes'}
              </button>
            </AdminSection>
          </div>

          <div className="space-y-5">
            <AdminSection title="Financials">
              <div className="space-y-2 text-sm">
                {[['Subtotal', fmt(booking.subtotal)], ['Tax', fmt(booking.taxAmount)], ['Discount', `-${fmt(booking.discountAmount)}`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="text-muted-foreground">{v}</span></div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
                  <span className="text-foreground">Total</span><span className="text-gold-text">{fmt(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground/80">Paid</span><span className="text-green-400">{fmt(booking.paidAmount)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground/80">Balance</span><span className="text-red-300">{fmt(booking.balanceAmount)}</span></div>
              </div>
            </AdminSection>

            <AdminSection title="Quick actions">
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => setTab('quote')}
                  className="flex items-center gap-2 border border-border px-4 py-2.5 text-xs text-muted-foreground transition hover:border-[#d5ae79] hover:text-gold-text">
                  <FileText className="size-4" /> Create / view quote
                </button>
                <button type="button" onClick={() => setTab('messages')}
                  className="flex items-center gap-2 border border-border px-4 py-2.5 text-xs text-muted-foreground transition hover:border-[#d5ae79] hover:text-gold-text">
                  <Send className="size-4" /> Send message
                </button>
                <button type="button" onClick={() => handleStatusChange('CONFIRMED')} disabled={booking.status === 'CONFIRMED'}
                  className="flex items-center gap-2 border border-green-500/30 px-4 py-2.5 text-xs text-green-400 transition hover:bg-green-500/10 disabled:opacity-30">
                  <Check className="size-4" /> Mark confirmed
                </button>
                <button type="button" onClick={() => handleStatusChange('CANCELLED')} disabled={booking.status === 'CANCELLED'}
                  className="flex items-center gap-2 border border-red-500/30 px-4 py-2.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-30">
                  <X className="size-4" /> Cancel booking
                </button>
              </div>
            </AdminSection>
          </div>
        </div>
      )}

      {/* Quote */}
      {tab === 'quote' && (
        <div className="max-w-2xl">
          {booking.quotes && booking.quotes.length > 0 ? (
            <div className="mb-8 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Existing quotes</p>
              {booking.quotes.map((q: Quote) => (
                <div key={q.id} className="border border-border p-5">
                  <div className="flex justify-between mb-3">
                    <p className="text-sm text-foreground">Quote v{q.version} — {fmt(q.totalAmount)}</p>
                    <span className={`text-[9px] uppercase tracking-[0.12em] ${q.status === 'APPROVED' ? 'text-green-400' : q.status === 'SENT' ? 'text-gold-text' : 'text-muted-foreground/80'}`}>{q.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Valid until {fmtDate(q.validUntil)}</p>
                </div>
              ))}
            </div>
          ) : null}

          <AdminSection title="Create new quote">
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="q-items" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Line items (Name, Qty, Price per line)</label>
                <textarea id="q-items" value={quoteForm.items} onChange={e => setQuoteForm(p => ({ ...p, items: e.target.value }))}
                  rows={5} placeholder={"Decoration, 1, 25000\nPhotography, 1, 15000\nCake, 1, 5000"}
                  className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[#d5ae79] focus:outline-none resize-none" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="q-discount" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Discount (₹)</label>
                  <input id="q-discount" type="number" value={quoteForm.discount} onChange={e => setQuoteForm(p => ({ ...p, discount: e.target.value }))}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#d5ae79] focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="q-tax" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Tax (%)</label>
                  <input id="q-tax" type="number" value={quoteForm.tax} onChange={e => setQuoteForm(p => ({ ...p, tax: e.target.value }))}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#d5ae79] focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="q-valid-days" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Valid for (days)</label>
                  <input id="q-valid-days" type="number" value={quoteForm.validDays} onChange={e => setQuoteForm(p => ({ ...p, validDays: e.target.value }))}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#d5ae79] focus:outline-none" />
                </div>
              </div>
              <div>
                <label htmlFor="q-notes" className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Notes for customer</label>
                <textarea id="q-notes" value={quoteForm.notes} onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[#d5ae79] focus:outline-none resize-none" />
              </div>
              <button onClick={handleCreateQuote} disabled={creatingQuote}
                className="flex items-center gap-2 bg-[#d5ae79] px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#17151d] hover:bg-[#e8cfa9] disabled:opacity-50" type="button">
                <FileText className="size-4" /> {creatingQuote ? 'Creating…' : 'Create & send quote'}
              </button>
            </div>
          </AdminSection>
        </div>
      )}

      {/* Messages */}
      {tab === 'messages' && (
        <div className="max-w-2xl flex flex-col" style={{ height: '60vh' }}>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
            {messages.length === 0
              ? <p className="py-16 text-center text-sm text-muted-foreground/80">No messages yet</p>
              : messages.map(m => {
                  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'].includes(m.sender?.role ?? '')
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 text-sm leading-6 ${isAdmin ? 'bg-[#d5ae79] text-[#17151d]' : 'border border-border bg-muted text-foreground/80'}`}>
                        {!isAdmin && <p className="text-[10px] uppercase tracking-[0.1em] mb-1 opacity-50">{m.sender?.name}</p>}
                        {m.content}
                        <p className={`mt-1 text-[10px] ${isAdmin ? 'text-foreground/60' : 'text-muted-foreground/80'}`}>{fmtTime(m.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-3 border-t border-border pt-4">
            <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Message to customer…"
              className="flex-1 border border-border bg-muted/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-[#d5ae79] focus:outline-none" />
            <button type="submit" disabled={sendingMsg || !msgText.trim()}
              className="bg-[#d5ae79] px-4 py-3 text-[#17151d] hover:bg-[#e8cfa9] disabled:opacity-40">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="max-w-lg">
          {!booking.timeline?.length
            ? <p className="py-16 text-center text-sm text-muted-foreground/80">No timeline entries</p>
            : (
              <ol className="relative border-l border-border pl-6 space-y-8">
                {booking.timeline.map((entry, i) => (
                  <li key={entry.id}>
                    <div className={`absolute -left-[25px] flex size-4 items-center justify-center rounded-full border ${i === (booking.timeline?.length ?? 0) - 1 ? 'border-[#d5ae79] bg-[#d5ae79]' : 'border-border bg-card'}`} />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold-text">{entry.title}</p>
                    {entry.description && <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/80">{fmtDate(entry.createdAt)} {fmtTime(entry.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
        </div>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div className="max-w-xl">
          {!booking.documents?.length
            ? <p className="py-16 text-center text-sm text-muted-foreground/80">No documents uploaded</p>
            : <div className="space-y-2">
              {booking.documents?.map((d: any) => (
                <a key={d.id} href={d.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 border border-border px-4 py-3 text-sm text-foreground/90 hover:border-[#d5ae79]/30">
                  <FileText className="size-4 text-gold-text" />
                  <span className="flex-1">{d.name}</span>
                  <span className="text-xs text-muted-foreground/80">{(d.size / 1024).toFixed(0)} KB</span>
                </a>
              ))}
            </div>}
        </div>
      )}
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
