'use client'

import { useState, useEffect, useCallback, useRef, cloneElement, isValidElement, useId } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { technicianApi } from '@/lib/api'
import type { TechnicianCategory, TechnicianServiceItem, Technician } from '@/lib/api'
import {
  ArrowLeft, ArrowRight, Check, Loader2, Wrench, Zap, Droplets, Wind,
  Hammer, Paintbrush2, Shield, Sparkles, MapPin, CalendarDays,
  Clock, User, Camera, Star, Info, ChevronRight, AlertCircle,
  CheckCircle2, Home, Briefcase, Bug, Flower2, WashingMachine, Laptop,
  Layers, Droplet, Scissors, type LucideIcon,
} from 'lucide-react'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import SiteShell from '@/components/layout/SiteShell'
import { BOOKABLE_HOME_GROUPS, VISIT_CHARGE, GST_RATE, estimateHomeServiceTotal } from '@/lib/catalog'
import { checkCoverage, SUPPORTED_CITY } from '@/lib/service-area'
import { useLocation } from '@/lib/location'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Catalog `icon` names resolved to components — the catalog stays string-only. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Bug,
  Flower2,
  Scissors,
  Wind,
  WashingMachine,
  Zap,
  Droplets,
  Hammer,
  Paintbrush2,
  Shield,
  Laptop,
  Layers,
  Droplet,
}

/**
 * Booking categories come from `lib/catalog.ts`, so the wizard, the marketing
 * pages and the services index can never advertise a different set of services.
 * Only groups with a real booking category appear — plus the generic `OTHER`
 * category the API accepts for anything not covered by a group.
 */
const CATEGORIES = [
  ...BOOKABLE_HOME_GROUPS.map(group => ({
    id: group.bookingCategory as string,
    label: group.name,
    desc: group.blurb,
    icon: CATEGORY_ICONS[group.icon] ?? Wrench,
  })),
  { id: 'OTHER', label: 'Something Else', desc: 'Any other home repair or installation job', icon: Wrench },
]

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '8:00 AM – 10:00 AM' },
  { start: '10:00', end: '12:00', label: '10:00 AM – 12:00 PM' },
  { start: '12:00', end: '14:00', label: '12:00 PM – 2:00 PM' },
  { start: '14:00', end: '16:00', label: '2:00 PM – 4:00 PM' },
  { start: '16:00', end: '18:00', label: '4:00 PM – 6:00 PM' },
  { start: '18:00', end: '20:00', label: '6:00 PM – 8:00 PM' },
]

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash on Service', desc: 'Pay after service is complete', icon: '💵' },
  { id: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: '📱' },
  { id: 'CARD', label: 'Card', desc: 'Debit or Credit card', icon: '💳' },
  { id: 'ONLINE', label: 'Online Payment', desc: 'Net banking, wallets', icon: '🌐' },
]

const STEPS = [
  'Category', 'Service', 'Location', 'Date & Time',
  'Technician', 'Problem', 'Pricing', 'Payment', 'Confirm',
]

/** Draft key for the wizard, so signing in mid-flow does not lose the answers. */
const DRAFT_KEY = 'heptome_technician_booking_draft'
/** Legacy avān key — read once so a half-finished wizard survives the rebrand. */
const LEGACY_DRAFT_KEY = 'avan_technician_booking_draft'

interface BookingState {
  category: string
  categoryLabel: string
  serviceId: string
  service: TechnicianServiceItem | null
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressState: string
  addressPincode: string
  addressLabel: 'Home' | 'Work' | 'Other'
  scheduledDate: string
  timeSlotStart: string
  timeSlotEnd: string
  timeSlotLabel: string
  technicianId: string
  technician: Technician | null
  anyTechnician: boolean
  problemDescription: string
  attachments: string[]
  paymentMethod: string
}

const EMPTY: BookingState = {
  category: '', categoryLabel: '', serviceId: '', service: null,
  addressLine1: '', addressLine2: '', addressCity: '', addressState: '',
  addressPincode: '', addressLabel: 'Home',
  scheduledDate: '', timeSlotStart: '', timeSlotEnd: '', timeSlotLabel: '',
  technicianId: '', technician: null, anyTechnician: false,
  problemDescription: '', attachments: [], paymentMethod: 'CASH',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }

/** `YYYY-MM-DD` in the visitor's own timezone — never UTC, which would show yesterday's date after midnight IST. */
function toLocalISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function getNextDays(count = 7) {
  const days = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      value: toLocalISODate(d),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    })
  }
  return days
}

