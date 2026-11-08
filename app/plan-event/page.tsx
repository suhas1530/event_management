'use client'

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { eventRequestsApi } from '@/lib/api'
import type { EventRequest, SelectedEventDesign } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'

const EVENT_TYPES = [
  { value: 'BIRTHDAY', label: 'Birthday', icon: '🎂' },
  { value: 'BABY_SHOWER', label: 'Baby shower', icon: '👶' },
  { value: 'WEDDING', label: 'Wedding', icon: '💍' },
  { value: 'ENGAGEMENT', label: 'Engagement', icon: '💑' },
  { value: 'RECEPTION', label: 'Reception', icon: '🥂' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: '🎉' },
  { value: 'CORPORATE', label: 'Corporate event', icon: '🏢' },
  { value: 'CONFERENCE', label: 'Conference', icon: '🎤' },
  { value: 'HOUSEWARMING', label: 'Housewarming', icon: '🏠' },
  { value: 'NAMING_CEREMONY', label: 'Naming ceremony', icon: '🪷' },
  { value: 'COLLEGE_EVENT', label: 'College event', icon: '🎓' },
  { value: 'PRODUCT_LAUNCH', label: 'Product launch', icon: '🚀' },
  { value: 'OTHER', label: 'Other celebration', icon: '✨' },
]

const BUDGETS = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000 – ₹5,00,000',
  '₹5,00,000+',
  'Not sure yet',
  'Custom budget',
]

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

const DRAFT_KEY = 'heptome_event_request_draft'
const DRAFT_CONTENT_KEY = 'heptome_event_request_content'
const LEGACY_DRAFT_KEY = 'avan_event_request_draft'
const LEGACY_DRAFT_CONTENT_KEY = 'avan_event_request_content'

function readMigrated(key: string, legacyKey: string): string | null {
  try {
    const current = localStorage.getItem(key)
    if (current) return current
    const legacy = localStorage.getItem(legacyKey)
    if (!legacy) return null
    localStorage.setItem(key, legacy)
    localStorage.removeItem(legacyKey)
    return legacy
  } catch {
    return null
  }
}

function removeDraftKeys() {
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(LEGACY_DRAFT_KEY)
    localStorage.removeItem(DRAFT_CONTENT_KEY)
    localStorage.removeItem(LEGACY_DRAFT_CONTENT_KEY)
  } catch {
    /* ignore */
  }
}

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
  /** Carried from the AI design assistant; stored inside requirements. */
  selectedDesign: SelectedEventDesign | null
}

const emptyForm: EventForm = {
  eventType: '',
  eventDate: '',
  dateConfirmed: 'yes',
  alternativeDate: '',
  startTime: '',
  endTime: '',
  guestCount: '',
  venueStatus: '',
  venueName: '',
  venueAddress: '',
  venueType: '',
  city: '',
  pincode: '',
  preferredArea: '',
  indoorOutdoor: '',
  parking: 'no',
  venueBudget: '',
  budgetLabel: '',
  customBudget: '',
  services: [],
  cuisine: '',
  birthdayPerson: '',
  birthdayName: '',
  age: '',
  theme: '',
  cake: '',
  childrenCount: '',
  entertainment: '',
  returnGifts: '',
  motherName: '',
  weddingBride: '',
  weddingGroom: '',
  weddingFunctions: [],
  companyName: '',
  corporateEventName: '',
  corporateEventType: '',
  avRequirements: [],
  branding: [],
  additionalRequirements: '',
  referenceImages: [],
  selectedDesign: null,
}

const fieldClass =
  'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-gold'
