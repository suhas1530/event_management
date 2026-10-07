'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApi, tokenStore, type EventProposal, type EventRequest } from '@/lib/api'
import { CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, MessageCircle, Phone, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react'

const REQUEST_STATUSES = [
  ['DRAFT', 'Draft'], ['REQUIREMENT_SUBMITTED', 'Requirement submitted'], ['UNDER_REVIEW', 'Under review'], ['EVENT_MANAGER_ASSIGNED', 'Event manager assigned'],
  ['REQUIREMENT_DISCUSSION', 'Requirement discussion'], ['PROPOSAL_PREPARING', 'Proposal preparing'], ['PROPOSAL_SENT', 'Proposal sent'],
  ['CUSTOMER_REVIEWING', 'Customer reviewing'], ['CHANGES_REQUESTED', 'Changes requested'], ['PROPOSAL_APPROVED', 'Proposal approved'],
  ['ADVANCE_PAYMENT_PENDING', 'Advance payment pending'], ['ADVANCE_PAYMENT_RECEIVED', 'Advance payment received'], ['EVENT_CONFIRMED', 'Event confirmed'],
  ['PLANNING_IN_PROGRESS', 'Planning in progress'], ['EVENT_PREPARATION', 'Event preparation'], ['EVENT_DAY', 'Event day'],
  ['EVENT_COMPLETED', 'Event completed'], ['FINAL_PAYMENT', 'Final payment'], ['COMPLETED', 'Completed'],
]
const labelForStatus = (status: string) => REQUEST_STATUSES.find(([value]) => value === status)?.[1] ?? status.replaceAll('_', ' ')
type ProposalLine = { name: string; quantity: string; unitPrice: string }
const display = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Not specified'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None selected'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function AdminEventRequestsPage() {
  const [requests, setRequests] = useState<EventRequest[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null)
  const [proposalHistory, setProposalHistory] = useState<EventProposal[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [adminId, setAdminId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [proposalLines, setProposalLines] = useState<ProposalLine[]>([{ name: '', quantity: '1', unitPrice: '' }])
  const [proposalNotes, setProposalNotes] = useState('')
  const [proposalMessage, setProposalMessage] = useState('')

  useEffect(() => {
    const token = tokenStore.getAdmin()
    if (token) {
      try { setAdminId(JSON.parse(atob(token.split('.')[1])).id ?? '') } catch {}
    }
    adminApi.eventRequests().then(data => {
      setRequests(data)
      setSelectedId(data[0]?.id ?? '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) { setSelectedRequest(null); return }
    setSelectedRequest(null)
    adminApi.eventRequest(selectedId).then(setSelectedRequest).catch(() => setSelectedRequest(null))
    adminApi.eventProposals(selectedId).then(setProposalHistory).catch(() => setProposalHistory([]))
  }, [selectedId])

  const filtered = useMemo(() => requests.filter(request => {
    const query = search.toLowerCase()
    const matchesText = !query || [request.requestNumber, request.eventType, request.city, request.customer?.name, request.customer?.email].some(value => value?.toLowerCase().includes(query))
    return matchesText && (!statusFilter || request.status === statusFilter)
  }), [requests, search, statusFilter])
  const selected = selectedRequest?.id === selectedId ? selectedRequest : null
  const statistics = [
    { label: 'New requests', value: requests.filter(request => request.status === 'REQUIREMENT_SUBMITTED').length, icon: Sparkles },
    { label: 'Under review', value: requests.filter(request => ['UNDER_REVIEW', 'EVENT_MANAGER_ASSIGNED', 'REQUIREMENT_DISCUSSION'].includes(request.status)).length, icon: Clock3 },
    { label: 'Proposals pending', value: requests.filter(request => ['PROPOSAL_PREPARING', 'PROPOSAL_SENT', 'CUSTOMER_REVIEWING', 'CHANGES_REQUESTED'].includes(request.status)).length, icon: MessageCircle },
    { label: 'Confirmed events', value: requests.filter(request => request.status === 'EVENT_CONFIRMED').length, icon: CheckCircle2 },
    { label: 'Upcoming events', value: requests.filter(request => ['EVENT_CONFIRMED', 'PLANNING_IN_PROGRESS', 'EVENT_PREPARATION', 'EVENT_DAY'].includes(request.status) && !!request.eventDate && new Date(request.eventDate) >= new Date()).length, icon: CalendarDays },
    { label: 'Completed events', value: requests.filter(request => ['EVENT_COMPLETED', 'FINAL_PAYMENT', 'COMPLETED'].includes(request.status)).length, icon: CheckCircle2 },
  ]

  async function changeStatus(id: string, status: string) {
    setSaving(true)
    try {
      const updated = await adminApi.updateEventRequest(id, { status })
      setRequests(current => current.map(request => request.id === id ? { ...request, ...updated } : request))
      setSelectedRequest(current => current?.id === id ? { ...current, ...updated } : current)
    } finally { setSaving(false) }
  }

  async function assignToMe(request: EventRequest) {
    if (!adminId) return
    setSaving(true)
    try {
      const updated = await adminApi.updateEventRequest(request.id, { assignedManagerId: adminId, status: 'EVENT_MANAGER_ASSIGNED' })
      setRequests(current => current.map(item => item.id === request.id ? { ...item, ...updated } : item))
      setSelectedRequest(current => current?.id === request.id ? { ...current, ...updated } : current)
    } finally { setSaving(false) }
  }

  async function createProposal() {
    if (!selected) return
    const items = proposalLines.filter(item => item.name.trim() && Number(item.unitPrice) >= 0).map(item => ({
      name: item.name.trim(), quantity: Number(item.quantity) || 1, unitPrice: Number(item.unitPrice),
    }))
    if (items.length === 0) { setProposalMessage('Add at least one priced item to the proposal.'); return }
    setSaving(true)
    setProposalMessage('')
    try {
      await adminApi.createEventProposal(selected.id, { items, notes: proposalNotes, taxRate: 0.18 })
      setProposalHistory(await adminApi.eventProposals(selected.id))
      setRequests(current => current.map(request => request.id === selected.id ? { ...request, status: 'PROPOSAL_SENT' } : request))
      setSelectedRequest(current => current?.id === selected.id ? { ...current, status: 'PROPOSAL_SENT' } : current)
      setProposalLines([{ name: '', quantity: '1', unitPrice: '' }])
      setProposalNotes('')
      setProposalMessage('Proposal sent. A new version will be created for future revisions.')
    } catch (error) {
      setProposalMessage((error as { error?: string }).error ?? 'Could not create proposal.')
    } finally { setSaving(false) }
  }

  // Padding and background come from the admin layout — the page only owns its
  // own content width, so it does not re-declare min-h-screen or page padding.
  return <div className="mx-auto w-full max-w-6xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#d7b98b]">Event planning workflow</p><h1 className="mt-2 font-serif text-4xl text-white">Event requests</h1><p className="mt-2 text-sm text-white/45">Review customer requirements and move each request through planning.</p></div>
        <span className="text-xs text-white/40">{requests.length} total requests</span>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">{statistics.map(({ label, value, icon: Icon }) => <div key={label} className="border border-white/10 bg-[#111114] p-4"><Icon className="mb-3 size-4 text-[#d7b98b]" /><p className="text-2xl text-white">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p></div>)}</div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <section className="min-w-0 border border-white/10 bg-[#111114]">
          <div className="flex flex-wrap gap-3 border-b border-white/10 p-4">
            <div className="relative min-w-48 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" aria-hidden="true" /><input aria-label="Search event requests" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search customer, event, city" className="w-full border border-white/10 bg-[#0b0b0d] py-2.5 pl-10 pr-3 text-xs text-white outline-none focus:border-[#d7b98b]" /></div>
            <label htmlFor="request-status-filter" className="sr-only">Filter by request status</label><select id="request-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="border border-white/10 bg-[#0b0b0d] px-3 py-2.5 text-xs text-white/70 outline-none focus:border-[#d7b98b]"><option value="">All statuses</option>{REQUEST_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          {loading ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-[#d7b98b]" /></div> : filtered.length === 0 ? <p className="px-5 py-14 text-center text-sm text-white/40">No event requests match these filters.</p> : <div className="overflow-x-auto"><table className="w-full min-w-190 text-left">
            <thead><tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.13em] text-white/35">{['Request', 'Customer', 'Event / Date', 'Guests', 'Location', 'Status'].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody>{filtered.map(request => <tr key={request.id} onClick={() => setSelectedId(request.id)} className={`cursor-pointer border-b border-white/5 text-xs transition hover:bg-white/3.5 ${selectedId === request.id ? 'bg-[#d7b98b]/6' : ''}`}>
              <td className="px-4 py-4 font-mono text-[#d7b98b]">{request.requestNumber}</td><td className="px-4 py-4 text-white/75">{request.customer?.name ?? 'Customer'}<span className="mt-1 block text-[10px] text-white/35">{request.customer?.email}</span></td><td className="px-4 py-4 text-white/70">{request.eventType.replaceAll('_', ' ')}<span className="mt-1 block text-[10px] text-white/35">{request.eventDate ? new Date(request.eventDate).toLocaleDateString('en-IN') : 'Flexible date'}</span></td><td className="px-4 py-4 text-white/60">{request.guestCount ?? '—'}</td><td className="px-4 py-4 text-white/60">{request.city || '—'}</td><td className="px-4 py-4"><span className="border border-white/10 px-2 py-1 text-[9px] text-white/60">{labelForStatus(request.status)}</span></td>
            </tr>)}</tbody>
          </table></div>}
        </section>

        <aside className="min-w-0 border border-white/10 bg-[#111114]">
          {!selected ? <div className="px-5 py-16 text-center text-sm text-white/40">Select an event request to review its details.</div> : <>
            <div className="border-b border-white/10 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] text-[#d7b98b]">{selected.requestNumber}</p><h2 className="mt-2 font-serif text-2xl text-white">{selected.eventType.replaceAll('_', ' ')}</h2></div><Sparkles className="size-5 text-[#d7b98b]" /></div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/45"><span className="flex items-center gap-1"><CalendarDays className="size-3" />{selected.eventDate ? new Date(selected.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date flexible'}</span><span className="flex items-center gap-1"><Users className="size-3" />{selected.guestCount ?? 'Open'} guests</span><span className="flex items-center gap-1"><MapPin className="size-3" />{selected.city ?? 'Location open'}</span></div>
            </div>
            <div className="space-y-5 p-5">
              <section><h3 className="mb-2 text-[9px] uppercase tracking-[0.16em] text-white/35">Customer</h3><p className="text-sm text-white">{selected.customer?.name}</p><p className="mt-1 break-all text-xs text-white/50">{selected.customer?.email}</p><p className="mt-1 text-xs text-white/50">{selected.customer?.phone || 'No phone number'}</p>
                <div className="mt-3 flex gap-2">{selected.customer?.phone && <><a href={`tel:${selected.customer.phone}`} aria-label="Call customer" className="flex size-9 items-center justify-center border border-white/15 text-white/65 hover:border-[#d7b98b] hover:text-[#d7b98b]"><Phone className="size-4" /></a><a href={`https://wa.me/${selected.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp customer" className="flex size-9 items-center justify-center border border-white/15 text-white/65 hover:border-green-400 hover:text-green-300"><MessageCircle className="size-4" /></a></>}</div>
              </section>
              <section><h3 className="mb-2 text-[9px] uppercase tracking-[0.16em] text-white/35">Budget</h3><p className="text-sm text-white/75">{selected.budgetLabel || 'Not sure yet'}</p></section>
              <section><h3 className="mb-2 text-[9px] uppercase tracking-[0.16em] text-white/35">Requirements</h3>{selected.requirements ? <dl className="max-h-72 space-y-2 overflow-y-auto">{Object.entries(selected.requirements).filter(([key, value]) => !['referenceImages'].includes(key) && value !== '' && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0)).map(([key, value]) => <div key={key} className="border-b border-white/5 pb-2"><dt className="text-[10px] capitalize text-white/35">{key.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`)}</dt><dd className="mt-1 wrap-break-word text-xs leading-5 text-white/70">{display(value)}</dd></div>)}</dl> : <div className="flex items-center gap-2 py-4 text-xs text-white/40"><Loader2 className="size-4 animate-spin" /> Loading request details</div>}</section>
              {(selected.referenceImages?.length ?? 0) > 0 && <section><h3 className="mb-2 text-[9px] uppercase tracking-[0.16em] text-white/35">Reference images</h3><div className="grid grid-cols-3 gap-2">{selected.referenceImages?.map((image, index) => <img key={index} src={image} alt={`Reference ${index + 1}`} className="aspect-square w-full object-cover" />)}</div></section>}
              {proposalHistory.length > 0 && <section><h3 className="mb-2 text-[9px] uppercase tracking-[0.16em] text-white/35">Proposal history</h3><div className="space-y-2">{proposalHistory.map(proposal => <div key={proposal.id} className="flex items-center justify-between gap-3 border border-white/10 px-3 py-2.5"><div><p className="text-xs text-white">Version {proposal.version}</p><p className="mt-1 text-[10px] text-white/40">{proposal.status.replaceAll('_', ' ')}</p></div><p className="text-xs text-[#d7b98b]">₹{proposal.totalAmount.toLocaleString('en-IN')}</p></div>)}</div></section>}
              <section className="border-t border-white/10 pt-4"><label htmlFor="req-status" className="mb-2 block text-[9px] uppercase tracking-[0.16em] text-white/35">Request status</label><select id="req-status" disabled={saving} value={selected.status} onChange={event => changeStatus(selected.id, event.target.value)} className="w-full border border-white/15 bg-[#0b0b0d] px-3 py-3 text-xs text-white outline-none focus:border-[#d7b98b]">{REQUEST_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <button type="button" disabled={saving || !adminId || selected.assignedManagerId === adminId} onClick={() => assignToMe(selected)} className="mt-3 w-full border border-[#d7b98b]/40 px-4 py-3 text-xs text-[#d7b98b] hover:bg-[#d7b98b]/6 disabled:opacity-40">{selected.assignedManagerId === adminId ? 'Assigned to you' : 'Assign request to me'}</button>
              </section>

              <section className="border-t border-white/10 pt-4">
                <div className="mb-3 flex items-center justify-between"><h3 className="text-[9px] uppercase tracking-[0.16em] text-white/35">Custom proposal</h3><button type="button" onClick={() => setProposalLines(current => [...current, { name: '', quantity: '1', unitPrice: '' }])} className="flex items-center gap-1 text-[10px] text-[#d7b98b]"><Plus className="size-3" /> Add item</button></div>
                <div className="space-y-2">{proposalLines.map((item, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_54px_90px_32px] gap-1.5">
                  <input value={item.name} onChange={event => setProposalLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, name: event.target.value } : line))} placeholder="Service" className="min-w-0 border border-white/10 bg-[#0b0b0d] px-2 py-2 text-xs text-white outline-none focus:border-[#d7b98b]" />
                  <input type="number" min="1" value={item.quantity} onChange={event => setProposalLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: event.target.value } : line))} aria-label="Quantity" className="w-full border border-white/10 bg-[#0b0b0d] px-2 py-2 text-xs text-white outline-none focus:border-[#d7b98b]" />
                  <input type="number" min="0" value={item.unitPrice} onChange={event => setProposalLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, unitPrice: event.target.value } : line))} aria-label="Unit price" placeholder="₹ each" className="w-full border border-white/10 bg-[#0b0b0d] px-2 py-2 text-xs text-white outline-none focus:border-[#d7b98b]" />
                  <button type="button" disabled={proposalLines.length === 1} onClick={() => setProposalLines(current => current.filter((_, lineIndex) => lineIndex !== index))} aria-label="Remove line item" className="flex items-center justify-center text-white/35 hover:text-red-300 disabled:opacity-20"><Trash2 className="size-3.5" /></button>
                </div>)}</div>
                <textarea value={proposalNotes} onChange={event => setProposalNotes(event.target.value)} rows={3} placeholder="Event manager notes" className="mt-3 w-full resize-y border border-white/10 bg-[#0b0b0d] px-3 py-2.5 text-xs text-white outline-none focus:border-[#d7b98b]" />
                <p className="mt-2 text-[10px] text-white/40">18% GST is calculated automatically. Submitting creates and sends the next proposal version.</p>
                {proposalMessage && <p role="status" className="mt-2 text-xs text-[#d7b98b]">{proposalMessage}</p>}
                <button type="button" disabled={saving} onClick={createProposal} className="mt-3 w-full bg-[#d7b98b] px-4 py-3 text-xs font-medium text-[#17130e] disabled:opacity-50">{saving ? 'Sending proposal…' : 'Create and send proposal'}</button>
              </section>
            </div>
          </>}
        </aside>
      </div>
  </div>
}
