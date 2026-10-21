'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, MapPin, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { eventRequestsApi, type EventProposal, type EventRequest } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'
import StatusBadge from '@/components/shared/StatusBadge'

export default function EventRequestDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [request, setRequest] = useState<EventRequest | null>(null)
  const [proposals, setProposals] = useState<EventProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalBusy, setProposalBusy] = useState(false)
  const [changeMessage, setChangeMessage] = useState('')
  const [proposalError, setProposalError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setLoading(false)
      router.replace(`/login?next=${encodeURIComponent(`/event-requests/${id}`)}`)
      return
    }
    Promise.all([eventRequestsApi.byId(id), eventRequestsApi.proposals(id)]).then(([eventRequest, eventProposals]) => {
      setRequest(eventRequest)
      setProposals(eventProposals)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [authLoading, id, isAuthenticated, router])

  async function approveProposal(proposalId: string) {
    setProposalBusy(true)
    setProposalError('')
    try {
      await eventRequestsApi.approveProposal(id, proposalId)
      setProposals(current => current.map(proposal => proposal.id === proposalId ? { ...proposal, status: 'APPROVED' } : proposal))
      setRequest(current => current ? { ...current, status: 'ADVANCE_PAYMENT_PENDING' } : current)
    } catch (error) { setProposalError((error as { error?: string }).error ?? 'Could not approve this proposal.') }
    finally { setProposalBusy(false) }
  }

  async function requestChanges(proposalId: string) {
    if (changeMessage.trim().length < 5) { setProposalError('Please describe the changes you would like.'); return }
    setProposalBusy(true)
    setProposalError('')
    try {
      const updated = await eventRequestsApi.requestProposalChanges(id, proposalId, changeMessage.trim())
      setProposals(current => current.map(proposal => proposal.id === proposalId ? updated : proposal))
      setRequest(current => current ? { ...current, status: 'CHANGES_REQUESTED' } : current)
      setChangeMessage('')
    } catch (error) { setProposalError((error as { error?: string }).error ?? 'Could not send your change request.') }
    finally { setProposalBusy(false) }
  }

  if (loading || authLoading) return <SiteShell><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-7 animate-spin text-gold-text" /></div></SiteShell>
  if (!request) return <SiteShell><main className="mx-auto max-w-2xl px-5 py-24 text-center text-muted-foreground">Event request not found.<Link className="ml-2 text-gold-text" href="/event-requests">Return to your requests</Link></main></SiteShell>

  const requirements = request.requirements ?? {}
  const services = Array.isArray(requirements.services) ? requirements.services as string[] : []
  const date = request.eventDate ? new Date(request.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date flexible'

  return <SiteShell>
    <main className="mx-auto max-w-4xl px-5 py-9 text-foreground">
      <Link href="/event-requests" className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="size-3.5" aria-hidden="true" /> My event requests</Link>
      <div className="mt-7 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-gold-text">{request.requestNumber}</p><h1 className="mt-2 font-serif text-4xl text-foreground">{request.eventType.replaceAll('_', ' ')}</h1></div>
        <StatusBadge status={request.status} size="sm" />
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Info icon={<CalendarDays className="size-4" />} label="Date" value={date} />
        <Info icon={<Users className="size-4" />} label="Guests" value={request.guestCount ? `${request.guestCount} expected` : 'Not specified'} />
        <Info icon={<MapPin className="size-4" />} label="Location" value={[request.city, requirements.preferredArea, requirements.venueAddress].filter(Boolean).join(', ') || 'Not specified'} />
      </div>
      <div className="mt-8 space-y-7">
        <section className="border-y border-border py-6"><h2 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Budget</h2><p className="mt-2 text-sm text-foreground/90">{request.budgetLabel || 'Not sure yet'}</p></section>
        <section className="border-b border-border pb-6"><h2 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Services requested</h2>{services.length ? <div className="mt-3 flex flex-wrap gap-2">{services.map(service => <span key={service} className="border border-border px-3 py-2 text-xs text-foreground/90">{service}</span>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No services selected</p>}</section>
        <section className="border-b border-border pb-6"><h2 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Additional requirements</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{String(requirements.additionalRequirements || 'No additional requirements shared.')}</p></section>
        {(request.referenceImages?.length ?? 0) > 0 && <section><h2 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reference images</h2><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{request.referenceImages?.map((image, index) => <img key={index} src={image} alt={`Event reference ${index + 1}`} className="aspect-square w-full border border-border object-cover" />)}</div></section>}
        {proposals.length > 0 && <section className="border-t border-border pt-7"><div className="flex items-center justify-between gap-4"><h2 className="font-serif text-2xl text-foreground">Your event proposal</h2><span className="text-xs text-muted-foreground">{proposals.length} version{proposals.length === 1 ? '' : 's'}</span></div>
          <div className="mt-4 space-y-4">{proposals.map(proposal => <article key={proposal.id} className="border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.15em] text-gold-text">Proposal v{proposal.version}</p><p className="mt-1 text-xs text-muted-foreground">{proposal.status.replaceAll('_', ' ')}</p></div><p className="text-xl text-foreground">₹{proposal.totalAmount.toLocaleString('en-IN')}</p></div>
            <div className="mt-4 divide-y divide-white/8">{proposal.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-4 py-2.5 text-sm"><span className="text-foreground/90">{item.name}<span className="ml-2 text-xs text-muted-foreground/80">× {item.quantity}</span></span><span className="shrink-0 text-foreground/90">₹{item.totalPrice.toLocaleString('en-IN')}</span></div>)}</div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground"><div className="flex justify-between"><span>Subtotal</span><span>₹{proposal.subtotal.toLocaleString('en-IN')}</span></div><div className="flex justify-between"><span>Tax</span><span>₹{proposal.taxAmount.toLocaleString('en-IN')}</span></div>{proposal.discountAmount > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{proposal.discountAmount.toLocaleString('en-IN')}</span></div>}</div>
            {proposal.notes && <p className="mt-4 border-l-2 border-[#d5ae79]/40 pl-3 text-sm leading-6 text-muted-foreground">{proposal.notes}</p>}
            {proposal.changeRequests.map((message, index) => <p key={index} className="mt-3 border border-orange-300/15 bg-orange-300/5 p-3 text-xs text-orange-100/70">Change requested: {message}</p>)}
            {proposal.status === 'SENT' && <div className="mt-5 border-t border-border pt-4"><textarea value={changeMessage} onChange={event => setChangeMessage(event.target.value)} rows={3} placeholder="Ask for a change, such as replacing DJ with live music." className="w-full resize-y border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d5ae79]" /><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={proposalBusy} onClick={() => requestChanges(proposal.id)} className="min-h-11 border border-border px-4 text-xs text-muted-foreground hover:border-[#d5ae79] disabled:opacity-50">Request changes</button><button type="button" disabled={proposalBusy} onClick={() => approveProposal(proposal.id)} className="inline-flex min-h-11 items-center gap-2 bg-[#d5ae79] px-4 text-xs font-medium text-[#17151d] disabled:opacity-50"><CheckCircle2 className="size-4" /> Approve proposal</button></div></div>}
          </article>)}</div>
          {proposalError && <p role="alert" className="mt-3 text-sm text-red-300">{proposalError}</p>}
        </section>}
        {request.status === 'ADVANCE_PAYMENT_PENDING' && <section className="border border-[#d5ae79]/25 bg-[#d5ae79]/6 p-5"><h2 className="font-serif text-xl text-foreground">Proposal approved</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Your event plan is approved. The event team will follow up with advance payment details before the event is confirmed.</p></section>}
        {request.status === 'DRAFT' && <Link href={`/plan-event?id=${request.id}`} className="inline-flex items-center border border-[#d5ae79] px-5 py-3 text-sm text-[#d5ae79] hover:bg-[#d5ae79]/10">Continue this draft</Link>}
        {['REQUIREMENT_SUBMITTED', 'UNDER_REVIEW'].includes(request.status) && <Link href={`/plan-event?id=${request.id}`} className="inline-flex items-center border border-[#d5ae79] px-5 py-3 text-sm text-[#d5ae79] hover:bg-[#d5ae79]/10">Edit requirements</Link>}
      </div>
    </main>
  </SiteShell>
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="border border-border bg-card p-4"><div className="flex items-center gap-2 text-gold-text">{icon}<span className="text-[10px] uppercase tracking-[0.15em]">{label}</span></div><p className="mt-3 text-sm text-foreground/90">{value}</p></div>
}
