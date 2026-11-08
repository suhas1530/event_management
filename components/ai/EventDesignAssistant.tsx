'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  GitCompare,
  ImageOff,
  IndianRupee,
  Layers,
  Lightbulb,
  Loader2,
  MapPin,
  Maximize2,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { eventDesignApi } from '@/lib/api'
import type {
  EventDesignImage,
  EventDesignRecommendation,
  EventDesignRequirements,
  EventDesignResponse,
  EventDesignStyle,
  SavedEventDesign,
  SelectedEventDesign,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/app/providers'

const SELECTED_DESIGN_KEY = 'heptome_selected_design'

const EVENT_TYPES = [
  { value: 'WEDDING', label: 'Wedding' },
  { value: 'BIRTHDAY', label: 'Birthday' },
  { value: 'BABY_SHOWER', label: 'Baby shower' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'ANNIVERSARY', label: 'Anniversary' },
  { value: 'CORPORATE', label: 'Corporate event' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'HOUSEWARMING', label: 'Housewarming' },
  { value: 'NAMING_CEREMONY', label: 'Naming ceremony' },
  { value: 'COLLEGE_EVENT', label: 'College event' },
  { value: 'PRODUCT_LAUNCH', label: 'Product launch' },
  { value: 'OTHER', label: 'Other celebration' },
] as const

const STYLES: Array<{ value: EventDesignStyle; label: string; hint: string }> = [
  { value: 'elegant', label: 'Elegant', hint: 'Soft, romantic, timeless' },
  { value: 'luxury', label: 'Luxury', hint: 'Bold, polished, premium' },
  { value: 'modern', label: 'Modern', hint: 'Clean lines, contemporary' },
  { value: 'traditional', label: 'Traditional', hint: 'Warm, festive, ritual-led' },
  { value: 'minimalist', label: 'Minimal', hint: 'Quiet, intimate, restrained' },
  { value: 'floral', label: 'Floral', hint: 'Garden-inspired and fresh' },
  { value: 'colourful', label: 'Colourful', hint: 'Joyful, bright, expressive' },
  { value: 'playful', label: 'Playful', hint: 'Fun and family-friendly' },
  { value: 'royal', label: 'Royal', hint: 'Regal, heritage, grand' },
]

const COLOURS = [
  { name: 'Ivory', hex: '#F7F1E8' },
  { name: 'Blush', hex: '#E7C9C4' },
  { name: 'Gold', hex: '#D5AE79' },
  { name: 'Sage', hex: '#9AA88A' },
  { name: 'Emerald', hex: '#1F5C4A' },
  { name: 'Black', hex: '#111111' },
  { name: 'Maroon', hex: '#7B1E1E' },
  { name: 'Marigold', hex: '#E8A317' },
  { name: 'Coral', hex: '#F26B5E' },
  { name: 'Teal', hex: '#2A9D8F' },
  { name: 'Sky', hex: '#8ECAE6' },
  { name: 'Lavender', hex: '#C9B8DD' },
]

const SERVICES = [
  'Decoration',
  'Photography',
  'Videography',
  'Catering',
  'DJ',
  'Flowers',
  'Lighting',
  'Cake',
  'Makeup',
  'Invitations',
  'Return gifts',
]

const VENUE_TYPES = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'banquet_hall', label: 'Banquet hall' },
  { value: 'home', label: 'Home' },
  { value: 'garden', label: 'Garden' },
  { value: 'other', label: 'Other / not sure' },
] as const

const BUDGETS = [
  { value: '50000', label: '₹50,000' },
  { value: '100000', label: '₹1,00,000' },
  { value: '250000', label: '₹2,50,000' },
  { value: '500000', label: '₹5,00,000' },
  { value: '1000000', label: '₹10,00,000' },
  { value: 'custom', label: 'Custom' },
  { value: 'unsure', label: 'Not sure yet' },
]

type AssistantForm = {
  eventType: string
  eventDate: string
  city: string
  guestCount: string
  budgetPreset: string
  customBudget: string
  style: EventDesignStyle | ''
  colors: string[]
  venueType: string
  services: string[]
  notes: string
}

const initialForm: AssistantForm = {
  eventType: '',
  eventDate: '',
  city: '',
  guestCount: '',
  budgetPreset: '',
  customBudget: '',
  style: '',
  colors: [],
  venueType: '',
  services: [],
  notes: '',
}