/** True when the date is one of the seven days the wizard offers. */
function isWithinBookingWindow(value: string, days: { value: string }[]) {
  return days.some(day => day.value === value)
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepCategory({ state, next }: { state: BookingState; set: (u: Partial<BookingState>) => void; next: (patch: Partial<BookingState>) => void }) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">What do you need help with?</h2>
      <p className="mb-8 text-sm text-muted-foreground">Choose a service category</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const active = state.category === cat.id
          return (
            <button type="button" key={cat.id}
              aria-pressed={active}
              onClick={() => next({ category: cat.id, categoryLabel: cat.label })}
              className={`flex items-start gap-4 border p-5 text-left transition ${active ? 'border-[#d5ae79] bg-[#d5ae79]/8' : 'border-white/12 bg-card hover:border-[#d5ae79]/40'}`}>
              <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-muted/60 text-gold-text">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{cat.desc}</p>
              </div>
              {active && <Check className="ml-auto mt-1 size-4 flex-shrink-0 text-gold-text" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepService({ state, set, next }: { state: BookingState; set: (u: Partial<BookingState>) => void; next: (patch: Partial<BookingState>) => void }) {
  const [services, setServices] = useState<TechnicianServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  /** Why the list is empty: the catalogue has none, or the request failed. */
  const [failure, setFailure] = useState<'empty' | 'error' | null>(null)

  useEffect(() => {
    if (!state.category) return
    let cancelled = false
    setLoading(true)
    setFailure(null)
    technicianApi.servicesByCategory(state.category)
      .then(list => {
        if (cancelled) return
        const active = list.filter(service => service.isActive !== false)
        setServices(active)
        setFailure(active.length === 0 ? 'empty' : null)
      })
      .catch(() => {
        if (cancelled) return
        setServices([])
        setFailure('error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [state.category])

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Select the service</h2>
      <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-gold-text">{state.categoryLabel}</p>
      <p className="mb-8 text-sm text-muted-foreground">What exactly do you need?</p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-7 animate-spin text-gold-text" /></div>
      ) : services.length === 0 ? (
        /*
         * No invented services. The booking API needs a real service id, so an
         * empty catalogue is a genuine dead end for this category — the honest
         * answer is to say so and offer a human, not to show placeholder prices.
         */
        <div className="border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground/80" />
          <p className="text-sm text-foreground/90">
            {failure === 'error'
              ? 'We could not load services for this category right now.'
              : 'This category has no bookable services listed yet.'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
            You can check another category, or send the details to the team and we will arrange the visit
            with a professional directly.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="border border-[#d5ae79] px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-[#d5ae79] transition hover:bg-[#d5ae79] hover:text-[#17151d]">
              Ask the team
            </Link>
            <Link href="/services" className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
              Browse other categories
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map(svc => {
            const active = state.serviceId === svc.id
            return (
              <button type="button" key={svc.id}
                aria-pressed={active}
                onClick={() => next({ serviceId: svc.id, service: svc })}
                className={`flex items-center gap-4 border p-4 text-left transition ${active ? 'border-[#d5ae79] bg-[#d5ae79]/8' : 'border-white/12 bg-card hover:border-[#d5ae79]/40'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{svc.name}</p>
                    {svc.isPopular && <span className="bg-[#d5ae79]/15 px-1.5 py-0.5 text-[9px] text-[#d5ae79]">Popular</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{svc.description}</p>
                  {svc.estimatedDuration && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/80">
                      <Clock className="size-3" /> Est. {svc.estimatedDuration} mins
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gold-text">
                    {svc.pricingType === 'CUSTOM_QUOTE' ? 'Get quote' : fmt(svc.basePrice)}
                  </p>
                  {svc.pricingType !== 'CUSTOM_QUOTE' && <p className="text-[10px] text-muted-foreground/80">starting from</p>}
                </div>
                <ChevronRight className="size-4 flex-shrink-0 text-muted-foreground/80" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StepLocation({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  const addressTypes: Array<{ id: 'Home' | 'Work' | 'Other'; icon: React.ElementType; label: string }> = [
    { id: 'Home', icon: Home, label: 'Home' },
    { id: 'Work', icon: Briefcase, label: 'Work' },
    { id: 'Other', icon: MapPin, label: 'Other' },
  ]
  const coverage = /^[0-9]{6}$/.test(state.addressPincode)
    ? checkCoverage({ city: state.addressCity, pincode: state.addressPincode })
    : null

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Service location</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Where should the professional come? Doorstep services currently run in {SUPPORTED_CITY}.
      </p>

      <div className="mb-6 flex gap-3">
        {addressTypes.map(({ id, icon: Icon, label }) => (
          <button type="button" key={id} aria-pressed={state.addressLabel === id} onClick={() => set({ addressLabel: id })}
            className={`flex items-center gap-2 border px-4 py-2.5 text-sm transition ${state.addressLabel === id ? 'border-[#d5ae79] bg-[#d5ae79]/10 text-[#d5ae79]' : 'border-white/15 text-white/50 hover:border-[#d5ae79]/40'}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <FormField label="Address Line 1 *" placeholder="House/Flat No., Building Name, Street">
          <input value={state.addressLine1} onChange={e => set({ addressLine1: e.target.value })}
            required placeholder="e.g. 42, Sunshine Apartments, MG Road"
            className="input-field" />
        </FormField>
        <FormField label="Address Line 2">
          <input value={state.addressLine2} onChange={e => set({ addressLine2: e.target.value })}
            placeholder="Area, Locality, Landmark (optional)"
            className="input-field" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="City *">
            <input value={state.addressCity} onChange={e => set({ addressCity: e.target.value })}
              required placeholder={SUPPORTED_CITY} className="input-field" />
          </FormField>
          <FormField label="State">
            <input value={state.addressState} onChange={e => set({ addressState: e.target.value })}
              placeholder="Karnataka" className="input-field" />
          </FormField>
          <FormField label="Pincode *">
            <input value={state.addressPincode} onChange={e => set({ addressPincode: e.target.value })}
              required placeholder="560034" maxLength={6} inputMode="numeric" className="input-field" />
          </FormField>
        </div>
      </div>

      {/* Coverage is checked here, before a slot is chosen — the same rule the
          pincode checker and the home-services pages use. */}
      {coverage && (
        <div
          aria-live="polite"
          className={`mt-5 flex items-start gap-3 border p-4 text-sm ${coverage.supported ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-200' : 'border-yellow-500/25 bg-yellow-500/8 text-yellow-200'}`}
        >
          {coverage.supported
            ? <Check className="mt-0.5 size-4 flex-shrink-0" />
            : <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />}
          <span className="leading-6">
            {coverage.supported
              ? `Covered — ${coverage.area?.name}. We can schedule a professional here.`
              : coverage.reason}
          </span>
        </div>
      )}
    </div>
  )
}

function StepDateTime({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  const days = getNextDays(7)
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">When do you need it?</h2>
      <p className="mb-8 text-sm text-muted-foreground">Choose a convenient date and time</p>

      <div className="mb-8">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Select date</p>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <button type="button" key={day.value} aria-pressed={state.scheduledDate === day.value} onClick={() => set({ scheduledDate: day.value })}
              className={`border px-5 py-3 text-sm transition ${state.scheduledDate === day.value ? 'border-[#d5ae79] bg-[#d5ae79]/10 text-[#d5ae79]' : 'border-white/15 text-white/60 hover:border-[#d5ae79]/40'}`}>
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Select time slot</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TIME_SLOTS.map(slot => (
            <button type="button" key={slot.start} aria-pressed={state.timeSlotStart === slot.start} onClick={() => set({ timeSlotStart: slot.start, timeSlotEnd: slot.end, timeSlotLabel: slot.label })}
              className={`flex items-center gap-2 border px-4 py-3.5 text-sm transition ${state.timeSlotStart === slot.start ? 'border-[#d5ae79] bg-[#d5ae79]/10 text-[#d5ae79]' : 'border-white/15 text-white/60 hover:border-[#d5ae79]/40'}`}>
              <Clock className="size-4 flex-shrink-0" />
              {slot.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepTechnician({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    technicianApi.available(state.category, state.scheduledDate)
      .then(setTechnicians).catch(() => {})
      .finally(() => setLoading(false))
  }, [state.category, state.scheduledDate])

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Choose a technician</h2>
      <p className="mb-8 text-sm text-muted-foreground">Pick one or let us assign the best available</p>

      {/* Auto-assign option */}
      <button type="button" aria-pressed={state.anyTechnician} onClick={() => set({ anyTechnician: true, technicianId: '', technician: null })}
        className={`mb-4 flex w-full items-center gap-4 border p-5 text-left transition ${state.anyTechnician ? 'border-[#d5ae79] bg-[#d5ae79]/8' : 'border-white/12 bg-card hover:border-[#d5ae79]/40'}`}>
        <div className="flex size-12 flex-shrink-0 items-center justify-center border border-border bg-muted/60">
          <User className="size-6 text-gold-text" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">Let Heptome assign a professional</p>
          <p className="mt-0.5 text-xs text-muted-foreground">A professional from this category is assigned to the slot you chose.</p>
        </div>
        {state.anyTechnician && <Check className="size-4 flex-shrink-0 text-gold-text" />}
      </button>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-gold-text" /></div>
      ) : technicians.length === 0 ? (
        <div className="border border-border bg-card p-6 text-center">
          <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground/80" />
          <p className="text-sm text-muted-foreground">No professional has published availability for this slot yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/80">Choose the assign option above and we will allocate one for this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {technicians.map(tech => {
            const active = state.technicianId === tech.id && !state.anyTechnician
            return (
              <button type="button" key={tech.id} aria-pressed={state.technicianId === tech.id} onClick={() => set({ technicianId: tech.id, technician: tech, anyTechnician: false })}
                className={`flex items-center gap-4 border p-4 text-left transition ${active ? 'border-[#d5ae79] bg-[#d5ae79]/8' : 'border-white/12 bg-card hover:border-[#d5ae79]/40'}`}>
                <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-full border border-border bg-muted/60">
                  {tech.avatar ? (
                    <img src={tech.avatar} alt={tech.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-medium text-muted-foreground">
                      {tech.name?.[0]}
                    </div>
                  )}
                  {tech.isVerified && (
                    <div className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#d5ae79]">
                      <Check className="size-2.5 text-[#0b0b0d]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{tech.name}</p>
                    {tech.isVerified && (
                      <span className="flex-shrink-0 border border-[#d5ae79]/30 px-1.5 py-0.5 text-[9px] uppercase text-gold-text">Verified</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="size-3 fill-[#d5ae79] text-gold-text" />{tech.rating.toFixed(1)}</span>
                    <span>{tech.completedJobs} jobs</span>
                    <span>{tech.experience}y exp</span>
                  </div>
                </div>
                {active && <Check className="size-4 flex-shrink-0 text-gold-text" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StepProblem({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Describe the problem</h2>
      <p className="mb-8 text-sm text-muted-foreground">Help the professional understand your issue before arriving</p>
      <div className="flex flex-col gap-5">
        <FormField label="Problem description">
          <textarea value={state.problemDescription}
            onChange={e => set({ problemDescription: e.target.value })}
            rows={5}
            placeholder="e.g. My kitchen sink has been leaking from under the basin for 2 days. The water pressure also seems low."
            className="input-field resize-none leading-6" />
        </FormField>

        {/*
         * Photos used to look like an upload, but the file never left the
         * browser (the booking API takes attachment URLs and the app has no
         * upload pipeline). The section is labelled as a local preview instead
         * of promising something that will not reach the professional.
         */}
        <div className="border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Camera className="size-3.5" aria-hidden="true" /> Photos — preview only
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            You can look at your photos here while you describe the problem, but they are not sent with this
            booking yet. Photos are not uploaded anywhere, and the professional will inspect the issue on
            arrival.
          </p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-[#d5ae79]/40 hover:text-muted-foreground">
            <Camera className="size-4" /> Preview photos from this device
            <input type="file" multiple accept="image/*" className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files ?? [])
                set({ attachments: files.map(f => URL.createObjectURL(f)) })
              }} />
          </label>
          {state.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {state.attachments.map((url, i) => (
                <img key={i} src={url} alt="" className="size-16 object-cover border border-border" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Estimate shown before payment.
 *
 * The arithmetic mirrors `backend/src/services/technician.ts` (visit charge +
 * service price, 18% GST, rounded) so the number the customer approves is the
 * number the API stores. The service price is only ever the one returned by the
 * catalogue — if there is no service (a restored draft, for example) we say the
 * amount is confirmed after inspection instead of inventing a base price.
 */
function useEstimate(state: BookingState) {
  const basePrice = state.service?.basePrice ?? null
  const estimate = basePrice === null ? null : estimateHomeServiceTotal(basePrice)
  return { basePrice, estimate }
}

function StepPricing({ state }: { state: BookingState }) {
  const { basePrice, estimate } = useEstimate(state)

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Price estimate</h2>
      <p className="mb-8 text-sm text-muted-foreground">Final price may vary based on inspection and materials</p>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Service breakdown</p>
        </div>
        <div className="flex flex-col gap-0 divide-y divide-white/8 px-5">
          <PriceLine
            label={state.service?.name ?? 'Service charge'}
            value={basePrice === null ? 'Confirmed after inspection' : fmt(basePrice)}
            dim={basePrice === null}
          />
          <PriceLine label="Visit charge" value={fmt(VISIT_CHARGE)} />
          <PriceLine label="Materials cost" value="As required" dim />
          {estimate ? (
            <div className="py-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span><span>{fmt(estimate.subtotal)}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>GST ({Math.round(GST_RATE * 100)}%)</span><span>{fmt(estimate.tax)}</span>
              </div>
            </div>
          ) : (
            <div className="py-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Visit charge subtotal</span><span>{fmt(VISIT_CHARGE)}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>GST ({Math.round(GST_RATE * 100)}%)</span><span>{fmt(Math.round(VISIT_CHARGE * GST_RATE))}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between py-4 text-base font-medium">
            <span className="text-foreground">Estimated Total</span>
            <span className="text-gold-text">
              {estimate ? fmt(estimate.total) : `${fmt(VISIT_CHARGE + Math.round(VISIT_CHARGE * GST_RATE))} + service`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/8 p-4">
        <AlertCircle className="mt-0.5 size-4 flex-shrink-0 text-yellow-400" />
        <p className="text-xs leading-5 text-yellow-300/80">
          <strong>Note:</strong> The estimate covers the service charge and the visit charge. If the job needs
          materials or extra labour, the professional tells you and gets your approval before proceeding — the
          final amount can differ from this estimate.
        </p>
      </div>
    </div>
  )
}

function StepPayment({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Payment method</h2>
      <p className="mb-2 text-sm text-muted-foreground">How would you like to pay once the work is done?</p>
      <p className="mb-8 flex items-start gap-2 text-xs leading-5 text-muted-foreground/80">
        <Info className="mt-0.5 size-3.5 flex-shrink-0" aria-hidden="true" />
        Nothing is charged now. You confirm the amount with the professional after the work is completed.
      </p>
      <div className="flex flex-col gap-3">
        {PAYMENT_METHODS.map(method => (
          <button type="button" key={method.id} aria-pressed={state.paymentMethod === method.id} onClick={() => set({ paymentMethod: method.id })}
            className={`flex items-center gap-4 border p-5 text-left transition ${state.paymentMethod === method.id ? 'border-[#d5ae79] bg-[#d5ae79]/8' : 'border-white/12 bg-card hover:border-[#d5ae79]/40'}`}>
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-foreground">{method.label}</p>
              <p className="text-xs text-muted-foreground">{method.desc}</p>
            </div>
            {state.paymentMethod === method.id && <Check className="size-4 text-gold-text" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepConfirm({ state }: { state: BookingState }) {
  const { estimate } = useEstimate(state)

  const rows: [string, string][] = [
    ['Service', state.service?.name ?? state.categoryLabel],
    ['Category', state.categoryLabel],
    ['Date', state.scheduledDate ? new Date(`${state.scheduledDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
    ['Time', state.timeSlotLabel || '—'],
    ['Professional', state.anyTechnician ? 'Heptome assigns one' : (state.technician?.name ?? 'Heptome assigns one')],
    ['Address', [state.addressLine1, state.addressLine2, state.addressCity, state.addressPincode].filter(Boolean).join(', ')],
    ['Payment', PAYMENT_METHODS.find(m => m.id === state.paymentMethod)?.label ?? state.paymentMethod],
    ['Estimated Total', estimate ? fmt(estimate.total) : `${fmt(VISIT_CHARGE + Math.round(VISIT_CHARGE * GST_RATE))} + service`],
  ]

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-foreground">Review & confirm</h2>
      <p className="mb-8 text-sm text-muted-foreground">Please check your booking details before sending the request</p>
      <div className="divide-y divide-white/8 border border-border bg-card">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <span className="flex-shrink-0 text-xs text-muted-foreground">{k}</span>
            <span className="text-right text-sm text-foreground/90">{v}</span>
          </div>
        ))}
      </div>
      {state.problemDescription && (
        <div className="mt-4 border border-border bg-card p-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your description</p>
          <p className="text-sm leading-6 text-muted-foreground">{state.problemDescription}</p>
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-muted-foreground/80">
        Sending this creates a booking request. It is confirmed once Heptome allocates a professional and they
        accept the slot — you will see the status in your dashboard.
      </p>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

interface CreatedBooking {
  bookingNumber: string
  totalAmount: number
  scheduledDate: string
  timeSlotStart: string
  timeSlotEnd: string
  /** Status the API returned — drives the wording, so we never claim more than the backend did. */
  status: string
  hasTechnician: boolean
}

/**
 * Confirmation screen.
 *
 * `POST /technicians/bookings` creates the booking as PENDING and assigns no
 * professional, so the screen says exactly that: the request is recorded, a
 * professional still has to be allocated, and payment happens after the work.
 * Claiming a confirmed visit here would be a lie the dashboard would contradict
 * a second later.
 */
function SuccessScreen({ booking }: { booking: CreatedBooking }) {
  const router = useRouter()
  const assigned = booking.hasTechnician || booking.status === 'TECHNICIAN_ASSIGNED' || booking.status === 'CONFIRMED'
  const statusCopy: Record<string, string> = {
    PENDING: 'Heptome has received your request and will allocate a professional for this slot.',
    CONFIRMED: 'Your booking is confirmed for the slot below.',
    TECHNICIAN_ASSIGNED: 'A professional has been assigned to your booking.',
    TECHNICIAN_CONFIRMED: 'Your professional has confirmed the slot below.',
  }

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-6 flex size-20 items-center justify-center bg-[#d5ae79]/15 text-[#d5ae79]">
        <CheckCircle2 className="size-10" />
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">
        {assigned ? 'Booking confirmed' : 'Request received'}
      </p>
      <h2 className="font-serif text-4xl text-foreground">{assigned ? "You're all set!" : 'Slot requested'}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {statusCopy[booking.status] ?? 'Your request is recorded and the team will follow up with the next step.'}
        {!assigned && ' You can follow the status from your dashboard.'}
      </p>

      <div className="mt-8 w-full max-w-sm border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Booking ID</p>
          <p className="mt-1 font-mono text-xl font-medium text-gold-text">{booking.bookingNumber}</p>
        </div>
        <div className="px-5 py-4 text-sm text-muted-foreground">
          <p className="flex justify-between"><span>Date</span><span className="text-foreground">{new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
          <p className="mt-2 flex justify-between"><span>Time</span><span className="text-foreground">{booking.timeSlotStart} – {booking.timeSlotEnd}</span></p>
          <p className="mt-2 flex justify-between"><span>Estimated Total</span><span className="text-gold-text">{fmt(booking.totalAmount)}</span></p>
          <p className="mt-2 flex justify-between"><span>Status</span><span className="text-foreground">{booking.status.replaceAll('_', ' ').toLowerCase()}</span></p>
        </div>
      </div>

      <p className="mt-5 max-w-sm text-xs leading-5 text-muted-foreground/80">
        No payment has been taken. The amount is settled with the professional after the work is completed.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => router.push('/dashboard?tab=home')}
          className="flex items-center gap-2 bg-[#d5ae79] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#17151d] hover:bg-[#e8cfa9]">
          Track booking <ArrowRight className="size-4" />
        </button>
        <button type="button" onClick={() => router.push('/')}
          className="flex items-center gap-2 border border-border px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:border-[#d5ae79] hover:text-gold-text">
          Back to home
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PriceLine({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className={`flex justify-between py-3 text-sm ${dim ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
      <span>{label}</span><span className={dim ? '' : 'text-foreground/90'}>{value}</span>
    </div>
  )
}

function FormField({
  label,
  placeholder,
  children,
}: {
  label: string
  placeholder?: string
  children: React.ReactNode
}) {
  const generatedId = useId()
  const childId = isValidElement(children)
    ? (children.props as { id?: string }).id ?? generatedId
    : generatedId

  // A <label> that merely sits above its input is not associated with it, so
  // screen readers announce an unlabelled field. The child gets the id (unless
  // it already has one) and the label points at it.
  const field = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ id?: string }>, { id: childId })
    : children

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={childId} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {placeholder ? <span className="sr-only"> — {placeholder}</span> : null}
      </label>
      {field}
    </div>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, state: BookingState): string | null {
  if (step === 0 && !state.category) return 'Please select a category'
  if (step === 1 && !state.serviceId) return 'Please select a service'
  if (step === 2) {
    if (!state.addressLine1.trim()) return 'Address is required'
    if (!state.addressCity.trim()) return 'City is required'
    if (!/^[0-9]{6}$/.test(state.addressPincode)) return 'Enter a valid 6-digit pincode'
    // Coverage is a hard stop: the platform cannot schedule a professional
    // outside the areas it serves, and the backend has no coverage check of its
    // own yet (documented gap), so this is the only guard against a booking it
    // could never fulfil.
    const coverage = checkCoverage({ city: state.addressCity, pincode: state.addressPincode })
    if (!coverage.supported) return coverage.reason ?? 'This address is outside our service area.'
  }
  if (step === 3) {
    if (!state.scheduledDate) return 'Please select a date'
    if (!state.timeSlotStart) return 'Please select a time slot'
  }
  if (step === 4 && !state.anyTechnician && !state.technicianId) return 'Please choose how the professional is assigned'
  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

function BookTechnicianInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()
  const { location } = useLocation()

  const [step, setStep] = useState(0)
  const [state, setState] = useState<BookingState>({ ...EMPTY, addressCity: '' })
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null)
  const [restored, setRestored] = useState(false)

  /**
   * Mirror of the newest state, written inside every updater.
   *
   * `useState` updates are asynchronous, so validating "the state after this
   * click" from the render closure is impossible. The ref is what lets a step
   * accept an answer *and* move on in a single click.
   */
  const stateRef = useRef(state)

  const commitState = useCallback((updater: (prev: BookingState) => BookingState) => {
    setState(prev => {
      const nextState = updater(prev)
      stateRef.current = nextState
      return nextState
    })
  }, [])

  /**
   * Restore an in-flight booking.
   *
   * Signing in mid-wizard used to throw the whole thing away, which is exactly
   * when a customer is most invested. The draft lives in sessionStorage (it
   * contains an address, so it never leaves the tab), and legacy avān keys are
   * migrated across once.
   */
  useEffect(() => {
    let draft: Partial<BookingState> | null = null
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY) ?? sessionStorage.getItem(LEGACY_DRAFT_KEY)
      if (raw) {
        draft = JSON.parse(raw) as Partial<BookingState>
        if (!sessionStorage.getItem(DRAFT_KEY)) {
          sessionStorage.setItem(DRAFT_KEY, raw)
          sessionStorage.removeItem(LEGACY_DRAFT_KEY)
        }
      }
    } catch {
      draft = null
    }

    const categoryParam = searchParams.get('category') ?? ''
    const category = CATEGORIES.find(item => item.id === categoryParam)
    const pincodeParam = searchParams.get('pincode') ?? ''
    const dateParam = searchParams.get('date') ?? ''

    setState(current => {
      // Restored answers first, then anything the URL explicitly carries.
      const merged: BookingState = { ...current, ...(draft ?? {}) }
      if (category) merged.category = category.id
      if (category) merged.categoryLabel = category.label
      if (/^[0-9]{6}$/.test(pincodeParam)) merged.addressPincode = pincodeParam
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam) && isWithinBookingWindow(dateParam, getNextDays(7))) {
        merged.scheduledDate = dateParam
      }
      if (!merged.addressCity) merged.addressCity = location.city
      // A restored service must still belong to the restored category.
      if (draft && !category && !draft.serviceId) merged.serviceId = ''
      stateRef.current = merged
      return merged
    })

    if (draft && (draft.category || draft.addressLine1 || draft.scheduledDate)) setRestored(true)
    // If a category is known up front, the category step is already answered.
    if (category || draft?.category) setStep(1)
    // Runs once on mount: query params and the stored draft are read directly
    // from the browser, not from React state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Mirror the wizard into sessionStorage so a sign-in round trip is lossless. */
  useEffect(() => {
    try {
      const { technician, ...persisted } = state
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...persisted, technician: technician ? { id: technician.id } : null }))
    } catch {
      /* storage disabled — the flow still works, it just cannot resume */
    }
  }, [state])

  const set = useCallback((update: Partial<BookingState>) => {
    commitState(prev => ({ ...prev, ...update }))
    setValidationError('')
  }, [commitState])

  function next() {
    const err = validateStep(step, stateRef.current)
    if (err) { setValidationError(err); return }
    setValidationError('')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * Answer a question and move on in one click.
   *
   * React state updates are asynchronous, so `set()` followed by `next()` would
   * validate the *previous* render — which is why picking a category or a
   * service used to need two clicks (the first one bounced with
   * "please select…"). This validates the merged answer instead.
   */
  function nextWith(patch: Partial<BookingState>) {
    const candidate = { ...stateRef.current, ...patch }
    const err = validateStep(step, candidate)
    if (err) { setValidationError(err); return }
    commitState(prev => ({ ...prev, ...patch }))
    setValidationError('')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prev() {
    setValidationError('')
    setStep(s => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!isAuthenticated) {
      // Return to the exact wizard URL, so the slot the customer picked is still
      // selected when they come back signed in.
      const returnTo = `/book/technician?${searchParams.toString()}`
      router.push(`/login?redirect=${encodeURIComponent(returnTo || '/book/technician')}`)
      return
    }
    const current = stateRef.current
    const err = validateStep(step, current)
    if (err) { setValidationError(err); return }

    setSubmitting(true)
    try {
      const booking = await technicianApi.createBooking({
        serviceId: current.serviceId,
        category: current.category,
        serviceDescription: current.problemDescription || undefined,
        technicianId: current.anyTechnician ? undefined : (current.technicianId || undefined),
        addressLine1: current.addressLine1,
        addressLine2: current.addressLine2 || undefined,
        addressCity: current.addressCity,
        addressState: current.addressState || undefined,
        addressPincode: current.addressPincode,
        addressLabel: current.addressLabel,
        scheduledDate: new Date(`${current.scheduledDate}T09:00:00`).toISOString(),
        timeSlotStart: current.timeSlotStart,
        timeSlotEnd: current.timeSlotEnd,
        paymentMethod: current.paymentMethod as TechnicianCategory extends never ? never : string,
        customerNotes: current.problemDescription || undefined,
      })
      setCreatedBooking({
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        scheduledDate: booking.scheduledDate,
        timeSlotStart: booking.timeSlotStart,
        timeSlotEnd: booking.timeSlotEnd,
        status: booking.status,
        hasTechnician: Boolean(booking.technicianId),
      })
      setSubmitted(true)
      try {
        sessionStorage.removeItem(DRAFT_KEY)
        sessionStorage.removeItem(LEGACY_DRAFT_KEY)
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      setValidationError((err as { error?: string })?.error ?? 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted && createdBooking) {
    return (
      <div className="mx-auto max-w-xl py-16 px-5">
        <SuccessScreen booking={createdBooking} />
      </div>
    )
  }

  const stepContent = [
    <StepCategory key={0} state={state} set={set} next={nextWith} />,
    <StepService key={1} state={state} set={set} next={nextWith} />,
    <StepLocation key={2} state={state} set={set} />,
    <StepDateTime key={3} state={state} set={set} />,
    <StepTechnician key={4} state={state} set={set} />,
    <StepProblem key={5} state={state} set={set} />,
    <StepPricing key={6} state={state} />,
    <StepPayment key={7} state={state} set={set} />,
    <StepConfirm key={8} state={state} />,
  ]

  return (
    <>
      {/* Wizard sub-header. The global navbar sits above this; this strip only
          carries flow context (back link + flow name) so the wizard still
          reads as a focused, single-purpose task. */}
      <div className="border-b border-border-subtle bg-muted/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/services" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>All services</span>
          </Link>
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-gold-text" aria-hidden="true" />
            <span className="font-serif text-lg text-foreground">Book a Home Service</span>
          </div>
          <span className="w-[6.5rem]" aria-hidden="true" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="uppercase tracking-[0.2em]">Step {step + 1} of {STEPS.length}</span>
            <span className="text-gold-text">{STEPS[step]}</span>
          </div>
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-[#d5ae79] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step dots for desktop */}
          <div className="mt-3 hidden justify-between sm:flex">
            {STEPS.map((s, i) => (
              <div key={s} className={`text-[9px] uppercase tracking-[0.1em] ${i <= step ? 'text-gold-text' : 'text-muted-foreground/80'}`}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {stepContent[step]}
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="mt-4 flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="size-4 flex-shrink-0" />
            {validationError}
          </div>
        )}

        {/* Navigation buttons — not shown for step 0 (category auto-advances) and step 1 (service auto-advances) */}
        {step > 1 && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button type="button" onClick={prev}
              className="flex items-center gap-2 border border-border px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:border-[#d5ae79]/50 hover:text-gold-text">
              <ArrowLeft className="size-4" /> Previous
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="group flex items-center gap-2 bg-[#d5ae79] px-8 py-3 text-[11px] uppercase tracking-[0.18em] text-[#17151d] transition hover:bg-[#e8cfa9]">
                Continue <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting || isLoading}
                className="group flex items-center gap-2 bg-[#d5ae79] px-8 py-3 text-[11px] uppercase tracking-[0.18em] text-[#17151d] transition hover:bg-[#e8cfa9] disabled:opacity-50">
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Booking…</> : <>Confirm Booking <Check className="size-4" /></>}
              </button>
            )}
          </div>
        )}

        {/* Login notice */}
        {step === STEPS.length - 1 && !isAuthenticated && (
          <div className="mt-4 border border-yellow-500/20 bg-yellow-500/8 px-4 py-3 text-center text-sm text-yellow-300/80">
            You&apos;ll be asked to{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(`/book/technician?${searchParams.toString()}`)}`}
              className="underline"
            >
              sign in
            </Link>{' '}
            before confirming — your answers are kept.
          </div>
        )}
      </div>

      <style>{`
        .input-field { width:100%; border:1px solid var(--border); background:var(--card); padding:.75rem 1rem; font-size:.875rem; color:var(--foreground); }
        .input-field::placeholder { color: var(--muted-foreground); }
        .input-field:focus { outline: none; border-color: var(--ring); }
      `}</style>
    </>
  )
}

/**
 * Reads the query string via `useSearchParams()`, so it must render inside a
 * Suspense boundary to stay statically prerenderable.
 *
 * SiteShell is mounted *outside* the boundary so the navbar still ships with
 * the server-rendered HTML — only the wizard body waits on the client.
 */
export default function BookTechnicianPage() {
  return (
    <SiteShell hideFooter>
      <SearchParamsBoundary>
        <BookTechnicianInner />
      </SearchParamsBoundary>
    </SiteShell>
  )
}