const labelClass = 'mb-2 block text-xs font-medium text-foreground/90'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Choice({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 border px-4 py-3 text-left text-sm transition ${
        selected
          ? 'border-gold bg-gold/10 text-gold-text'
          : 'border-border bg-card text-foreground/80 hover:border-gold/40'
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        {label}
        {selected ? <Check className="size-4 shrink-0 text-gold-text" aria-hidden="true" /> : null}
      </span>
    </button>
  )
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-serif text-2xl text-foreground sm:text-3xl">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function todayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function formatDate(value: string) {
  if (!value) return 'Not specified'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function budgetLabelForDesign(value: number | null | undefined) {
  if (!value) return ''
  if (value < 25000) return 'Under ₹25,000'
  if (value < 50000) return '₹25,000 – ₹50,000'
  if (value < 100000) return '₹50,000 – ₹1,00,000'
  if (value < 250000) return '₹1,00,000 – ₹2,50,000'
  if (value < 500000) return '₹2,50,000 – ₹5,00,000'
  return '₹5,00,000+'
}

function readSelectedDesign(): SelectedEventDesign | null {
  try {
    const raw = localStorage.getItem('heptome_selected_design')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SelectedEventDesign>
    if (!parsed || typeof parsed.name !== 'string' || typeof parsed.recommendationId !== 'string') {
      return null
    }
    return parsed as SelectedEventDesign
  } catch {
    return null
  }
}

function applyDesignToForm(form: EventForm, design: SelectedEventDesign): EventForm {
  const supportedTypes = new Set([
    'BIRTHDAY',
    'BABY_SHOWER',
    'WEDDING',
    'ENGAGEMENT',
    'RECEPTION',
    'ANNIVERSARY',
    'CORPORATE',
    'CONFERENCE',
    'HOUSEWARMING',
    'NAMING_CEREMONY',
    'COLLEGE_EVENT',
    'PRODUCT_LAUNCH',
    'OTHER',
  ])
  const designType = design.eventType?.toUpperCase()
  const mappedType =
    designType === 'KIDS_PARTY'
      ? 'BIRTHDAY'
      : designType === 'GRADUATION'
        ? 'COLLEGE_EVENT'
        : designType === 'PROPOSAL'
          ? 'ENGAGEMENT'
          : designType === 'CUSTOM' || designType === 'FESTIVAL'
            ? 'OTHER'
            : designType && supportedTypes.has(designType)
              ? designType
              : ''
  const budgetLabel = budgetLabelForDesign(design.budgetInput)
  return {
    ...form,
    selectedDesign: design,
    eventType: form.eventType || mappedType,
    eventDate: form.eventDate || design.eventDate?.slice(0, 10) || '',
    guestCount: form.guestCount || (design.guestCount ? String(design.guestCount) : ''),
    city: form.city || design.city || '',
    budgetLabel: form.budgetLabel || budgetLabel,
    customBudget: form.customBudget,
  }
}

function validateBrief(form: EventForm): string | null {
  if (!form.eventType) return 'Choose an event type to continue.'
  if (!form.eventDate) return 'Choose a preferred event date, even if it is flexible.'
  if (form.eventDate < todayISO()) return 'The event date cannot be in the past.'
  if (form.alternativeDate && form.alternativeDate < todayISO()) {
    return 'The alternative date cannot be in the past.'
  }
  const guests = Number(form.guestCount)
  if (!form.guestCount || !Number.isInteger(guests) || guests < 1) {
    return 'Enter the expected number of guests.'
  }
  if (guests > 100000) return 'Enter a guest count below 100,000.'
  if (form.startTime && form.endTime && form.endTime <= form.startTime) {
    return 'The event end time must be after the start time.'
  }
  if (!form.venueStatus) return 'Tell us whether you already have a venue.'
  if (form.venueStatus === 'have' && !form.venueName.trim()) {
    return 'Enter the venue name, or choose "Help me find a venue".'
  }
  if (!form.city.trim() || form.city.trim().length < 2) {
    return 'Enter the city where the event will take place.'
  }
  if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) {
    return 'Enter a valid 6-digit pincode, or leave it blank.'
  }
  return null
}

export default function PlanEventPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  const [form, setForm] = useState<EventForm>(emptyForm)
  const [step, setStep] = useState(0)
  const [draftId, setDraftId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [focusGroup, setFocusGroup] = useState('')
  const [restored, setRestored] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const submitLock = useRef(false)

  const eventMeta = EVENT_TYPES.find(item => item.value === form.eventType)

  /* Deep links, an existing request and the local draft, read once on mount. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialType = params.get('type')?.toUpperCase()
    const hasInitialType = Boolean(initialType) && EVENT_TYPES.some(item => item.value === initialType)
    const initialDate = params.get('date')
    const initialGuests = params.get('guests')
    const hasInitialDate = Boolean(initialDate) && /^\d{4}-\d{2}-\d{2}$/.test(initialDate!)
    const hasInitialGuests = Boolean(initialGuests) && /^\d{1,5}$/.test(initialGuests!)
    const initialService = params.get('service')
    const hasInitialService = Boolean(initialService) && Object.hasOwn(SERVICE_GROUPS, initialService!)
    const initialVenueName = params.get('venueName')
    const initialVenueCity = params.get('venueCity')
    const initialCity = params.get('city')
    const hasInitialCity = Boolean(initialCity)
    const selectedDesign = params.get('design') === '1' ? readSelectedDesign() : null
    const id = params.get('id')

    if (id) {
      setDraftId(id)
      eventRequestsApi
        .byId(id)
        .then(request => {
          if (request.status !== 'DRAFT') {
            router.replace(`/event-requests/${encodeURIComponent(request.id)}`)
            return
          }
          hydrateFromRequest(request)
          if (selectedDesign) setForm(current => applyDesignToForm(current, selectedDesign))
          setStep(1)
        })
        .catch(() => setError('We could not load this draft.'))
      return
    }

    if (
      hasInitialType ||
      hasInitialDate ||
      hasInitialGuests ||
      hasInitialService ||
      initialVenueName ||
      hasInitialCity
    ) {
      setForm(current => {
        const next = { ...current }
        if (hasInitialType) next.eventType = initialType!
        if (hasInitialDate) next.eventDate = initialDate!
        if (hasInitialGuests) next.guestCount = initialGuests!
        if (initialVenueName) {
          next.venueStatus = 'have'
          next.venueName = initialVenueName
        }
        if (initialVenueCity) next.city = initialVenueCity
        if (hasInitialCity) next.city = initialCity!
        return selectedDesign ? applyDesignToForm(next, selectedDesign) : next
      })
      if (hasInitialService) setFocusGroup(initialService!)
      return
    }

    // No deep link: restore the content saved on this device, then any server
    // draft the customer started earlier.
    const localContent = readMigrated(DRAFT_CONTENT_KEY, LEGACY_DRAFT_CONTENT_KEY)
    if (localContent) {
      try {
        const restoredForm = { ...emptyForm, ...(JSON.parse(localContent) as Partial<EventForm>) }
        setForm(selectedDesign ? applyDesignToForm(restoredForm, selectedDesign) : restoredForm)
        setRestored(true)
      } catch {
        localStorage.removeItem(DRAFT_CONTENT_KEY)
      }
    } else if (selectedDesign) {
      setForm(current => applyDesignToForm(current, selectedDesign))
    }

    const savedId = readMigrated(DRAFT_KEY, LEGACY_DRAFT_KEY)
    if (savedId) {
      eventRequestsApi
        .byId(savedId)
        .then(request => {
          if (request.status !== 'DRAFT') {
            removeDraftKeys()
            return
          }
          hydrateFromRequest(request)
          setDraftId(request.id)
          setRestored(true)
        })
        .catch(() => {
          try {
            localStorage.removeItem(DRAFT_KEY)
          } catch {
            /* ignore */
          }
        })
    }

    function hydrateFromRequest(request: EventRequest) {
      const saved = (request.requirements ?? {}) as Partial<EventForm>
      setForm({
        ...emptyForm,
        ...saved,
        eventType: request.eventType,
        eventDate: request.eventDate?.slice(0, 10) ?? '',
        guestCount: request.guestCount?.toString() ?? '',
        city: request.city ?? '',
        budgetLabel: request.budgetLabel ?? '',
      })
    }
    // Browser storage and the query string are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Keep a local copy so a sign-in round trip never loses the brief. */
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(form))
    } catch {
      /* Storage disabled: the flow still works, it just cannot resume. */
    }
  }, [form])

  const setField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setError('')
  }

  const toggleValue = (
    key: 'services' | 'weddingFunctions' | 'avRequirements',
    value: string,
  ) => {
    setForm(current => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter(item => item !== value)
        : [...current[key], value],
    }))
  }

  function setBudget(value: string) {
    setForm(current => ({
      ...current,
      budgetLabel: value,
      customBudget: value === 'Custom budget' ? current.customBudget : '',
    }))
  }

  function requestPayload() {
    const { referenceImages, ...requirements } = form
    return {
      eventType: form.eventType,
      eventDate: form.eventDate ? new Date(`${form.eventDate}T12:00:00+05:30`).toISOString() : null,
      guestCount: form.guestCount ? Number(form.guestCount) : null,
      city: form.city,
      budgetLabel: form.budgetLabel === 'Custom budget' ? form.customBudget : form.budgetLabel,
      requirements: requirements as unknown as Record<string, unknown>,
      referenceImages,
    }
  }

  function designAssistantHref() {
    const params = new URLSearchParams()
    if (form.eventType) params.set('eventType', form.eventType)
    if (form.eventDate) params.set('eventDate', form.eventDate)
    if (form.guestCount) params.set('guestCount', form.guestCount)
    if (form.city) params.set('city', form.city)
    const budgetParams: Record<string, string> = {
      'Under ₹25,000': '25000',
      '₹25,000 – ₹50,000': '50000',
      '₹50,000 – ₹1,00,000': '100000',
      '₹1,00,000 – ₹2,50,000': '250000',
      '₹2,50,000 – ₹5,00,000': '500000',
      '₹5,00,000+': '1000000',
    }
    const budget = budgetParams[form.budgetLabel]
    if (budget) params.set('budget', budget)
    const query = params.toString()
    return `/event-design-assistant${query ? `?${query}` : ''}`
  }

  async function persistDraft(): Promise<EventRequest | null> {
    if (!isAuthenticated) {
      try {
        localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(form))
      } catch {
        /* ignore */
      }
      return null
    }
    const payload = requestPayload()
    const record = draftId
      ? await eventRequestsApi.updateDraft(draftId, payload)
      : await eventRequestsApi.create({ ...payload, status: 'DRAFT' })
    setDraftId(record.id)
    try {
      localStorage.setItem(DRAFT_KEY, record.id)
      localStorage.removeItem(LEGACY_DRAFT_KEY)
      localStorage.removeItem(DRAFT_CONTENT_KEY)
      localStorage.removeItem(LEGACY_DRAFT_CONTENT_KEY)
    } catch {
      /* ignore */
    }
    return record
  }

  async function saveDraft() {
    if (!form.eventType) {
      setError('Choose an event type before saving your draft.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const record = await persistDraft()
      setSavedMessage(
        record
          ? 'Draft saved. You can continue from your dashboard any time.'
          : 'Draft saved on this device. Sign in when you are ready to submit it.',
      )
      window.setTimeout(() => setSavedMessage(''), 4000)
    } catch (caught) {
      setError((caught as { error?: string })?.error ?? 'Could not save your draft.')
    } finally {
      setSubmitting(false)
    }
  }

  function goToReview() {
    const message = validateBrief(form)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setAccepted(false)
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function editSection(id: string) {
    setStep(0)
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  async function submitRequest() {
    if (submitLock.current) return
    const message = validateBrief(form)
    if (message) {
      setError(message)
      setStep(0)
      return
    }
    if (!accepted) {
      setError('Please confirm that you understand this is an event inquiry.')
      return
    }
    if (!isAuthenticated) {
      try {
        localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(form))
      } catch {
        /* ignore */
      }
      router.push(`/login?next=${encodeURIComponent('/plan-event')}`)
      return
    }

    submitLock.current = true
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
      removeDraftKeys()
      try {
        localStorage.removeItem('heptome_selected_design')
      } catch {
        /* ignore */
      }
      router.push(`/event-request-submitted?id=${encodeURIComponent(submitted.id)}`)
    } catch (caught) {
      setError(
        (caught as { error?: string })?.error ??
          'Your event request could not be submitted. Please try again.',
      )
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  async function addReferences(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const remaining = 5 - form.referenceImages.length
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const validFiles = files
      .filter(file => allowedTypes.includes(file.type) && file.size <= 500_000)
      .slice(0, remaining)
    if (validFiles.length !== files.length) {
      setError('Choose up to 5 JPG, PNG, WebP or GIF images, each smaller than 500 KB.')
    }
    const encoded = await Promise.all(
      validFiles.map(
        file =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = reject
            reader.readAsDataURL(file)
          }),
      ),
    )
    setField('referenceImages', [...form.referenceImages, ...encoded])
    event.target.value = ''
  }

  const isCorporate = ['CORPORATE', 'CONFERENCE', 'PRODUCT_LAUNCH', 'COLLEGE_EVENT'].includes(form.eventType)

  return (
    <SiteShell>
      <div className="pb-20 text-foreground">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-8 lg:px-8 lg:pt-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Home
          </Link>

          <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-gold-text">
                <Sparkles className="size-3.5" aria-hidden="true" /> Customized event planning
              </p>
              <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
                {step === 0
                  ? eventMeta
                    ? `Tell us about your ${eventMeta.label.toLowerCase()}.`
                    : 'What are you planning?'
                  : 'Review your event request'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {step === 0
                  ? 'Share the date, guest count and what matters to you. An event planner will review the brief and prepare a custom proposal.'
                  : 'Your request is not a confirmed booking. Our planning team will review it and contact you with a customized proposal.'}
              </p>
            </div>
            {step === 0 ? (
              <button
                type="button"
                onClick={saveDraft}
                disabled={submitting}
                className="inline-flex shrink-0 items-center justify-center gap-2 border border-border px-4 py-3 text-xs text-foreground/90 hover:border-gold hover:text-gold-text disabled:opacity-50"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null} Save draft
              </button>
            ) : null}
          </div>

          <div className="mb-8 border-b border-border pb-5">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-foreground/90">Step {step + 1} of 2</span>
              <span className="text-gold-text">{step === 0 ? 'Event brief' : 'Review & submit'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Event request progress">
              <div className={`h-1 ${step >= 0 ? 'bg-gold' : 'bg-muted'}`} />
              <div className={`h-1 ${step >= 1 ? 'bg-gold' : 'bg-muted'}`} />
            </div>
          </div>

          {restored && step === 0 ? (
            <p className="mb-6 border border-gold/25 bg-gold/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
              We restored the brief saved on this device. Check it before submitting.
            </p>
          ) : null}

          {step === 0 ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-gold/25 bg-gold/5 px-4 py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {form.selectedDesign ? 'Your AI design is attached to this request.' : 'Not sure where to start with the look?'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {form.selectedDesign
                      ? `${form.selectedDesign.name} · ${form.selectedDesign.style}. It will be included in your brief for the planner.`
                      : 'Explore three design directions with reference images and real catalog services before you send the brief.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.selectedDesign ? (
                  <button
                    type="button"
                    onClick={() => setField('selectedDesign', null)}
                    className="border border-border px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition hover:border-gold/40"
                  >
                    Remove
                  </button>
                ) : null}
                <Link
                  href={designAssistantHref()}
                  className="flex items-center gap-2 border border-gold/40 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-gold-text transition hover:bg-gold/10"
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {form.selectedDesign ? 'View design assistant' : 'Get design ideas'}
                </Link>
              </div>
            </div>
          ) : null}

          {step === 0 ? (
            <div className="flex flex-col gap-8">
              <Section
                id="event-type"
                title="What type of event are you planning?"
                description="Choose one to get started. You can share the rest as you go."
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {EVENT_TYPES.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={form.eventType === item.value}
                      onClick={() => setField('eventType', item.value)}
                      className={`min-h-24 border p-4 text-left transition ${
                        form.eventType === item.value
                          ? 'border-gold bg-gold/10'
                          : 'border-border bg-card hover:border-gold/40'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="mt-3 block text-sm text-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section
                id="event-date"
                title="When is it, and how many guests?"
                description="A date can still be flexible. These details help the planner build a realistic proposal."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Is your event date confirmed?">
                    <div className="grid grid-cols-2 gap-2">
                      <Choice
                        label="Yes, confirmed"
                        selected={form.dateConfirmed === 'yes'}
                        onClick={() => setField('dateConfirmed', 'yes')}
                      />
                      <Choice
                        label="No, flexible"
                        selected={form.dateConfirmed === 'no'}
                        onClick={() => setField('dateConfirmed', 'no')}
                      />
                    </div>
                  </Field>
                  <Field label={form.dateConfirmed === 'yes' ? 'Event date *' : 'Preferred date *'}>
                    <input
                      className={fieldClass}
                      type="date"
                      min={todayISO()}
                      value={form.eventDate}
                      onChange={event => setField('eventDate', event.target.value)}
                    />
                  </Field>
                  {form.dateConfirmed === 'no' ? (
                    <Field label="Alternative date">
                      <input
                        className={fieldClass}
                        type="date"
                        min={todayISO()}
                        value={form.alternativeDate}
                        onChange={event => setField('alternativeDate', event.target.value)}
                      />
                    </Field>
                  ) : null}
                  <Field label="Expected number of guests *">
                    <input
                      className={fieldClass}
                      type="number"
                      min="1"
                      max="100000"
                      inputMode="numeric"
                      placeholder="For example, 120"
                      value={form.guestCount}
                      onChange={event => setField('guestCount', event.target.value)}
                    />
                  </Field>
                  <Field label="Start time (optional)">
                    <input
                      className={fieldClass}
                      type="time"
                      value={form.startTime}
                      onChange={event => setField('startTime', event.target.value)}
                    />
                  </Field>
                  <Field label="End time (optional)">
                    <input
                      className={fieldClass}
                      type="time"
                      value={form.endTime}
                      onChange={event => setField('endTime', event.target.value)}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                id="event-location"
                title="Where will it happen?"
                description="It is completely fine if you have not found a venue yet."
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ['have', 'I already have a venue'],
                    ['help', 'Help me find a venue'],
                    ['undecided', 'Venue not decided yet'],
                  ].map(([value, label]) => (
                    <Choice
                      key={value}
                      label={label}
                      selected={form.venueStatus === value}
                      onClick={() => setField('venueStatus', value)}
                    />
                  ))}
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {form.venueStatus === 'have' ? (
                    <>
                      <Field label="Venue name *">
                        <input
                          className={fieldClass}
                          value={form.venueName}
                          onChange={event => setField('venueName', event.target.value)}
                          placeholder="Venue name"
                        />
                      </Field>
                      <Field label="Venue type">
                        <select
                          className={fieldClass}
                          value={form.venueType}
                          onChange={event => setField('venueType', event.target.value)}
                        >
                          <option value="">Choose venue type</option>
                          {VENUE_TYPES.map(type => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Venue address">
                        <input
                          className={fieldClass}
                          value={form.venueAddress}
                          onChange={event => setField('venueAddress', event.target.value)}
                          placeholder="Street, area or landmark"
                        />
                      </Field>
                      <Field label="Pincode">
                        <input
                          className={fieldClass}
                          inputMode="numeric"
                          maxLength={6}
                          value={form.pincode}
                          onChange={event =>
                            setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          placeholder="Pincode"
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Preferred area">
                        <input
                          className={fieldClass}
                          value={form.preferredArea}
                          onChange={event => setField('preferredArea', event.target.value)}
                          placeholder="Area or landmark"
                        />
                      </Field>
                      <Field label="Indoor or outdoor">
                        <select
                          className={fieldClass}
                          value={form.indoorOutdoor}
                          onChange={event => setField('indoorOutdoor', event.target.value)}
                        >
                          <option value="">No preference</option>
                          <option>Indoor</option>
                          <option>Outdoor</option>
                          <option>Either</option>
                        </select>
                      </Field>
                      <Field label="Approximate venue budget">
                        <input
                          className={fieldClass}
                          value={form.venueBudget}
                          onChange={event => setField('venueBudget', event.target.value)}
                          placeholder="Optional"
                        />
                      </Field>
                      <Field label="Parking required?">
                        <div className="grid grid-cols-2 gap-2">
                          <Choice
                            label="Yes"
                            selected={form.parking === 'yes'}
                            onClick={() => setField('parking', 'yes')}
                          />
                          <Choice
                            label="No"
                            selected={form.parking === 'no'}
                            onClick={() => setField('parking', 'no')}
                          />
                        </div>
                      </Field>
                    </>
                  )}
                  <Field label="City *">
                    <input
                      className={fieldClass}
                      value={form.city}
                      onChange={event => setField('city', event.target.value)}
                      placeholder="For example, Bengaluru"
                    />
                  </Field>
                </div>
              </Section>

              <Section
                id="event-budget"
                title="What is your approximate budget?"
                description="This helps the planner tailor a practical proposal. Skip it if you are not sure yet."
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {BUDGETS.map(option => (
                    <Choice
                      key={option}
                      label={option}
                      selected={form.budgetLabel === option}
                      onClick={() => setBudget(form.budgetLabel === option ? '' : option)}
                    />
                  ))}
                </div>
                {form.budgetLabel === 'Custom budget' ? (
                  <div className="mt-4 max-w-sm">
                    <Field label="Your approximate budget">
                      <input
                        className={fieldClass}
                        inputMode="numeric"
                        placeholder="₹ Enter amount"
                        value={form.customBudget}
                        onChange={event => setField('customBudget', event.target.value)}
                      />
                    </Field>
                  </div>
                ) : null}
              </Section>

              <Section
                id="event-services"
                title="What do you need for your event?"
                description="Select everything you would like us to consider. Nothing is locked in yet."
              >
                {focusGroup ? (
                  <p className="mb-5 border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm leading-6 text-foreground/85">
                    You arrived asking about{' '}
                    <strong className="font-semibold text-gold-soft">{focusGroup}</strong> — it is highlighted
                    below. Tick everything you need; you can add more from other groups too.
                  </p>
                ) : null}
                <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
                  {Object.entries(SERVICE_GROUPS).map(([group, options]) => (
                    <div
                      key={group}
                      className={
                        focusGroup === group
                          ? 'border border-gold/45 bg-gold/[0.04] p-4'
                          : undefined
                      }
                    >
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gold-text">
                        {group}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {options.map(option => (
                          <Choice
                            key={option}
                            label={option}
                            selected={form.services.includes(option)}
                            onClick={() => toggleValue('services', option)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 max-w-md">
                  <Field label="Cuisine preference">
                    <input
                      className={fieldClass}
                      value={form.cuisine}
                      onChange={event => setField('cuisine', event.target.value)}
                      placeholder="Optional, for example South Indian"
                    />
                  </Field>
                </div>
              </Section>

              <Section
                id="event-details"
                title="A few details to make it yours"
                description={`We only ask questions relevant to ${eventMeta?.label?.toLowerCase() ?? 'your event'}.`}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  {form.eventType === 'BIRTHDAY' ? (
                    <>
                      <Field label="Birthday person's name">
                        <input
                          className={fieldClass}
                          value={form.birthdayName}
                          onChange={event => setField('birthdayName', event.target.value)}
                        />
                      </Field>
                      <Field label="Whose birthday?">
                        <select
                          className={fieldClass}
                          value={form.birthdayPerson}
                          onChange={event => setField('birthdayPerson', event.target.value)}
                        >
                          <option value="">Choose one</option>
                          <option>Child</option>
                          <option>Teenager</option>
                          <option>Adult</option>
                        </select>
                      </Field>
                      <Field label="Age">
                        <input
                          className={fieldClass}
                          type="number"
                          min="1"
                          value={form.age}
                          onChange={event => setField('age', event.target.value)}
                        />
                      </Field>
                      <Field label="Theme">
                        <select
                          className={fieldClass}
                          value={form.theme}
                          onChange={event => setField('theme', event.target.value)}
                        >
                          <option value="">Choose or leave open</option>
                          {['Cartoon', 'Superhero', 'Princess', 'Cars', 'Unicorn', 'Space', 'Sports', 'Custom'].map(item => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Number of children (if applicable)">
                        <input
                          className={fieldClass}
                          type="number"
                          min="0"
                          value={form.childrenCount}
                          onChange={event => setField('childrenCount', event.target.value)}
                        />
                      </Field>
                      {(
                        [
                          ['Cake required?', 'cake'],
                          ['Entertainment required?', 'entertainment'],
                          ['Return gifts required?', 'returnGifts'],
                        ] as const
                      ).map(([label, key]) => (
                        <Field key={key} label={label}>
                          <select
                            className={fieldClass}
                            value={form[key]}
                            onChange={event => setField(key, event.target.value)}
                          >
                            <option value="">Not decided</option>
                            <option>Yes</option>
                            <option>No</option>
                          </select>
                        </Field>
                      ))}
                    </>
                  ) : null}

                  {form.eventType === 'BABY_SHOWER' ? (
                    <>
                      <Field label="Mother's name">
                        <input
                          className={fieldClass}
                          value={form.motherName}
                          onChange={event => setField('motherName', event.target.value)}
                        />
                      </Field>
                      <Field label="Preferred theme">
                        <select
                          className={fieldClass}
                          value={form.theme}
                          onChange={event => setField('theme', event.target.value)}
                        >
                          <option value="">Choose or leave open</option>
                          <option>Traditional</option>
                          <option>Modern</option>
                          <option>Floral</option>
                          <option>Pastel</option>
                          <option>Custom</option>
                        </select>
                      </Field>
                      <Field label="Food preference">
                        <input
                          className={fieldClass}
                          value={form.cuisine}
                          onChange={event => setField('cuisine', event.target.value)}
                          placeholder="Vegetarian, mixed, cuisine"
                        />
                      </Field>
                      <Field label="Cake required?">
                        <select
                          className={fieldClass}
                          value={form.cake}
                          onChange={event => setField('cake', event.target.value)}
                        >
                          <option value="">Not decided</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </Field>
                    </>
                  ) : null}

                  {form.eventType === 'WEDDING' ? (
                    <>
                      <Field label="Bride's name">
                        <input
                          className={fieldClass}
                          value={form.weddingBride}
                          onChange={event => setField('weddingBride', event.target.value)}
                        />
                      </Field>
                      <Field label="Groom's name">
                        <input
                          className={fieldClass}
                          value={form.weddingGroom}
                          onChange={event => setField('weddingGroom', event.target.value)}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <span className={labelClass}>Wedding functions</span>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {['Engagement', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception'].map(item => (
                            <Choice
                              key={item}
                              label={item}
                              selected={form.weddingFunctions.includes(item)}
                              onClick={() => toggleValue('weddingFunctions', item)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isCorporate ? (
                    <>
                      <Field label="Company or organization">
                        <input
                          className={fieldClass}
                          value={form.companyName}
                          onChange={event => setField('companyName', event.target.value)}
                        />
                      </Field>
                      <Field label="Event name">
                        <input
                          className={fieldClass}
                          value={form.corporateEventName}
                          onChange={event => setField('corporateEventName', event.target.value)}
                        />
                      </Field>
                      <Field label="Event format">
                        <select
                          className={fieldClass}
                          value={form.corporateEventType}
                          onChange={event => setField('corporateEventType', event.target.value)}
                        >
                          <option value="">Choose format</option>
                          {['Conference', 'Seminar', 'Product launch', 'Team building', 'Annual meeting', 'Award ceremony', 'Corporate party', 'Workshop', 'Other'].map(item => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Branding">
                        <input
                          className={fieldClass}
                          value={form.branding.join(', ')}
                          onChange={event =>
                            setField(
                              'branding',
                              event.target.value
                                .split(',')
                                .map(item => item.trim())
                                .filter(Boolean),
                            )
                          }
                          placeholder="Banners, stage branding, welcome stand"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <span className={labelClass}>AV requirements</span>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {['Projector', 'LED screen', 'Microphones', 'Sound system', 'Stage', 'Recording'].map(item => (
                            <Choice
                              key={item}
                              label={item}
                              selected={form.avRequirements.includes(item)}
                              onClick={() => toggleValue('avRequirements', item)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="mt-5">
                  <Field label="Anything else you would like us to know?">
                    <textarea
                      className={`${fieldClass} min-h-32 resize-y`}
                      value={form.additionalRequirements}
                      onChange={event => setField('additionalRequirements', event.target.value)}
                      placeholder="Share your ideas, special requirements, theme preferences or expectations."
                    />
                  </Field>
                </div>
              </Section>

              <Section
                id="event-references"
                title="Share inspiration, if you have it"
                description="Add up to five reference images. They are attached to your private request for the planning team to review."
              >
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-muted/60 text-center transition hover:border-gold/70">
                  <Upload className="mb-3 size-6 text-gold-text" aria-hidden="true" />
                  <span className="text-sm text-foreground">Upload inspiration images</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, WebP or GIF · up to 500 KB each
                  </span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={addReferences} />
                </label>
                {form.referenceImages.length > 0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {form.referenceImages.map((image, index) => (
                      <div
                        key={`${index}-${image.slice(-24)}`}
                        className="relative aspect-square overflow-hidden border border-border"
                      >
                        <img
                          src={image}
                          alt={`Event inspiration ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label={`Remove image ${index + 1}`}
                          onClick={() =>
                            setField(
                              'referenceImages',
                              form.referenceImages.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          className="absolute right-2 top-2 flex size-7 items-center justify-center bg-black/75 text-white"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Section>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="min-w-0">
                <div className="divide-y divide-border border-y border-border">
                  <SummaryRow
                    title="Event"
                    value={eventMeta?.label ?? 'Not chosen'}
                    onEdit={() => editSection('event-type')}
                  />
                  <SummaryRow
                    title="Date"
                    value={`${formatDate(form.eventDate)}${form.dateConfirmed === 'no' ? ' · Flexible' : ''}${
                      form.alternativeDate ? ` · Alternative ${formatDate(form.alternativeDate)}` : ''
                    }`}
                    onEdit={() => editSection('event-date')}
                  />
                  <SummaryRow
                    title="Guests"
                    value={form.guestCount ? `${form.guestCount} guests` : 'Not specified'}
                    onEdit={() => editSection('event-date')}
                  />
                  <SummaryRow
                    title="Time"
                    value={
                      form.startTime || form.endTime
                        ? `${form.startTime || 'Start TBC'} – ${form.endTime || 'End TBC'}`
                        : 'Not specified'
                    }
                    onEdit={() => editSection('event-date')}
                  />
                  <SummaryRow
                    title="Location"
                    value={
                      [form.city, form.preferredArea || form.venueAddress].filter(Boolean).join(' · ') ||
                      'Location not specified'
                    }
                    onEdit={() => editSection('event-location')}
                  />
                  <SummaryRow
                    title="Venue"
                    value={
                      form.venueStatus === 'have'
                        ? `${form.venueName || 'Venue arranged'}${
                            form.venueType ? ` · ${form.venueType}` : ''
                          }`
                        : form.venueStatus === 'help'
                          ? 'Help finding a venue'
                          : 'Not decided yet'
                    }
                    onEdit={() => editSection('event-location')}
                  />
                  <SummaryRow
                    title="Budget"
                    value={
                      form.budgetLabel === 'Custom budget'
                        ? form.customBudget || 'Custom budget'
                        : form.budgetLabel || 'Not sure yet'
                    }
                    onEdit={() => editSection('event-budget')}
                  />
                  <SummaryRow
                    title="Services"
                    value={form.services.length ? form.services.join(', ') : 'No services selected yet'}
                    onEdit={() => editSection('event-services')}
                  />
                  {form.selectedDesign ? (
                    <SummaryRow
                      title="AI design"
                      value={`${form.selectedDesign.name} · ${form.selectedDesign.style}${
                        form.selectedDesign.services.length
                          ? ` · ${form.selectedDesign.services.length} catalog services`
                          : ''
                      }`}
                      onEdit={() =>
                        router.push(
                          `/event-design-assistant?eventType=${encodeURIComponent(form.eventType)}`,
                        )
                      }
                    />
                  ) : null}
                  <SummaryRow
                    title="Event details"
                    value={
                      form.additionalRequirements ||
                      form.theme ||
                      form.weddingBride ||
                      form.companyName ||
                      'No additional notes'
                    }
                    onEdit={() => editSection('event-details')}
                  />
                  <SummaryRow
                    title="References"
                    value={`${form.referenceImages.length} image${
                      form.referenceImages.length === 1 ? '' : 's'
                    }`}
                    onEdit={() => editSection('event-references')}
                  />
                </div>

                <label className="mt-6 flex cursor-pointer items-start gap-3 border border-gold/25 bg-gold/5 p-4">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={event => {
                      setAccepted(event.target.checked)
                      setError('')
                    }}
                    className="mt-0.5 size-4 accent-gold"
                  />
                  <span className="text-sm leading-6 text-muted-foreground">
                    I understand this is an{' '}
                    <strong className="font-medium text-foreground">event inquiry</strong>, not a confirmed
                    booking or a payment. The planning team will review it and prepare a proposal.
                  </span>
                </label>

                {!isAuthenticated ? (
                  <p className="mt-4 border border-warning/20 bg-warning-muted px-4 py-3 text-sm leading-6 text-warning">
                    You will be asked to{' '}
                    <Link href="/login?next=%2Fplan-event" className="underline">
                      sign in
                    </Link>{' '}
                    before the request is sent. Your brief stays saved on this device.
                  </p>
                ) : null}
              </div>

              <div className="border border-gold/25 bg-gold/6 p-5 lg:sticky lg:top-24">
                <CheckCircle2 className="size-5 text-gold-text" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">What happens next?</p>
                <ol className="mt-3 flex flex-col gap-2 text-xs leading-5 text-muted-foreground">
                  <li>1. The planning team reviews your brief.</li>
                  <li>2. You discuss the requirements with an event planner.</li>
                  <li>3. You receive a customized proposal to review.</li>
                  <li>4. Nothing is confirmed or charged until you approve it.</li>
                </ol>
                <p className="mt-4 border-t border-gold/20 pt-4 text-xs leading-5 text-muted-foreground">
                  No payment is due now. This request does not reserve a venue or a date.
                </p>
              </div>
            </div>
          )}

          {error ? (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2 border border-destructive/20 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
          {savedMessage ? (
            <p
              role="status"
              className="mt-5 border border-success/20 bg-success-muted px-4 py-3 text-sm text-success"
            >
              {savedMessage}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step === 0 ? (
              <Link
                href="/events"
                className="flex min-h-12 items-center justify-center gap-2 border border-border px-5 text-sm text-foreground/90 transition hover:border-gold hover:text-gold-text sm:justify-start"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Explore events
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep(0)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex min-h-12 items-center justify-center gap-2 border border-border px-5 text-sm text-foreground/90 transition hover:border-gold hover:text-gold-text sm:justify-start"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Edit brief
              </button>
            )}

            {step === 0 ? (
              <button
                type="button"
                onClick={goToReview}
                className="flex min-h-12 items-center justify-center gap-2 bg-gold px-6 text-sm font-medium text-gold-foreground transition hover:bg-gold-soft"
              >
                Review request <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || isLoading}
                onClick={submitRequest}
                className="flex min-h-12 items-center justify-center gap-2 bg-gold px-6 text-sm font-medium text-gold-foreground transition hover:bg-gold-soft disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                )}
                {submitting ? 'Submitting…' : 'Submit event request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  )
}

function SummaryRow({ title, value, onEdit }: { title: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
        <p className="mt-1 break-words text-sm text-foreground/90">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-gold-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Edit
      </button>
    </div>
  )
}
