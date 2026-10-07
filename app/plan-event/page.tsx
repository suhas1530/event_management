'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Sparkles, Upload, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { eventRequestsApi } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'

const EVENT_TYPES = [
  { value: 'BIRTHDAY', label: 'Birthday', icon: '🎂', intro: "Let's plan an unforgettable birthday celebration." },
  { value: 'BABY_SHOWER', label: 'Baby Shower', icon: '👶', intro: "Let's create a beautiful celebration for the mom-to-be." },
  { value: 'WEDDING', label: 'Wedding', icon: '💍', intro: "Let's start planning your special day." },
  { value: 'ENGAGEMENT', label: 'Engagement', icon: '💑', intro: "Let's make your engagement one to remember." },
  { value: 'RECEPTION', label: 'Reception', icon: '🥂', intro: 'Tell us how you picture your reception.' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: '🎉', intro: "Let's celebrate your story together." },
  { value: 'CORPORATE', label: 'Corporate Event', icon: '🏢', intro: 'Tell us about your corporate event requirements.' },
  { value: 'CONFERENCE', label: 'Conference', icon: '🎤', intro: 'We can coordinate the details of your conference.' },
  { value: 'HOUSEWARMING', label: 'Housewarming', icon: '🏠', intro: "Let's make your new place feel like home." },
  { value: 'NAMING_CEREMONY', label: 'Naming Ceremony', icon: '🪷', intro: 'Let us help plan a warm family celebration.' },
  { value: 'COLLEGE_EVENT', label: 'College Event', icon: '🎓', intro: 'Tell us what your campus event needs.' },
  { value: 'PRODUCT_LAUNCH', label: 'Product Launch', icon: '🚀', intro: 'Let us help make your launch memorable.' },
  { value: 'OTHER', label: 'Other Celebration', icon: '✨', intro: 'Tell us what you are celebrating.' },
]

const BUDGETS = ['Under ₹25,000', '₹25,000 – ₹50,000', '₹50,000 – ₹1,00,000', '₹1,00,000 – ₹2,50,000', '₹2,50,000 – ₹5,00,000', '₹5,00,000+', 'Not sure yet', 'Custom budget']
const SERVICE_GROUPS: Record<string, string[]> = {
  Decoration: ['Stage decoration', 'Balloon decoration', 'Floral decoration', 'Theme decoration', 'Entrance decoration', 'Table decoration', 'Ceiling decoration', 'Lighting decoration'],
  Catering: ['Vegetarian', 'Non-vegetarian', 'Both', 'South Indian cuisine', 'North Indian cuisine', 'Chinese cuisine', 'Continental cuisine', 'Breakfast', 'Lunch', 'Snacks', 'Dinner'],
  Photography: ['Photography', 'Videography', 'Candid photography', 'Traditional photography', 'Pre-event shoot', 'Drone photography'],
  Entertainment: ['DJ', 'Live music', 'Anchor / host', 'Dance performance', 'Games', 'Magic show', 'Kids entertainment'],
  Venue: ['Need help finding a venue', 'Venue already arranged'],
  Invitations: ['Digital invitation', 'Printed invitation', 'WhatsApp invitation'],
  'Personal styling': ['Makeup artist', 'Hair styling', 'Bridal makeup', 'Groom makeup'],
  Other: ['Transportation', 'Security', 'Cleaning', 'Return gifts', 'Event staff', 'Generator', 'Sound system', 'LED screen', 'Stage', 'Furniture'],
}
const VENUE_TYPES = ['Home', 'Apartment', 'Hotel', 'Banquet Hall', 'Convention Centre', 'Restaurant', 'Outdoor', 'Resort', 'Office', 'Community Hall', 'Other']
const STEP_LABELS = ['Event type', 'Date & guests', 'Location', 'Budget', 'Services', 'Details', 'References', 'Review']
const DRAFT_KEY = 'avan_event_request_draft'
const DRAFT_CONTENT_KEY = 'avan_event_request_content'

type EventForm = {
  eventType: string
  eventDate: string
  dateConfirmed: string
  alternativeDate: string
  startTime: string
  endTime: string
  guestCount: string
  venueStatus: string
  venueName: string
  venueAddress: string
  venueType: string
  city: string
  pincode: string
  preferredArea: string
  indoorOutdoor: string
  parking: string
  venueBudget: string
  budgetLabel: string
  customBudget: string
  services: string[]
  cuisine: string
  birthdayPerson: string
  birthdayName: string
  age: string
  theme: string
  cake: string
  childrenCount: string
  entertainment: string
  returnGifts: string
  motherName: string
  weddingBride: string
  weddingGroom: string
  weddingFunctions: string[]
  companyName: string
  corporateEventName: string
  corporateEventType: string
  avRequirements: string[]
  branding: string[]
  additionalRequirements: string
  referenceImages: string[]
}