function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Quote required'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Date flexible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date flexible'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mapToPlanEventType(value: string) {
  const upper = value.toUpperCase()
  const supported = new Set([
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
  if (supported.has(upper)) return upper
  if (upper === 'KIDS_PARTY') return 'BIRTHDAY'
  if (upper === 'GRADUATION') return 'COLLEGE_EVENT'
  if (upper === 'PROPOSAL') return 'ENGAGEMENT'
  return 'OTHER'
}

function budgetLabelFor(value: number | null | undefined) {
  if (!value) return ''
  if (value < 25000) return 'Under ₹25,000'
  if (value < 50000) return '₹25,000 – ₹50,000'
  if (value < 100000) return '₹50,000 – ₹1,00,000'
  if (value < 250000) return '₹1,00,000 – ₹2,50,000'
  if (value < 500000) return '₹2,50,000 – ₹5,00,000'
  return '₹5,00,000+'
}

function StyleChip({
  selected,
  onClick,
  children,
  hint,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 border px-4 py-3 text-left transition ${
        selected
          ? 'border-gold bg-gold/10 text-foreground'
          : 'border-border bg-muted/40 text-foreground/80 hover:border-foreground/30'
      }`}
    >
      <span className="flex items-center justify-between gap-3 text-sm">
        {children}
        {selected ? <Check className="size-4 shrink-0 text-gold-text" aria-hidden="true" /> : null}
      </span>
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{hint}</span> : null}
    </button>
  )
}

function ImageWithFallback({
  image,
  name,
  broken,
  onError,
  onOpen,
  className = 'aspect-[4/3]',
}: {
  image?: EventDesignImage | null
  name: string
  broken: boolean
  onError: () => void
  onOpen?: () => void
  className?: string
}) {
  if (!image || broken) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden border-b border-border-subtle bg-muted/50 ${className}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--gold) 16%, transparent), transparent 55%)',
        }}
      >
        <ImageOff className="size-7 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 max-w-[220px] px-4 text-center text-[11px] leading-5 text-muted-foreground">
          Reference image unavailable. Your quote can include real portfolio images.
        </p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden border-b border-border-subtle bg-muted/60 ${className}`}>
      <img
        src={image.url}
        alt={image.alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={onError}
      />
      <span className="absolute left-3 top-3 border border-white/20 bg-black/55 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
        Reference inspiration
      </span>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View larger reference image for ${name}`}
          className="absolute right-3 top-3 flex size-8 items-center justify-center border border-white/20 bg-black/55 text-white/85 backdrop-blur-sm transition hover:border-gold hover:text-gold-text"
        >
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function RecommendationCard({
  recommendation,
  brokenImages,
  onImageError,
  onOpenImage,
  selected,
  compareSelected,
  onSelect,
  onCompare,
  onCustomize,
  onSave,
  saving,
  saved,
  customizing,
  customChange,
  onCustomChange,
  onCustomSubmit,
  onCustomCancel,
}: {
  recommendation: EventDesignRecommendation
  brokenImages: Set<string>
  onImageError: (url: string) => void
  onOpenImage: (image: EventDesignImage) => void
  selected: boolean
  compareSelected: boolean
  onSelect: () => void
  onCompare: () => void
  onCustomize: () => void
  onSave: () => void
  saving: boolean
  saved: boolean
  customizing: boolean
  customChange: string
  onCustomChange: (value: string) => void
  onCustomSubmit: () => void
  onCustomCancel: () => void
}) {
  const hero = recommendation.images[0]
  const budget = recommendation.budget

  return (
    <article
      className={`flex h-full flex-col border bg-card transition ${
        selected ? 'border-gold shadow-[0_0_0_1px_rgba(213,174,121,0.25)]' : 'border-border'
      }`}
      aria-label={`${recommendation.name} design recommendation`}
    >
      <ImageWithFallback
        image={hero}
        name={recommendation.name}
        broken={Boolean(hero && brokenImages.has(hero.url))}
        onError={() => hero && onImageError(hero.url)}
        onOpen={hero ? () => onOpenImage(hero) : undefined}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-gold/30 bg-gold/8 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-gold-text">
            {recommendation.style}
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/90">
            {recommendation.source === 'ai' ? 'AI-assisted' : 'Curated idea'}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-2xl leading-tight text-foreground">{recommendation.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.description}</p>
        <p className="mt-2 text-xs leading-5 text-gold-text/85">{recommendation.mood}</p>

        <div className="mt-4 flex items-center gap-2" aria-label="Suggested colour palette">
          <Palette className="size-3.5 text-muted-foreground" aria-hidden="true" />
          {recommendation.colors.map(color => (
            <span
              key={color}
              className="size-4 border border-border"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="mt-4 border border-border-subtle bg-muted/40 p-3">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/90">
            <IndianRupee className="size-3" aria-hidden="true" /> Indicative catalog total
          </p>
          {budget.type === 'catalog_estimate' ? (
            <p className="mt-1 font-serif text-2xl text-foreground">
              From {formatCurrency(budget.min)}
            </p>
          ) : (
            <p className="mt-1 font-serif text-xl text-foreground">Custom quote required</p>
          )}
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{budget.note}</p>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/90">
            <Layers className="size-3" aria-hidden="true" /> Real catalog services
          </p>
          {recommendation.services.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {recommendation.services.map(service => (
                <li key={service.id} className="flex items-start justify-between gap-3 text-xs">
                  <span className="min-w-0 text-foreground/80">
                    {service.name}
                    <span className="block text-[10px] text-muted-foreground">{service.category.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="shrink-0 text-gold-text/85">
                    {service.price === null ? 'Quote' : formatCurrency(service.price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              No matching catalog service was found for this direction. Request a quote and the team will scope it.
            </p>
          )}
        </div>

        <details className="group mt-4 border-t border-border-subtle pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Stage, lighting &amp; details
            <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
            <p><span className="text-foreground/85">Stage:</span> {recommendation.stageConcept}</p>
            <p><span className="text-foreground/85">Lighting:</span> {recommendation.lighting}</p>
            <p><span className="text-foreground/85">Why it fits:</span> {recommendation.whyItFits}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recommendation.elements.slice(0, 6).map(element => (
                <span key={element} className="border border-border-subtle px-2 py-1 text-[10px] text-muted-foreground">
                  {element}
                </span>
              ))}
            </div>
            {recommendation.upgrades.length > 0 ? (
              <p className="pt-1 text-[11px] text-muted-foreground/90">
                <span className="text-foreground/75">Upgrades:</span> {recommendation.upgrades.join(' · ')}
              </p>
            ) : null}
          </div>
        </details>

        {customizing ? (
          <div className="mt-4 border border-gold/25 bg-gold/5 p-3">
            <label htmlFor={`customize-${recommendation.id}`} className="text-[10px] uppercase tracking-[0.16em] text-gold-text">
              What should change?
            </label>
            <textarea
              id={`customize-${recommendation.id}`}
              value={customChange}
              onChange={event => onCustomChange(event.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Make it more floral, use pastel colours, reduce the budget…"
              className="mt-2 w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onCustomSubmit}
                disabled={customChange.trim().length < 3}
                className="bg-gold px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-gold-foreground disabled:opacity-40"
              >
                Update design
              </button>
              <button
                type="button"
                onClick={onCustomCancel}
                className="border border-border px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <button
            type="button"
            onClick={onSelect}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.16em] transition ${
              selected
                ? 'bg-gold text-gold-foreground'
                : 'border border-gold text-gold-text hover:bg-gold hover:text-gold-foreground'
            }`}
          >
            {selected ? <><Check className="size-3.5" aria-hidden="true" /> Selected</> : <>Choose this design <ArrowRight className="size-3.5" aria-hidden="true" /></>}
          </button>
          <button
            type="button"
            onClick={onCustomize}
            className="flex items-center justify-center border border-border px-3 py-3 text-muted-foreground transition hover:border-gold/50 hover:text-gold-text"
            aria-label={`Customize ${recommendation.name}`}
          >
            <Wand2 className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || saved}
            className={`flex items-center justify-center border px-3 py-3 transition ${
              saved
                ? 'border-success/40 text-success'
                : 'border-border text-muted-foreground hover:border-gold/50 hover:text-gold-text'
            } disabled:opacity-50`}
            aria-label={saved ? `${recommendation.name} saved` : `Save ${recommendation.name}`}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : saved ? <Check className="size-3.5" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={compareSelected}
            className={`flex items-center justify-center border px-3 py-3 transition ${
              compareSelected
                ? 'border-gold bg-gold/10 text-gold-text'
                : 'border-border text-muted-foreground hover:border-gold/50 hover:text-gold-text'
            }`}
            aria-label={`${compareSelected ? 'Remove' : 'Add'} ${recommendation.name} ${compareSelected ? 'from' : 'to'} comparison`}
          >
            <GitCompare className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function EventDesignAssistant() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [form, setForm] = useState<AssistantForm>(initialForm)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [result, setResult] = useState<EventDesignResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDesign, setSelectedDesign] = useState<SelectedEventDesign | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const [imageModal, setImageModal] = useState<EventDesignImage | null>(null)
  const [customizingId, setCustomizingId] = useState<string | null>(null)
  const [customChange, setCustomChange] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [variation, setVariation] = useState(0)
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedError, setSavedError] = useState('')
  const [savedDesigns, setSavedDesigns] = useState<SavedEventDesign[]>([])
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const eventType = searchParams.get('eventType')?.toUpperCase() ?? ''
    const eventDate = searchParams.get('eventDate') ?? searchParams.get('date') ?? ''
    const guestCount = searchParams.get('guestCount') ?? searchParams.get('guests') ?? ''
    const city = searchParams.get('city') ?? ''
    const budget = searchParams.get('budget') ?? ''
    const style = searchParams.get('style') ?? ''
    setForm(current => ({
      ...current,
      eventType: EVENT_TYPES.some(item => item.value === eventType) ? eventType : current.eventType,
      eventDate: /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : current.eventDate,
      guestCount: /^\d{1,5}$/.test(guestCount) ? guestCount : current.guestCount,
      city,
      budgetPreset: /^\d+$/.test(budget) ? 'custom' : current.budgetPreset,
      customBudget: /^\d+$/.test(budget) ? budget : current.customBudget,
      style: STYLES.some(item => item.value === style) ? (style as EventDesignStyle) : current.style,
    }))
  }, [searchParams])

  useEffect(() => {
    if (!savedOpen || !isAuthenticated) return
    let cancelled = false
    setSavedLoading(true)
    setSavedError('')
    eventDesignApi
      .saved()
      .then(response => {
        if (!cancelled) setSavedDesigns(response.designs)
      })
      .catch(() => {
        if (!cancelled) setSavedError('Saved designs could not be loaded.')
      })
      .finally(() => {
        if (!cancelled) setSavedLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [savedOpen, isAuthenticated])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setImageModal(null)
        setCompareOpen(false)
        setSavedOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const setField = <K extends keyof AssistantForm>(key: K, value: AssistantForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setError('')
  }

  function toggleList(key: 'colors' | 'services', value: string, max?: number) {
    setForm(current => {
      const exists = current[key].includes(value)
      if (!exists && max && current[key].length >= max) {
        toast(`Choose up to ${max} ${key === 'colors' ? 'colours' : 'services'}.`, 'error')
        return current
      }
      return {
        ...current,
        [key]: exists ? current[key].filter(item => item !== value) : [...current[key], value],
      }
    })
    setError('')
  }

  function selectedBudget(): number | null {
    if (form.budgetPreset === 'custom') {
      const value = Number(form.customBudget)
      return Number.isFinite(value) && value >= 1000 ? value : null
    }
    if (form.budgetPreset === 'unsure' || !form.budgetPreset) return null
    const value = Number(form.budgetPreset)
    return Number.isFinite(value) ? value : null
  }

  function validateBasics(): string | null {
    if (!form.eventType) return 'Choose the type of event first.'
    if (form.eventDate && form.eventDate < todayISO()) return 'Choose a future event date, or leave it flexible.'
    const guests = form.guestCount ? Number(form.guestCount) : null
    if (form.guestCount && (!Number.isInteger(guests) || (guests ?? 0) < 1 || (guests ?? 0) > 5000)) {
      return 'Enter a guest count between 1 and 5,000.'
    }
    if (form.budgetPreset === 'custom' && (!form.customBudget || selectedBudget() === null)) {
      return 'Enter a budget of at least ₹1,000, or choose “Not sure yet”.'
    }
    return null
  }

  function buildRequirements(): EventDesignRequirements {
    return {
      eventType: form.eventType,
      eventDate: form.eventDate ? new Date(`${form.eventDate}T12:00:00+05:30`).toISOString() : null,
      city: form.city.trim() || undefined,
      guestCount: form.guestCount ? Number(form.guestCount) : null,
      budget: selectedBudget(),
      style: form.style || undefined,
      colors: form.colors.length > 0 ? form.colors : undefined,
      venueType: (form.venueType || undefined) as EventDesignRequirements['venueType'],
      services: form.services.length > 0 ? form.services : undefined,
      notes: form.notes.trim() || undefined,
      eventId: searchParams.get('eventId') ?? undefined,
    }
  }

  async function handleGenerate() {
    const basicsError = validateBasics()
    if (basicsError) {
      setError(basicsError)
      setStep(1)
      return
    }
    setLoading(true)
    setError('')
    setStep(3)
    setSelectedId(null)
    setSelectedDesign(null)
    setCompareIds([])
    setVariation(0)
    try {
      const response = await eventDesignApi.recommendations(buildRequirements())
      setResult(response)
    } catch (requestError) {
      setError(
        (requestError as { error?: string })?.error ??
          'We could not generate designs right now. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    if (!result) return
    setLoading(true)
    setError('')
    const nextVariation = variation + 1
    try {
      const response = await eventDesignApi.regenerate({
        ...result.requirements,
        variation: nextVariation,
      })
      setResult(response)
      setVariation(nextVariation)
      setSelectedId(null)
      setSelectedDesign(null)
      setCompareIds([])
      setSavedIds(new Set())
      toast('Three fresh directions are ready.', 'success')
    } catch (requestError) {
      setError(
        (requestError as { error?: string })?.error ??
          'We could not refresh the designs. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function chooseRecommendation(recommendation: EventDesignRecommendation) {
    if (!result) return
    const selection: SelectedEventDesign = {
      recommendationId: recommendation.id,
      name: recommendation.name,
      style: recommendation.style,
      colors: recommendation.colors,
      image: recommendation.images[0]?.url ?? null,
      serviceIds: recommendation.serviceIds,
      services: recommendation.services.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
      })),
      budget: recommendation.budget,
      eventType: result.requirements.eventType,
      eventDate: result.requirements.eventDate ?? null,
      city: result.requirements.city,
      guestCount: result.requirements.guestCount ?? null,
      budgetInput: result.requirements.budget ?? null,
    }
    try {
      localStorage.setItem(SELECTED_DESIGN_KEY, JSON.stringify(selection))
    } catch {
      // Storage can be unavailable in private modes; the selection still works
      // for this page and can be saved to an account below.
    }
    setSelectedId(recommendation.id)
    setSelectedDesign(selection)
    toast('Design selected. Continue when you are ready to request a quote.', 'success')
  }

  async function handleSave(recommendation: EventDesignRecommendation) {
    if (!isAuthenticated) {
      router.push('/login?next=%2Fevent-design-assistant')
      return
    }
    if (!result) return
    setSavingId(recommendation.id)
    try {
      await eventDesignApi.save({
        requirements: result.requirements,
        recommendation,
      })
      setSavedIds(current => new Set(current).add(recommendation.id))
      toast('Design saved to your account.', 'success')
    } catch (requestError) {
      toast(
        (requestError as { error?: string })?.error ?? 'Could not save this design. Please try again.',
        'error',
      )
    } finally {
      setSavingId(null)
    }
  }

  async function handleCustomize(recommendation: EventDesignRecommendation) {
    if (!result || customChange.trim().length < 3) return
    setCustomizingId(recommendation.id)
    try {
      const response = await eventDesignApi.customize({
        requirements: result.requirements,
        change: customChange.trim(),
        baseId: recommendation.id,
        variation: variation + 1,
      })
      setResult(current =>
        current
          ? {
              ...current,
              recommendations: current.recommendations.map(item =>
                item.id === recommendation.id ? response.recommendation : item,
              ),
            }
          : current,
      )
      setSelectedId(null)
      setSelectedDesign(null)
      setCustomChange('')
      setCustomizingId(null)
      toast('Design updated. Review the new direction and choose it if it feels right.', 'success')
    } catch (requestError) {
      setCustomizingId(null)
      toast(
        (requestError as { error?: string })?.error ?? 'Could not update this design. Please try again.',
        'error',
      )
    }
  }

  function toggleCompare(recommendation: EventDesignRecommendation) {
    setCompareIds(current => {
      if (current.includes(recommendation.id)) return current.filter(id => id !== recommendation.id)
      if (current.length >= 2) {
        toast('You can compare two designs at a time.', 'error')
        return current
      }
      return [...current, recommendation.id]
    })
  }

  function continueToRequest() {
    if (!selectedDesign) return
    const params = new URLSearchParams({ design: '1' })
    params.set('type', mapToPlanEventType(selectedDesign.eventType))
    if (selectedDesign.eventDate) params.set('date', selectedDesign.eventDate.slice(0, 10))
    if (selectedDesign.guestCount) params.set('guests', String(selectedDesign.guestCount))
    if (selectedDesign.city) params.set('city', selectedDesign.city)
    router.push(`/plan-event?${params.toString()}`)
  }

  async function useSavedDesign(design: SavedEventDesign) {
    try {
      const response = await eventDesignApi.savedDesign(design.id)
      const ai = response.design.aiResponse as {
        recommendation?: EventDesignRecommendation
        requirements?: EventDesignRequirements
      }
      if (!ai.recommendation) {
        toast('This saved design does not have a reusable recommendation.', 'error')
        return
      }
      const requirements = ai.requirements ?? {
        eventType: design.eventType,
        city: design.city ?? undefined,
        eventDate: design.eventDate,
      }
      setResult({
        recommendations: [ai.recommendation],
        requirements,
        source: ai.recommendation.source,
        notice: 'This design was loaded from your saved designs.',
        imageDisclaimer:
          'Images are reference inspiration from the Heptome catalog, not a photo of the exact concept.',
        generatedAt: new Date().toISOString(),
      })
      setStep(3)
      setSelectedId(null)
      setSelectedDesign(null)
      setSavedOpen(false)
      setVariation(0)
    } catch (requestError) {
      toast(
        (requestError as { error?: string })?.error ?? 'Could not load this saved design.',
        'error',
      )
    }
  }

  function reset() {
    setStep(1)
    setResult(null)
    setSelectedId(null)
    setSelectedDesign(null)
    setCompareIds([])
    setError('')
    setVariation(0)
    setSavedIds(new Set())
  }

  const compareRecommendations = result?.recommendations.filter(recommendation =>
    compareIds.includes(recommendation.id),
  ) ?? []

  return (
    <div className="min-h-screen bg-background">
      <section
        className="border-b border-border-subtle bg-surface-muted px-5 py-12 lg:px-10 lg:py-16"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 10%, color-mix(in srgb, var(--gold) 14%, transparent), transparent 42%)',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">
                <Sparkles className="size-3.5" aria-hidden="true" /> AI event design assistant
              </p>
              <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Find the perfect design<br />
                <em className="font-light text-gold-text">for your event.</em>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Answer a few questions. We will suggest three directions with reference images,
                real catalog services and honest indicative pricing. Every recommendation is a
                starting point for a conversation, not a confirmed package.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setSavedOpen(true)}
                  className="flex items-center gap-2 border border-border px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-foreground/75 transition hover:border-gold/50 hover:text-gold-text"
                >
                  <Save className="size-3.5" aria-hidden="true" /> Saved designs
                </button>
              ) : (
                <Link
                  href="/login?next=%2Fevent-design-assistant"
                  className="flex items-center gap-2 border border-border px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-foreground/75 transition hover:border-gold/50 hover:text-gold-text"
                >
                  <Save className="size-3.5" aria-hidden="true" /> Sign in to save
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.16em]">
            {[
              { number: 1, label: 'Your event' },
              { number: 2, label: 'Your style' },
              { number: 3, label: 'Three designs' },
            ].map(item => (
              <div key={item.number} className="flex items-center gap-2">
                <span
                  className={`flex size-6 items-center justify-center border text-[10px] ${
                    step >= item.number
                      ? 'border-gold bg-gold text-gold-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {step > item.number ? <Check className="size-3" aria-hidden="true" /> : item.number}
                </span>
                <span className={step >= item.number ? 'text-foreground/80' : 'text-muted-foreground'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
        {step === 1 ? (
          <section aria-labelledby="event-basics-heading" className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold-text">Step 1 of 2</p>
                <h2 id="event-basics-heading" className="mt-2 font-serif text-3xl text-foreground">Tell us about the event.</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Only the event type is required. Add what you know — you can refine it in the next step.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-medium text-foreground/90">Event type *</span>
                <select
                  value={form.eventType}
                  onChange={event => setField('eventType', event.target.value)}
                  className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="">Choose an event type</option>
                  {EVENT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/90"><CalendarDays className="size-3.5 text-gold-text" aria-hidden="true" /> Event date</span>
                <input
                  type="date"
                  min={todayISO()}
                  value={form.eventDate}
                  onChange={event => setField('eventDate', event.target.value)}
                  className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                />
                <span className="mt-1 block text-[10px] text-muted-foreground">Leave blank if the date is flexible.</span>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/90"><Users className="size-3.5 text-gold-text" aria-hidden="true" /> Guest count</span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  inputMode="numeric"
                  value={form.guestCount}
                  onChange={event => setField('guestCount', event.target.value)}
                  placeholder="e.g. 80"
                  className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/90"><MapPin className="size-3.5 text-gold-text" aria-hidden="true" /> City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={event => setField('city', event.target.value)}
                  placeholder="e.g. Mumbai"
                  maxLength={120}
                  className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/90"><IndianRupee className="size-3.5 text-gold-text" aria-hidden="true" /> Budget</span>
                <select
                  value={form.budgetPreset}
                  onChange={event => setField('budgetPreset', event.target.value)}
                  className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="">Not specified</option>
                  {BUDGETS.map(budget => <option key={budget.value} value={budget.value}>{budget.label}</option>)}
                </select>
              </label>

              {form.budgetPreset === 'custom' ? (
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium text-foreground/90">Custom budget (INR)</span>
                  <input
                    type="number"
                    min={1000}
                    inputMode="numeric"
                    value={form.customBudget}
                    onChange={event => setField('customBudget', event.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                  />
                </label>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-5 flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
              </p>
            ) : null}

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const basicsError = validateBasics()
                  if (basicsError) setError(basicsError)
                  else setStep(2)
                }}
                className="flex items-center gap-2 bg-gold px-6 py-3.5 text-[10px] uppercase tracking-[0.18em] text-gold-foreground transition hover:bg-gold-soft"
              >
                Next: style <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section aria-labelledby="style-heading" className="mx-auto max-w-3xl">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-gold-text">
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to event details
            </button>
            <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-gold-text">Step 2 of 2</p>
            <h2 id="style-heading" className="mt-2 font-serif text-3xl text-foreground">What should it feel like?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Pick a direction and any services you already know you want. The assistant will use the real catalog and your budget.</p>

            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium text-foreground/90"><Palette className="size-3.5 text-gold-text" aria-hidden="true" /> Style</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {STYLES.map(style => (
                  <StyleChip
                    key={style.value}
                    selected={form.style === style.value}
                    onClick={() => setField('style', form.style === style.value ? '' : style.value)}
                    hint={style.hint}
                  >
                    {style.label}
                  </StyleChip>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium text-foreground/90"><Palette className="size-3.5 text-gold-text" aria-hidden="true" /> Colours <span className="font-normal text-muted-foreground">(optional, up to 4)</span></p>
              <div className="flex flex-wrap gap-2">
                {COLOURS.map(color => {
                  const selected = form.colors.includes(color.hex)
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => toggleList('colors', color.hex, 4)}
                      aria-pressed={selected}
                      title={color.name}
                      className={`flex items-center gap-2 border px-3 py-2 text-[11px] transition ${selected ? 'border-gold text-gold-text' : 'border-border text-muted-foreground hover:border-foreground/30'}`}
                    >
                      <span className="size-4 border border-border" style={{ backgroundColor: color.hex }} />
                      {color.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium text-foreground/90"><Layers className="size-3.5 text-gold-text" aria-hidden="true" /> Services you want</p>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(service => {
                  const selected = form.services.includes(service)
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleList('services', service)}
                      aria-pressed={selected}
                      className={`border px-3 py-2 text-[11px] transition ${selected ? 'border-gold bg-gold/10 text-gold-text' : 'border-border text-muted-foreground hover:border-foreground/30'}`}
                    >
                      {service}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/90"><MapPin className="size-3.5 text-gold-text" aria-hidden="true" /> Venue type</span>
                <select
                  value={form.venueType}
                  onChange={event => setField('venueType', event.target.value)}
                  className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="">Not decided yet</option>
                  {VENUE_TYPES.map(venue => <option key={venue.value} value={venue.value}>{venue.label}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/90"><Lightbulb className="size-3.5 text-gold-text" aria-hidden="true" /> Anything else?</span>
                <textarea
                  value={form.notes}
                  onChange={event => setField('notes', event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Family traditions, must-have moments, a colour you love, accessibility needs…"
                  className="w-full resize-none border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </label>
            </div>

            {error ? (
              <p role="alert" className="mt-5 flex items-start gap-2 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-sm text-[11px] leading-5 text-muted-foreground">
                Designs are inspiration. Catalog prices are indicative for the listed services; the final quote confirms availability and scope.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 bg-gold px-6 py-3.5 text-[10px] uppercase tracking-[0.18em] text-gold-foreground transition hover:bg-gold-soft disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                {loading ? 'Designing…' : 'Show three designs'}
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="designs-heading" aria-busy={loading}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-gold-text">
                  <ArrowLeft className="size-3.5" aria-hidden="true" /> Change preferences
                </button>
                <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-gold-text">Your design directions</p>
                <h2 id="designs-heading" className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
                  Three ways to make it yours.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {result?.requirements.city ? `${result.requirements.city} · ` : ''}
                  {result?.requirements.guestCount ? `${result.requirements.guestCount} guests · ` : ''}
                  {formatDate(result?.requirements.eventDate)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={reset} className="border border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
                  Start over
                </button>
                <button type="button" onClick={handleRegenerate} disabled={loading} className="flex items-center gap-2 border border-gold/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-gold-text transition hover:bg-gold/10 disabled:opacity-50">
                  <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Regenerate
                </button>
              </div>
            </div>

            {error ? (
              <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}</span>
                <button type="button" onClick={handleGenerate} className="border border-destructive/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]">Try again</button>
              </div>
            ) : null}

            {result?.notice ? (
              <p role="status" className="mt-5 border border-gold/20 bg-gold/5 px-4 py-3 text-xs leading-5 text-gold-text/85">
                {result.notice}
              </p>
            ) : null}

            {loading ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-3" aria-label="Generating design recommendations">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse border border-border bg-card">
                    <div className="aspect-[4/3] bg-muted/60" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-1/3 bg-muted-foreground/20" />
                      <div className="h-6 w-3/4 bg-muted-foreground/20" />
                      <div className="h-3 w-full bg-muted/60" />
                      <div className="h-3 w-5/6 bg-muted/60" />
                      <div className="h-20 w-full bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : result && result.recommendations.length > 0 ? (
              <>
                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  {result.recommendations.map(recommendation => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      brokenImages={brokenImages}
                      onImageError={url => setBrokenImages(current => new Set(current).add(url))}
                      onOpenImage={setImageModal}
                      selected={selectedId === recommendation.id}
                      compareSelected={compareIds.includes(recommendation.id)}
                      onSelect={() => chooseRecommendation(recommendation)}
                      onCompare={() => toggleCompare(recommendation)}
                      onCustomize={() => {
                        setCustomizingId(current => (current === recommendation.id ? null : recommendation.id))
                        setCustomChange('')
                      }}
                      onSave={() => handleSave(recommendation)}
                      saving={savingId === recommendation.id}
                      saved={savedIds.has(recommendation.id)}
                      customizing={customizingId === recommendation.id}
                      customChange={customChange}
                      onCustomChange={setCustomChange}
                      onCustomSubmit={() => handleCustomize(recommendation)}
                      onCustomCancel={() => {
                        setCustomizingId(null)
                        setCustomChange('')
                      }}
                    />
                  ))}
                </div>

                {compareIds.length > 0 ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-border-subtle bg-muted/40 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {compareIds.length} design{compareIds.length === 1 ? '' : 's'} selected for comparison.
                      {compareIds.length === 1 ? ' Add one more to compare side by side.' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCompareOpen(true)}
                      disabled={compareIds.length < 2}
                      className="flex items-center gap-2 border border-gold/40 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-gold-text disabled:opacity-40"
                    >
                      <GitCompare className="size-3.5" aria-hidden="true" /> Compare
                    </button>
                  </div>
                ) : null}

                {selectedDesign ? (
                  <div className="mt-6 border border-gold/35 bg-gold/8 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {selectedDesign.image ? (
                          <img src={selectedDesign.image} alt="" className="size-16 border border-border object-cover" />
                        ) : (
                          <span className="flex size-16 items-center justify-center border border-border bg-muted/60"><Sparkles className="size-5 text-gold-text/60" aria-hidden="true" /></span>
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gold-text">Selected design</p>
                          <p className="mt-1 font-serif text-xl text-foreground">{selectedDesign.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {selectedDesign.style} · {selectedDesign.services.length} catalog services · {formatCurrency(selectedDesign.budget?.min)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setSelectedDesign(null)} className="border border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          Clear
                        </button>
                        <button type="button" onClick={continueToRequest} className="flex items-center gap-2 bg-gold px-5 py-2.5 text-[10px] uppercase tracking-[0.16em] text-gold-foreground">
                          Continue to event request <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                      Your event details and selected design will be carried into the event request. Nothing is booked or charged; a planner will confirm availability and send a proposal.
                    </p>
                  </div>
                ) : (
                  <p className="mt-5 text-xs text-muted-foreground/90">Choose a design to carry it into your event request. You can still save or compare directions first.</p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-5 text-[11px] leading-5 text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-gold-text/70" aria-hidden="true" />
                  <p>{result.imageDisclaimer}</p>
                </div>
              </>
            ) : (
              <div className="mt-8 border border-border-subtle bg-muted/40 p-8 text-center">
                <ImageOff className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-serif text-2xl text-foreground">No designs to show yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try again, or change your preferences to give the assistant more to work with.</p>
                <button type="button" onClick={() => setStep(2)} className="mt-4 bg-gold px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-gold-foreground">Change preferences</button>
              </div>
            )}
          </section>
        ) : null}
      </div>

      {imageModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Reference image">
          <button type="button" onClick={() => setImageModal(null)} className="absolute right-4 top-4 flex size-10 items-center justify-center border border-white/20 bg-black/60 text-white/80" aria-label="Close image">
            <X className="size-5" aria-hidden="true" />
          </button>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto border border-border bg-card">
            <img src={imageModal.url} alt={imageModal.alt} className="max-h-[72vh] w-full object-contain" />
            <div className="p-4">
              <p className="text-sm text-foreground/85">{imageModal.alt}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {imageModal.source}{imageModal.credit ? ` · ${imageModal.credit}` : ''} · Reference inspiration, not a photo of the exact concept.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {compareOpen ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/85 p-4" role="dialog" aria-modal="true" aria-labelledby="compare-heading">
          <div className="mx-auto max-w-5xl border border-border bg-card p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold-text">Side by side</p>
                <h2 id="compare-heading" className="mt-1 font-serif text-3xl text-foreground">Compare designs</h2>
              </div>
              <button type="button" onClick={() => setCompareOpen(false)} className="flex size-9 items-center justify-center border border-border text-foreground/80" aria-label="Close comparison">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {compareRecommendations.map(recommendation => (
                <div key={recommendation.id} className="border border-border-subtle bg-muted/40">
                  <ImageWithFallback
                    image={recommendation.images[0]}
                    name={recommendation.name}
                    broken={Boolean(recommendation.images[0] && brokenImages.has(recommendation.images[0].url))}
                    onError={() => recommendation.images[0] && setBrokenImages(current => new Set(current).add(recommendation.images[0].url))}
                    className="aspect-[16/9]"
                  />
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-gold-text">{recommendation.style}</p>
                    <h3 className="mt-1 font-serif text-2xl text-foreground">{recommendation.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{recommendation.description}</p>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Catalog total</dt><dd className="text-gold-text/85">{formatCurrency(recommendation.budget.min)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Services</dt><dd className="text-right text-foreground/75">{recommendation.services.map(service => service.name).join(', ') || 'Custom quote'}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Venue</dt><dd className="text-right text-foreground/75">{recommendation.venueType}</dd></div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => {
                        chooseRecommendation(recommendation)
                        setCompareOpen(false)
                      }}
                      className="mt-4 w-full bg-gold px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-gold-foreground"
                    >
                      Choose this design
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {savedOpen ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/85 p-4" role="dialog" aria-modal="true" aria-labelledby="saved-heading">
          <div className="mx-auto max-w-3xl border border-border bg-card p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold-text">Your account</p>
                <h2 id="saved-heading" className="mt-1 font-serif text-3xl text-foreground">Saved designs</h2>
              </div>
              <button type="button" onClick={() => setSavedOpen(false)} className="flex size-9 items-center justify-center border border-border text-foreground/80" aria-label="Close saved designs">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            {savedLoading ? (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading saved designs…</p>
            ) : savedError ? (
              <p role="alert" className="mt-6 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{savedError}</p>
            ) : savedDesigns.length === 0 ? (
              <div className="mt-6 border border-border-subtle p-8 text-center">
                <Save className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">No saved designs yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Choose a direction and press the save icon to keep it here.</p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {savedDesigns.map(design => (
                  <li key={design.id} className="flex flex-wrap items-center gap-4 border border-border-subtle p-3">
                    {design.image ? <img src={design.image} alt="" className="size-16 border border-border-subtle object-cover" /> : <span className="flex size-16 items-center justify-center border border-border-subtle bg-muted/60"><ImageOff className="size-5 text-muted-foreground" aria-hidden="true" /></span>}
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xl text-foreground">{design.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/90">{design.style} · {design.eventType.replace(/_/g, ' ')} · {formatDate(design.createdAt)}</p>
                    </div>
                    <button type="button" onClick={() => useSavedDesign(design)} className="border border-gold/40 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-gold-text">
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