const emptyForm: EventForm = {
  eventType: '', eventDate: '', dateConfirmed: 'yes', alternativeDate: '', startTime: '', endTime: '', guestCount: '',
  venueStatus: '', venueName: '', venueAddress: '', venueType: '', city: '', pincode: '', preferredArea: '',
  indoorOutdoor: '', parking: 'no', venueBudget: '', budgetLabel: '', customBudget: '', services: [], cuisine: '',
  birthdayPerson: '', birthdayName: '', age: '', theme: '', cake: '', childrenCount: '', entertainment: '', returnGifts: '',
  motherName: '', weddingBride: '', weddingGroom: '', weddingFunctions: [], companyName: '', corporateEventName: '',
  corporateEventType: '', avRequirements: [], branding: [], additionalRequirements: '', referenceImages: [],
}

const fieldClass = 'w-full border border-white/15 bg-[#111114] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#d7b98b]'
const labelClass = 'mb-2 block text-xs font-medium text-white/70'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-12 border px-4 py-3 text-left text-sm transition ${selected ? 'border-[#d7b98b] bg-[#d7b98b]/10 text-[#f4d6a4]' : 'border-white/12 bg-white/2.5 text-white/65 hover:border-white/30'}`}>
    <span className="flex items-center justify-between gap-3">{label}{selected && <Check className="size-4 shrink-0 text-[#d7b98b]" />}</span>
  </button>
}

export default function PlanEventPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [step, setStep] = useState(0)
  const [draftId, setDraftId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const eventMeta = EVENT_TYPES.find(item => item.value === form.eventType)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialType = params.get('type')?.toUpperCase()
    const hasInitialType = !!initialType && EVENT_TYPES.some(item => item.value === initialType)
    if (hasInitialType) setForm(current => ({ ...current, eventType: initialType! }))
    const id = params.get('id')
    if (id) {
      setDraftId(id)
      eventRequestsApi.byId(id).then(request => {
        if (!['DRAFT', 'REQUIREMENT_SUBMITTED', 'UNDER_REVIEW'].includes(request.status)) return router.replace('/dashboard')
        const saved = request.requirements as Partial<EventForm>
        setForm({ ...emptyForm, ...saved, eventType: request.eventType, eventDate: request.eventDate?.slice(0, 10) ?? '', guestCount: request.guestCount?.toString() ?? '', city: request.city ?? '', budgetLabel: request.budgetLabel ?? '' })
      }).catch(() => setError('We could not load this draft.'))
    } else if (!hasInitialType) {
      const localContent = localStorage.getItem(DRAFT_CONTENT_KEY)
      if (localContent) {
        try { setForm({ ...emptyForm, ...JSON.parse(localContent) as Partial<EventForm> }) } catch { localStorage.removeItem(DRAFT_CONTENT_KEY) }
      }
      const savedId = localStorage.getItem(DRAFT_KEY)
      if (savedId && isAuthenticated) {
        eventRequestsApi.byId(savedId).then(request => {
          if (!['DRAFT', 'REQUIREMENT_SUBMITTED', 'UNDER_REVIEW'].includes(request.status)) return
          const saved = request.requirements as Partial<EventForm>
          setDraftId(request.id)
          setForm({ ...emptyForm, ...saved, eventType: request.eventType, eventDate: request.eventDate?.slice(0, 10) ?? '', guestCount: request.guestCount?.toString() ?? '', city: request.city ?? '', budgetLabel: request.budgetLabel ?? '' })
        }).catch(() => localStorage.removeItem(DRAFT_KEY))
      }
    }
  }, [isAuthenticated, router])

  const selectedServices = useMemo(() => form.services, [form.services])
  const setField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => setForm(current => ({ ...current, [key]: value }))
  const toggleValue = (key: 'services' | 'weddingFunctions' | 'avRequirements' | 'branding', value: string) => {
    setForm(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] }))
  }

  function chooseType(value: string) {
    setField('eventType', value)
    setError('')
  }

  function requestPayload() {
    const { referenceImages, ...requirements } = form
    return {
      eventType: form.eventType,
      eventDate: form.eventDate ? new Date(`${form.eventDate}T12:00:00`).toISOString() : null,
      guestCount: form.guestCount ? Number(form.guestCount) : null,
      city: form.city,
      budgetLabel: form.budgetLabel === 'Custom budget' ? form.customBudget : form.budgetLabel,
      requirements: requirements as unknown as Record<string, unknown>,
      referenceImages,
    }
  }

  async function persistDraft() {
    if (!isAuthenticated) {
      localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(form))
      router.push(`/login?next=${encodeURIComponent('/plan-event')}`)
      return null
    }
    const payload = requestPayload()
    const record = draftId
      ? await eventRequestsApi.updateDraft(draftId, payload)
      : await eventRequestsApi.create({ ...payload, status: 'DRAFT' })
    setDraftId(record.id)
    localStorage.setItem(DRAFT_KEY, record.id)
    localStorage.removeItem(DRAFT_CONTENT_KEY)
    return record
  }

  async function saveDraft() {
    if (!form.eventType) { setError('Choose an event type before saving your draft.'); setStep(0); return }
    if (!isAuthenticated) {
      localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(form))
      setSavedMessage('Draft saved on this device. Sign in when you are ready to submit it.')
      setTimeout(() => setSavedMessage(''), 3500)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const record = await persistDraft()
      setSavedMessage(record?.status === 'DRAFT' ? 'Draft saved. You can continue any time from your dashboard.' : 'Your event requirements have been updated.')
      setTimeout(() => setSavedMessage(''), 3500)
    } catch (err) {
      setError((err as { error?: string })?.error ?? 'Could not save your draft.')
    } finally { setSubmitting(false) }
  }

  async function submitRequest() {
    if (!form.eventType) { setError('Choose an event type to continue.'); setStep(0); return }
    setSubmitting(true)
    setError('')
    try {
      const record = await persistDraft()
      if (!record) return
      if (record.status !== 'DRAFT') {
        router.push(`/event-requests/${encodeURIComponent(record.id)}`)
        return
      }
      const submitted = await eventRequestsApi.submit(record.id)
      localStorage.removeItem(DRAFT_KEY)
      router.push(`/event-request-submitted?id=${encodeURIComponent(submitted.id)}`)
    } catch (err) {
      setError((err as { error?: string })?.error ?? 'Your event request could not be submitted. Please try again.')
    } finally { setSubmitting(false) }
  }

  async function addReferences(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const remaining = 5 - form.referenceImages.length
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const validFiles = files.filter(file => allowedTypes.includes(file.type) && file.size <= 500_000).slice(0, remaining)
    if (validFiles.length !== files.length) setError('Choose up to 5 JPG, PNG, WebP or GIF images, each smaller than 500 KB.')
    const encoded = await Promise.all(validFiles.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })))
    setField('referenceImages', [...form.referenceImages, ...encoded])
    event.target.value = ''
  }

  function next() {
    setError('')
    if (step === 0 && !form.eventType) { setError('Choose an event type to continue.'); return }
    setStep(current => Math.min(current + 1, STEP_LABELS.length - 1))
  }

  function back() {
    setError('')
    setStep(current => Math.max(current - 1, 0))
  }

  function setBudget(value: string) {
    setForm(current => ({ ...current, budgetLabel: value, customBudget: value === 'Custom budget' ? current.customBudget : '' }))
  }

  const services = selectedServices
  const currency = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date flexible'

  return (
    <SiteShell>
      <div className="pb-28 text-[#f4f1ec]">
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-8 lg:px-8 lg:pt-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-white/40 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="size-3.5" aria-hidden="true" /> Home</Link>
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#d7b98b]"><Sparkles className="size-3.5" /> Customized event planning</p>
            <h1 className="font-serif text-4xl text-white sm:text-5xl">{eventMeta?.intro ?? 'What are you planning?'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Tell us what matters to you. An event planner will review your requirements and prepare a custom proposal.</p>
          </div>
          <button type="button" onClick={saveDraft} disabled={submitting} className="inline-flex shrink-0 items-center justify-center gap-2 border border-white/20 px-4 py-3 text-xs text-white/70 hover:border-[#d7b98b] hover:text-[#d7b98b] disabled:opacity-50">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null} Save draft
          </button>
        </div>

        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="mb-3 flex items-center justify-between text-xs"><span className="text-white/70">Step {step + 1} of {STEP_LABELS.length}</span><span className="text-[#d7b98b]">{STEP_LABELS[step]}</span></div>
          <div className="grid grid-cols-8 gap-1.5" aria-label="Event request progress">
            {STEP_LABELS.map((label, index) => <div key={label} className={`h-1 ${index <= step ? 'bg-[#d7b98b]' : 'bg-white/10'}`} />)}
          </div>
          <div className="mt-3 hidden grid-cols-8 gap-1.5 sm:grid">{STEP_LABELS.map((label, index) => <span key={label} className={`text-[10px] ${index === step ? 'text-[#d7b98b]' : 'text-white/30'}`}>{label}</span>)}</div>
        </div>

        <section className="min-h-97.5">
          {step === 0 && <div>
            <h2 className="font-serif text-3xl text-white">What type of event are you planning?</h2>
            <p className="mt-2 text-sm text-white/45">Choose one to get started. You can share the rest as you go.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {EVENT_TYPES.map(item => <button key={item.value} type="button" onClick={() => chooseType(item.value)} className={`min-h-28 border p-4 text-left transition ${form.eventType === item.value ? 'border-[#d7b98b] bg-[#d7b98b]/10' : 'border-white/10 bg-[#111114] hover:border-white/30'}`}>
                <span className="text-2xl" aria-hidden="true">{item.icon}</span><span className="mt-3 block text-sm text-white">{item.label}</span>
              </button>)}
            </div>
          </div>}

          {step === 1 && <div>
            <h2 className="font-serif text-3xl text-white">Tell us about your event</h2>
            <p className="mt-2 text-sm text-white/45">A few timing and guest details help us make a useful plan.</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Is your event date confirmed?"><div className="grid grid-cols-2 gap-2"><Choice label="Yes, confirmed" selected={form.dateConfirmed === 'yes'} onClick={() => setField('dateConfirmed', 'yes')} /><Choice label="No, flexible" selected={form.dateConfirmed === 'no'} onClick={() => setField('dateConfirmed', 'no')} /></div></Field>
              <Field label={form.dateConfirmed === 'yes' ? 'Event date' : 'Preferred date'}><input className={fieldClass} type="date" min={new Date().toISOString().slice(0, 10)} value={form.eventDate} onChange={event => setField('eventDate', event.target.value)} /></Field>
              {form.dateConfirmed === 'no' && <Field label="Alternative date"><input className={fieldClass} type="date" min={new Date().toISOString().slice(0, 10)} value={form.alternativeDate} onChange={event => setField('alternativeDate', event.target.value)} /></Field>}
              <Field label="Expected number of guests"><input className={fieldClass} type="number" min="1" inputMode="numeric" placeholder="For example, 120" value={form.guestCount} onChange={event => setField('guestCount', event.target.value)} /></Field>
              <Field label="Start time (optional)"><input className={fieldClass} type="time" value={form.startTime} onChange={event => setField('startTime', event.target.value)} /></Field>
              <Field label="End time (optional)"><input className={fieldClass} type="time" value={form.endTime} onChange={event => setField('endTime', event.target.value)} /></Field>
            </div>
          </div>}

          {step === 2 && <div>
            <h2 className="font-serif text-3xl text-white">Where will it happen?</h2>
            <p className="mt-2 text-sm text-white/45">It is completely fine if you have not found a venue yet.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[['have', 'I already have a venue'], ['help', 'Help me find a venue'], ['undecided', 'Venue not decided yet']].map(([value, label]) => <Choice key={value} label={label} selected={form.venueStatus === value} onClick={() => setField('venueStatus', value)} />)}
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {form.venueStatus === 'have' && <>
                <Field label="Venue name"><input className={fieldClass} value={form.venueName} onChange={event => setField('venueName', event.target.value)} placeholder="Venue name" /></Field>
                <Field label="Venue type"><select className={fieldClass} value={form.venueType} onChange={event => setField('venueType', event.target.value)}><option value="">Choose venue type</option>{VENUE_TYPES.map(type => <option key={type}>{type}</option>)}</select></Field>
                <Field label="Venue address"><input className={fieldClass} value={form.venueAddress} onChange={event => setField('venueAddress', event.target.value)} placeholder="Street, area or landmark" /></Field>
                <Field label="Pincode"><input className={fieldClass} inputMode="numeric" value={form.pincode} onChange={event => setField('pincode', event.target.value)} placeholder="Pincode" /></Field>
              </>}
              {form.venueStatus !== 'have' && <>
                <Field label="Preferred area"><input className={fieldClass} value={form.preferredArea} onChange={event => setField('preferredArea', event.target.value)} placeholder="Area or landmark" /></Field>
                <Field label="Indoor or outdoor"><select className={fieldClass} value={form.indoorOutdoor} onChange={event => setField('indoorOutdoor', event.target.value)}><option value="">No preference</option><option>Indoor</option><option>Outdoor</option><option>Either</option></select></Field>
                <Field label="Approximate venue budget"><input className={fieldClass} value={form.venueBudget} onChange={event => setField('venueBudget', event.target.value)} placeholder="Optional" /></Field>
                <Field label="Parking required?"><div className="grid grid-cols-2 gap-2"><Choice label="Yes" selected={form.parking === 'yes'} onClick={() => setField('parking', 'yes')} /><Choice label="No" selected={form.parking === 'no'} onClick={() => setField('parking', 'no')} /></div></Field>
              </>}
              <Field label="City"><input className={fieldClass} value={form.city} onChange={event => setField('city', event.target.value)} placeholder="For example, Bengaluru" /></Field>
            </div>
          </div>}

          {step === 3 && <div>
            <h2 className="font-serif text-3xl text-white">What is your approximate budget?</h2>
            <p className="mt-2 text-sm text-white/45">This helps us tailor a practical proposal. You can skip this if you are not sure.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {BUDGETS.map(option => <Choice key={option} label={option} selected={form.budgetLabel === option} onClick={() => setBudget(form.budgetLabel === option ? '' : option)} />)}
            </div>
            {form.budgetLabel === 'Custom budget' && <div className="mt-5 max-w-sm"><Field label="Your approximate budget"><input className={fieldClass} inputMode="numeric" placeholder="₹ Enter amount" value={form.customBudget} onChange={event => setField('customBudget', event.target.value)} /></Field></div>}
          </div>}

          {step === 4 && <div>
            <h2 className="font-serif text-3xl text-white">What do you need for your event?</h2>
            <p className="mt-2 text-sm text-white/45">Select everything you would like us to consider. Nothing is locked in yet.</p>
            <div className="mt-6 grid gap-x-8 gap-y-6 lg:grid-cols-2">
              {Object.entries(SERVICE_GROUPS).map(([group, options]) => <div key={group}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#d7b98b]">{group}</h3>
                <div className="grid grid-cols-2 gap-2">{options.map(option => <Choice key={option} label={option} selected={services.includes(option)} onClick={() => toggleValue('services', option)} />)}</div>
              </div>)}
            </div>
            <div className="mt-6 max-w-md"><Field label="Cuisine preference"><input className={fieldClass} value={form.cuisine} onChange={event => setField('cuisine', event.target.value)} placeholder="Optional, for example South Indian" /></Field></div>
          </div>}

          {step === 5 && <div>
            <h2 className="font-serif text-3xl text-white">A few details to make it yours</h2>
            <p className="mt-2 text-sm text-white/45">We only show questions relevant to {eventMeta?.label?.toLowerCase() ?? 'your event'}.</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {form.eventType === 'BIRTHDAY' && <>
                <Field label="Birthday person's name"><input className={fieldClass} value={form.birthdayName} onChange={event => setField('birthdayName', event.target.value)} /></Field>
                <Field label="Whose birthday?"><select className={fieldClass} value={form.birthdayPerson} onChange={event => setField('birthdayPerson', event.target.value)}><option value="">Choose one</option><option>Child</option><option>Teenager</option><option>Adult</option></select></Field>
                <Field label="Age"><input className={fieldClass} type="number" min="1" value={form.age} onChange={event => setField('age', event.target.value)} /></Field>
                <Field label="Theme"><select className={fieldClass} value={form.theme} onChange={event => setField('theme', event.target.value)}><option value="">Choose or leave open</option>{['Cartoon', 'Superhero', 'Princess', 'Cars', 'Unicorn', 'Space', 'Sports', 'Custom'].map(item => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Number of children (if applicable)"><input className={fieldClass} type="number" min="0" value={form.childrenCount} onChange={event => setField('childrenCount', event.target.value)} /></Field>
                {([['Cake required?', 'cake'], ['Entertainment required?', 'entertainment'], ['Return gifts required?', 'returnGifts']] as const).map(([label, key]) => <Field key={key} label={label}><select className={fieldClass} value={form[key]} onChange={event => setField(key, event.target.value)}><option value="">Not decided</option><option>Yes</option><option>No</option></select></Field>)}
              </>}
              {form.eventType === 'BABY_SHOWER' && <>
                <Field label="Mother's name"><input className={fieldClass} value={form.motherName} onChange={event => setField('motherName', event.target.value)} /></Field>
                <Field label="Preferred theme"><select className={fieldClass} value={form.theme} onChange={event => setField('theme', event.target.value)}><option value="">Choose or leave open</option><option>Traditional</option><option>Modern</option><option>Floral</option><option>Pastel</option><option>Custom</option></select></Field>
                <Field label="Food preference"><input className={fieldClass} value={form.cuisine} onChange={event => setField('cuisine', event.target.value)} placeholder="Vegetarian, mixed, cuisine" /></Field>
                <Field label="Cake required?"><select className={fieldClass} value={form.cake} onChange={event => setField('cake', event.target.value)}><option value="">Not decided</option><option>Yes</option><option>No</option></select></Field>
              </>}
              {form.eventType === 'WEDDING' && <>
                <Field label="Bride's name"><input className={fieldClass} value={form.weddingBride} onChange={event => setField('weddingBride', event.target.value)} /></Field>
                <Field label="Groom's name"><input className={fieldClass} value={form.weddingGroom} onChange={event => setField('weddingGroom', event.target.value)} /></Field>
                <div className="sm:col-span-2"><span className={labelClass}>Wedding functions</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{['Engagement', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception'].map(item => <Choice key={item} label={item} selected={form.weddingFunctions.includes(item)} onClick={() => toggleValue('weddingFunctions', item)} />)}</div></div>
              </>}
              {['CORPORATE', 'CONFERENCE', 'PRODUCT_LAUNCH', 'COLLEGE_EVENT'].includes(form.eventType) && <>
                <Field label="Company or organization"><input className={fieldClass} value={form.companyName} onChange={event => setField('companyName', event.target.value)} /></Field>
                <Field label="Event name"><input className={fieldClass} value={form.corporateEventName} onChange={event => setField('corporateEventName', event.target.value)} /></Field>
                <Field label="Event format"><select className={fieldClass} value={form.corporateEventType} onChange={event => setField('corporateEventType', event.target.value)}><option value="">Choose format</option>{['Conference', 'Seminar', 'Product launch', 'Team building', 'Annual meeting', 'Award ceremony', 'Corporate party', 'Workshop', 'Other'].map(item => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Branding"><input className={fieldClass} value={form.branding.join(', ')} onChange={event => setField('branding', event.target.value.split(',').map(item => item.trim()).filter(Boolean))} placeholder="Banners, stage branding, welcome stand" /></Field>
                <div className="sm:col-span-2"><span className={labelClass}>AV requirements</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{['Projector', 'LED screen', 'Microphones', 'Sound system', 'Stage', 'Recording'].map(item => <Choice key={item} label={item} selected={form.avRequirements.includes(item)} onClick={() => toggleValue('avRequirements', item)} />)}</div></div>
              </>}
            </div>
            <div className="mt-7"><Field label="Anything else you would like us to know?"><textarea className={`${fieldClass} min-h-32 resize-y`} value={form.additionalRequirements} onChange={event => setField('additionalRequirements', event.target.value)} placeholder="Share your ideas, special requirements, theme preferences or expectations." /></Field></div>
          </div>}

          {step === 6 && <div>
            <h2 className="font-serif text-3xl text-white">Share inspiration, if you have it</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Add up to five reference images. They are attached to your private request for the planning team to review.</p>
            <label className="mt-7 flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-white/20 bg-white/2 text-center transition hover:border-[#d7b98b]/70">
              <Upload className="mb-3 size-6 text-[#d7b98b]" /><span className="text-sm text-white">Upload inspiration images</span><span className="mt-1 text-xs text-white/35">JPG, PNG, WebP or GIF · up to 500 KB each</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={addReferences} />
            </label>
            {form.referenceImages.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{form.referenceImages.map((image, index) => <div key={`${index}-${image.slice(-24)}`} className="relative aspect-square overflow-hidden border border-white/15"><img src={image} alt={`Event inspiration ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label="Remove image" onClick={() => setField('referenceImages', form.referenceImages.filter((_, item) => item !== index))} className="absolute right-2 top-2 flex size-7 items-center justify-center bg-black/75 text-white"><X className="size-4" /></button></div>)}</div>}
          </div>}

          {step === 7 && <div>
            <h2 className="font-serif text-3xl text-white">Review your event requirements</h2>
            <p className="mt-2 text-sm text-white/45">Your request is not a confirmed booking. Our planning team will review it and prepare a customized proposal.</p>
            <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
              <SummaryRow title="Event" value={eventMeta?.label ?? 'Choose an event'} onEdit={() => setStep(0)} />
              <SummaryRow title="Date" value={`${currency(form.eventDate)}${form.dateConfirmed === 'no' ? ' · Flexible' : ''}${form.alternativeDate ? ` · Alternate ${currency(form.alternativeDate)}` : ''}`} onEdit={() => setStep(1)} />
              <SummaryRow title="Guests" value={form.guestCount ? `${form.guestCount} guests` : 'Not specified'} onEdit={() => setStep(1)} />
              <SummaryRow title="Location" value={[form.city, form.preferredArea || form.venueAddress].filter(Boolean).join(' · ') || 'Location not specified'} onEdit={() => setStep(2)} />
              <SummaryRow title="Venue" value={form.venueStatus === 'have' ? `${form.venueName || 'Venue arranged'}${form.venueType ? ` · ${form.venueType}` : ''}` : form.venueStatus === 'help' ? 'Help finding a venue' : 'Not decided yet'} onEdit={() => setStep(2)} />
              <SummaryRow title="Budget" value={form.budgetLabel === 'Custom budget' ? form.customBudget || 'Custom budget' : form.budgetLabel || 'Not sure yet'} onEdit={() => setStep(3)} />
              <SummaryRow title="Services" value={services.length ? services.join(', ') : 'No services selected yet'} onEdit={() => setStep(4)} />
              <SummaryRow title="Event details" value={form.additionalRequirements || form.theme || form.weddingBride || form.companyName || 'No additional notes'} onEdit={() => setStep(5)} />
              <SummaryRow title="References" value={`${form.referenceImages.length} image${form.referenceImages.length === 1 ? '' : 's'}`} onEdit={() => setStep(6)} />
            </div>
            <div className="mt-6 flex gap-3 border border-[#d7b98b]/25 bg-[#d7b98b]/6 p-4"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#d7b98b]" /><p className="text-sm leading-6 text-white/70">After you submit, our event planning team will review your requirements and contact you with a customized proposal. No payment is due now.</p></div>
          </div>}
        </section>

        {error && <p role="alert" className="mt-5 border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">{error}</p>}
        {savedMessage && <p role="status" className="mt-5 border border-green-400/20 bg-green-400/5 px-4 py-3 text-sm text-green-300">{savedMessage}</p>}

        {/* Sticky flow controls. Deliberately not a <footer> — it is the wizard's
            action bar, and the real page footer is rendered by SiteShell. */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0b0d]/95 px-5 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 lg:px-8">
            {step > 0 ? <button type="button" onClick={back} className="flex min-h-12 items-center gap-2 border border-white/20 px-5 text-sm text-white/70 transition-colors duration-200 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="size-4" aria-hidden="true" /> Back</button> : <span className="text-xs text-white/35">No package selection required</span>}
            <div className="flex items-center gap-3">
              {step < 7 ? <button type="button" onClick={next} className="flex min-h-12 items-center gap-2 bg-[#d7b98b] px-6 text-sm font-medium text-[#17130e] transition hover:bg-[#e8cfa0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Continue <ArrowRight className="size-4" aria-hidden="true" /></button> : <button type="button" disabled={submitting} onClick={submitRequest} className="flex min-h-12 items-center gap-2 bg-[#d7b98b] px-6 text-sm font-medium text-[#17130e] transition hover:bg-[#e8cfa0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />} Submit event request</button>}
            </div>
          </div>
        </div>
      </div>
      </div>
    </SiteShell>
  )
}

function SummaryRow({ title, value, onEdit }: { title: string; value: string; onEdit: () => void }) {
  return <div className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.15em] text-white/35">{title}</p><p className="mt-1 wrap-break-word text-sm text-white/80">{value}</p></div><button type="button" onClick={onEdit} className="shrink-0 text-xs text-[#d7b98b] hover:underline">Edit</button></div>
}
