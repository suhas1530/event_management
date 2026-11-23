'use client'

import { useCallback, useEffect, useId, useRef, useState, cloneElement, isValidElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { technicianApi } from '@/lib/api'
import type { TechnicianServiceItem } from '@/lib/api'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Bug,
  Check,
  CheckCircle2,
  Clock,
  Droplet,
  Droplets,
  Flower2,
  Hammer,
  Home,
  Info,
  Layers,
  Laptop,
  Loader2,
  MapPin,
  Paintbrush2,
  Scissors,
  Shield,
  Sparkles,
  WashingMachine,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import SiteShell from '@/components/layout/SiteShell'
import { BOOKABLE_HOME_GROUPS, VISIT_CHARGE, GST_RATE, estimateHomeServiceTotal } from '@/lib/catalog'
import { homeServicePhoto } from '@/lib/home-service-images'
import { checkCoverage, SUPPORTED_CITY } from '@/lib/service-area'

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

const CATEGORIES = [
  ...BOOKABLE_HOME_GROUPS.map(group => ({
    id: group.bookingCategory as string,
    label: group.name,
    desc: group.blurb,
    icon: CATEGORY_ICONS[group.icon] ?? Wrench,
  })),
  { id: 'OTHER', label: 'Something else', desc: 'Any other home repair or installation job', icon: Wrench },
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
  { id: 'CASH', label: 'Cash after service', desc: 'Pay the professional once the work is done', icon: '💵' },
  { id: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe or Paytm', icon: '📱' },
  { id: 'CARD', label: 'Card', desc: 'Debit or credit card', icon: '💳' },
  { id: 'ONLINE', label: 'Online payment', desc: 'Net banking or wallets', icon: '🌐' },
]

const DRAFT_KEY = 'heptome_technician_booking_draft'
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
  problemDescription: string
  paymentMethod: string
}

const EMPTY: BookingState = {
  category: '',
  categoryLabel: '',
  serviceId: '',
  service: null,
  addressLine1: '',
  addressLine2: '',
  addressCity: SUPPORTED_CITY,
  addressState: 'Karnataka',
  addressPincode: '',
  addressLabel: 'Home',
  scheduledDate: '',
  timeSlotStart: '',
  timeSlotEnd: '',
  timeSlotLabel: '',
  problemDescription: '',
  paymentMethod: 'CASH',
}

function fmt(value: number) {
  return '₹' + value.toLocaleString('en-IN')
}

/** Home visits are scheduled against the platform's operating timezone. */
const IST_TIME_ZONE = 'Asia/Kolkata'

function istDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function istMinutes(value: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const hour = Number(parts.find(item => item.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find(item => item.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

function getNextDays(count = 7) {
  const days = []
  const todayKey = istDateKey(new Date())
  const todayNoon = new Date(`${todayKey}T12:00:00+05:30`)
  for (let index = 0; index < count; index += 1) {
    const date = new Date(todayNoon.getTime() + index * 24 * 60 * 60 * 1000)
    days.push({
      value: istDateKey(date),
      label:
        index === 0
          ? 'Today'
          : index === 1
            ? 'Tomorrow'
            : date.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: IST_TIME_ZONE,
              }),
    })
  }
  return days
}

function isWithinBookingWindow(value: string, days: { value: string }[]) {
  return days.some(day => day.value === value)
}

function hasSlotStarted(date: string, start: string, todayKey: string) {
  if (date !== todayKey) return false
  const [hour, minute] = start.split(':').map(Number)
  return hour * 60 + minute <= istMinutes(new Date())
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const generatedId = useId()
  const childId = isValidElement(children)
    ? ((children.props as { id?: string }).id ?? generatedId)
    : generatedId
  const field = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ id?: string }>, { id: childId })
    : children

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={childId} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {hint ? <span className="sr-only"> — {hint}</span> : null}
      </label>
      {field}
    </div>
  )
}

function SectionHeading({
  id,
  number,
  title,
  description,
}: {
  id: string
  number: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center border border-gold/40 text-[10px] text-gold-text">
        {number}
      </span>
      <div>
        <h2 id={id} className="font-serif text-2xl text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}

function PriceBreakdown({ service }: { service: TechnicianServiceItem | null }) {
  if (!service) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Choose a service to see the estimate. The visit charge and GST are shown before you send the request.
      </p>
    )
  }

  const estimate = estimateHomeServiceTotal(service.basePrice)

  return (
    <div className="divide-y divide-border-subtle">
      <div className="flex justify-between py-2.5 text-sm text-muted-foreground">
        <span>{service.name}</span>
        <span className="text-foreground/90">{fmt(service.basePrice)}</span>
      </div>
      <div className="flex justify-between py-2.5 text-sm text-muted-foreground">
        <span>Visit charge</span>
        <span className="text-foreground/90">{fmt(VISIT_CHARGE)}</span>
      </div>
      <div className="flex justify-between py-2.5 text-xs text-muted-foreground">
        <span>Subtotal</span>
        <span>{fmt(estimate.subtotal)}</span>
      </div>
      <div className="flex justify-between py-2.5 text-xs text-muted-foreground">
        <span>GST ({Math.round(GST_RATE * 100)}%)</span>
        <span>{fmt(estimate.tax)}</span>
      </div>
      <div className="flex justify-between py-3 text-base font-medium text-foreground">
        <span>Indicative total</span>
        <span className="text-gold-text">{fmt(estimate.total)}</span>
      </div>
    </div>
  )
}

interface CreatedBooking {
  bookingNumber: string
  totalAmount: number
  scheduledDate: string
  timeSlotStart: string
  timeSlotEnd: string
  status: string
  hasTechnician: boolean
}

function SuccessScreen({ booking }: { booking: CreatedBooking }) {
  const router = useRouter()
  const assigned =
    booking.hasTechnician ||
    booking.status === 'TECHNICIAN_ASSIGNED' ||
    booking.status === 'CONFIRMED'

  const statusCopy: Record<string, string> = {
    PENDING: 'Heptome has received your request and will allocate a verified professional for this slot.',
    CONFIRMED: 'Your booking is confirmed for the slot below.',
    TECHNICIAN_ASSIGNED: 'A professional has been assigned to your booking.',
    TECHNICIAN_CONFIRMED: 'Your professional has confirmed the slot below.',
  }

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-6 flex size-20 items-center justify-center bg-gold/15 text-gold-text">
        <CheckCircle2 className="size-10" aria-hidden="true" />
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">
        {assigned ? 'Booking confirmed' : 'Request received'}
      </p>
      <h1 className="font-serif text-4xl text-foreground">{assigned ? "You're all set!" : 'Slot requested'}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {statusCopy[booking.status] ??
          'Your request is recorded and the team will follow up with the next step.'}
        {!assigned ? ' You can follow the status from your dashboard.' : ''}
      </p>

      <div className="mt-8 w-full max-w-sm border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Request number</p>
          <p className="mt-1 break-all font-mono text-lg font-medium text-gold-text">{booking.bookingNumber}</p>
        </div>
        <div className="px-5 py-4 text-sm text-muted-foreground">
          <p className="flex justify-between gap-4">
            <span>Date</span>
            <span className="text-right text-foreground">
              {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: IST_TIME_ZONE,
              })}
            </span>
          </p>
          <p className="mt-2 flex justify-between gap-4">
            <span>Time</span>
            <span className="text-right text-foreground">
              {booking.timeSlotStart} – {booking.timeSlotEnd}
            </span>
          </p>
          <p className="mt-2 flex justify-between gap-4">
            <span>Indicative total</span>
            <span className="text-gold-text">{fmt(booking.totalAmount)}</span>
          </p>
          <p className="mt-2 flex justify-between gap-4">
            <span>Status</span>
            <span className="text-right text-foreground">
              {booking.status.replaceAll('_', ' ').toLowerCase()}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-5 max-w-sm text-xs leading-5 text-muted-foreground">
        No payment has been taken. The final amount is agreed with the professional before work begins and
        settled after it is completed.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard?tab=home')}
          className="flex items-center gap-2 bg-gold px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-gold-foreground hover:bg-gold-soft"
        >
          Track request <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 border border-border px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:border-gold hover:text-gold-text"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}

function BookTechnicianInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  const [step, setStep] = useState(0)
  const [state, setState] = useState<BookingState>(EMPTY)
  const [services, setServices] = useState<TechnicianServiceItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesFailure, setServicesFailure] = useState<'empty' | 'error' | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [restored, setRestored] = useState(false)

  const stateRef = useRef(state)
  const submitLock = useRef(false)

  const commitState = useCallback((updater: (previous: BookingState) => BookingState) => {
    setState(previous => {
      const next = updater(previous)
      stateRef.current = next
      return next
    })
  }, [])

  const update = useCallback(
    (patch: Partial<BookingState>) => {
      commitState(previous => ({ ...previous, ...patch }))
      setError('')
    },
    [commitState],
  )

  /* Restore a draft and apply deep links once, on mount. */
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

    const merged: BookingState = { ...EMPTY, ...(draft ?? {}) }

    if (category) {
      if (merged.category !== category.id) {
        merged.serviceId = ''
        merged.service = null
      }
      merged.category = category.id
      merged.categoryLabel = category.label
    }
    if (/^[0-9]{6}$/.test(pincodeParam)) merged.addressPincode = pincodeParam
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam) && isWithinBookingWindow(dateParam, getNextDays(7))) {
      merged.scheduledDate = dateParam
    }
    if (!merged.addressCity) merged.addressCity = SUPPORTED_CITY
    if (!merged.addressState) merged.addressState = 'Karnataka'
    // A restored service must still belong to the restored category.
    if (!merged.serviceId) merged.service = null

    setState(merged)
    stateRef.current = merged
    if (draft && (draft.category || draft.addressLine1 || draft.scheduledDate)) setRestored(true)

    const readyForReview = Boolean(
      merged.category &&
        merged.serviceId &&
        merged.addressLine1.trim() &&
        merged.addressPincode &&
        merged.scheduledDate &&
        merged.timeSlotStart,
    )
    if (readyForReview) setStep(1)
    // Reads browser storage and the query string once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Keep the draft in sessionStorage so signing in never loses the answers. */
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state))
    } catch {
      /* Storage disabled: the flow still works, it just cannot resume. */
    }
  }, [state])

  /* Load the live catalogue for the selected category. */
  useEffect(() => {
    if (!state.category) {
      setServices([])
      setServicesFailure(null)
      return
    }
    let cancelled = false
    setServicesLoading(true)
    setServicesFailure(null)
    technicianApi
      .servicesByCategory(state.category)
      .then(list => {
        if (cancelled) return
        const active = list.filter(service => service.isActive !== false)
        setServices(active)
        setServicesFailure(active.length === 0 ? 'empty' : null)
        // Reconcile the selected service with the server catalogue, so a
        // restored draft can never keep a stale or withdrawn price.
        setState(previous => {
          if (!previous.serviceId) return previous
          const fresh = active.find(service => service.id === previous.serviceId)
          const next = { ...previous, service: fresh ?? null, serviceId: fresh ? previous.serviceId : '' }
          stateRef.current = next
          return next
        })
      })
      .catch(() => {
        if (cancelled) return
        setServices([])
        setServicesFailure('error')
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [state.category])

  function chooseCategory(category: (typeof CATEGORIES)[number]) {
    update({
      category: category.id,
      categoryLabel: category.label,
      serviceId: '',
      service: null,
    })
  }

  function chooseService(service: TechnicianServiceItem) {
    update({ serviceId: service.id, service })
  }

  function validateDetails(current: BookingState): string | null {
    if (!current.category) return 'Choose a service category.'
    if (!current.serviceId || !current.service) return 'Choose the service you need.'
    if (current.addressLine1.trim().length < 5) return 'Enter the first line of your address.'
    if (!current.addressCity.trim()) return 'Enter your city.'
    if (!/^[0-9]{6}$/.test(current.addressPincode)) return 'Enter a valid 6-digit pincode.'
    const coverage = checkCoverage({
      city: current.addressCity,
      pincode: current.addressPincode,
    })
    if (!coverage.supported) {
      return coverage.reason ?? 'This address is outside the doorstep-service area.'
    }
    if (!current.scheduledDate) return 'Choose a visit date.'
    if (!isWithinBookingWindow(current.scheduledDate, getNextDays(7))) {
      return 'Choose a date within the next seven days.'
    }
    if (!current.timeSlotStart) return 'Choose an arrival window.'
    const todayKey = getNextDays(7)[0]?.value ?? ''
    if (hasSlotStarted(current.scheduledDate, current.timeSlotStart, todayKey)) {
      return 'That arrival window has already started. Choose a later window.'
    }
    return null
  }

  function goToReview() {
    const message = validateDetails(stateRef.current)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setError('')
    setStep(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitRequest() {
    if (submitLock.current || createdBooking) return
    const current = stateRef.current
    const message = validateDetails(current)
    if (message) {
      setError(message)
      setStep(0)
      return
    }
    if (!accepted) {
      setError('Please confirm that you understand this is a booking request.')
      return
    }
    if (!isAuthenticated) {
      // The draft is already in sessionStorage. Returning to the bare route is
      // enough because the wizard resumes on the review screen.
      router.push(`/login?redirect=${encodeURIComponent('/book/technician')}`)
      return
    }

    submitLock.current = true
    setSubmitting(true)
    setError('')
    try {
      const booking = await technicianApi.createBooking({
        serviceId: current.serviceId,
        category: current.category,
        serviceDescription: current.problemDescription || undefined,
        addressLine1: current.addressLine1.trim(),
        addressLine2: current.addressLine2.trim() || undefined,
        addressCity: current.addressCity.trim(),
        addressState: current.addressState.trim() || undefined,
        addressPincode: current.addressPincode,
        addressLabel: current.addressLabel,
        scheduledDate: new Date(`${current.scheduledDate}T09:00:00+05:30`).toISOString(),
        timeSlotStart: current.timeSlotStart,
        timeSlotEnd: current.timeSlotEnd,
        paymentMethod: current.paymentMethod,
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
      try {
        sessionStorage.removeItem(DRAFT_KEY)
        sessionStorage.removeItem(LEGACY_DRAFT_KEY)
      } catch {
        /* ignore */
      }
    } catch (caught) {
      setError((caught as { error?: string })?.error ?? 'Booking failed. Please try again.')
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (createdBooking) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <SuccessScreen booking={createdBooking} />
      </div>
    )
  }

  const days = getNextDays(7)
  const todayKey = days[0]?.value ?? ''
  const coverage = /^[0-9]{6}$/.test(state.addressPincode)
    ? checkCoverage({ city: state.addressCity, pincode: state.addressPincode })
    : null
  const selectedDateLabel = days.find(day => day.value === state.scheduledDate)?.label
  const selectedPayment = PAYMENT_METHODS.find(method => method.id === state.paymentMethod)
  const selectedGroup = BOOKABLE_HOME_GROUPS.find(group => group.bookingCategory === state.category)
  const bannerPhoto = selectedGroup ? homeServicePhoto(selectedGroup.id) : null

  return (
    <>
      <div className="border-b border-border-subtle bg-muted/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Link
            href="/services"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>All services</span>
          </Link>
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-gold-text" aria-hidden="true" />
            <h1 className="font-serif text-lg text-foreground">Book a home service</h1>
          </div>
          <span className="hidden w-[6.5rem] sm:block" aria-hidden="true" />
        </div>
      </div>

      {bannerPhoto && selectedGroup && (
        <div className="relative h-36 overflow-hidden bg-muted sm:h-44">
          <Image
            src={bannerPhoto.src}
            alt={bannerPhoto.alt}
            fill
            loading="eager"
            sizes="100vw"
            className="object-cover object-center"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0b0f0d]/85 via-[#0b0f0d]/45 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center px-5 text-white">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold-soft">Your service</p>
            <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">{selectedGroup.name}</p>
            <Link
              href={`/home-services/${selectedGroup.id}`}
              className="mt-1 inline-flex w-fit items-center gap-1 text-xs text-white/80 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              View service details
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="uppercase tracking-[0.2em]">Step {step + 1} of 2</span>
            <span className="text-gold-text">{step === 0 ? 'Service & schedule' : 'Review & confirm'}</span>
          </div>
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gold transition-all duration-500"
              style={{ width: step === 0 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {restored && step === 0 ? (
          <p className="mb-5 border border-gold/25 bg-gold/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            We restored the answers saved in this tab. Check them before continuing.
          </p>
        ) : null}

        {step === 0 ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <section aria-labelledby="service-heading">
                <SectionHeading
                  id="service-heading"
                  number="01"
                  title="What do you need?"
                  description={`Doorstep services currently run in ${SUPPORTED_CITY}. Choose a category, then the exact service.`}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  {CATEGORIES.map(category => {
                    const Icon = category.icon
                    const active = state.category === category.id
                    return (
                      <button
                        type="button"
                        key={category.id}
                        aria-pressed={active}
                        onClick={() => chooseCategory(category)}
                        className={`flex items-start gap-3 border p-3.5 text-left transition ${
                          active
                            ? 'border-gold bg-gold/10'
                            : 'border-border bg-card hover:border-gold/40'
                        }`}
                      >
                        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-muted/60 text-gold-text">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">{category.label}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                            {category.desc}
                          </span>
                        </span>
                        {active ? <Check className="ml-auto mt-1 size-4 flex-shrink-0 text-gold-text" /> : null}
                      </button>
                    )
                  })}
                </div>

                {state.category ? (
                  <div className="mt-5">
                    <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {state.categoryLabel} services
                    </p>
                    {servicesLoading ? (
                      <div className="flex justify-center border border-border bg-card py-10">
                        <Loader2 className="size-6 animate-spin text-gold-text" aria-label="Loading services" />
                      </div>
                    ) : services.length === 0 ? (
                      <div className="border border-border bg-card p-6 text-center">
                        <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-foreground/90">
                          {servicesFailure === 'error'
                            ? 'We could not load services for this category right now.'
                            : 'This category has no bookable services listed yet.'}
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                          Check another category, or send the details to the team and we will arrange the visit
                          with a professional directly.
                        </p>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                          <Link
                            href="/contact"
                            className="border border-gold px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-gold-text transition hover:bg-gold hover:text-gold-foreground"
                          >
                            Ask the team
                          </Link>
                          <Link
                            href="/services"
                            className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
                          >
                            Browse other categories
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {services.map(service => {
                          const active = state.serviceId === service.id
                          return (
                            <button
                              type="button"
                              key={service.id}
                              aria-pressed={active}
                              onClick={() => chooseService(service)}
                              className={`flex items-center gap-4 border p-4 text-left transition ${
                                active
                                  ? 'border-gold bg-gold/10'
                                  : 'border-border bg-card hover:border-gold/40'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                                  {service.isPopular ? (
                                    <span className="bg-gold/15 px-1.5 py-0.5 text-[9px] text-gold-text">
                                      Popular
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                                  {service.description}
                                </span>
                                {service.estimatedDuration ? (
                                  <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="size-3" aria-hidden="true" /> About{' '}
                                    {service.estimatedDuration} minutes
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-right">
                                <span className="block text-sm font-medium text-gold-text">
                                  {service.pricingType === 'CUSTOM_QUOTE'
                                    ? 'Get quote'
                                    : fmt(service.basePrice)}
                                </span>
                                {service.pricingType !== 'CUSTOM_QUOTE' ? (
                                  <span className="block text-[10px] text-muted-foreground">from</span>
                                ) : null}
                              </span>
                              {active ? (
                                <Check className="size-4 flex-shrink-0 text-gold-text" aria-hidden="true" />
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </section>

              <section aria-labelledby="location-heading" className="mt-10">
                <SectionHeading
                  id="location-heading"
                  number="02"
                  title="Where should we come?"
                  description="Your pincode is checked before a slot can be requested."
                />
                <div className="mb-4 flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'Home', icon: Home, label: 'Home' },
                      { id: 'Work', icon: Briefcase, label: 'Work' },
                      { id: 'Other', icon: MapPin, label: 'Other' },
                    ] as const
                  ).map(({ id, icon: Icon, label }) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={state.addressLabel === id}
                      onClick={() => update({ addressLabel: id })}
                      className={`flex items-center gap-2 border px-4 py-2.5 text-sm transition ${
                        state.addressLabel === id
                          ? 'border-gold bg-gold/10 text-gold-text'
                          : 'border-border text-muted-foreground hover:border-gold/40'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" /> {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <FormField label="Address line 1 *" hint="House or flat number, building and street">
                    <input
                      value={state.addressLine1}
                      onChange={event => update({ addressLine1: event.target.value })}
                      placeholder="e.g. 42, Sunshine Apartments, MG Road"
                      autoComplete="address-line1"
                      className="input-base"
                    />
                  </FormField>
                  <FormField label="Address line 2" hint="Area or landmark, optional">
                    <input
                      value={state.addressLine2}
                      onChange={event => update({ addressLine2: event.target.value })}
                      placeholder="Area, locality or landmark (optional)"
                      autoComplete="address-line2"
                      className="input-base"
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="City *">
                      <input
                        value={state.addressCity}
                        onChange={event => update({ addressCity: event.target.value })}
                        placeholder={SUPPORTED_CITY}
                        autoComplete="address-level2"
                        className="input-base"
                      />
                    </FormField>
                    <FormField label="State">
                      <input
                        value={state.addressState}
                        onChange={event => update({ addressState: event.target.value })}
                        placeholder="Karnataka"
                        autoComplete="address-level1"
                        className="input-base"
                      />
                    </FormField>
                    <FormField label="Pincode *">
                      <input
                        value={state.addressPincode}
                        onChange={event =>
                          update({ addressPincode: event.target.value.replace(/\D/g, '').slice(0, 6) })
                        }
                        placeholder="560034"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        className="input-base"
                      />
                    </FormField>
                  </div>
                </div>

                {coverage ? (
                  <div
                    aria-live="polite"
                    className={`mt-4 flex items-start gap-3 border p-4 text-sm ${
                      coverage.supported
                        ? 'border-success/30 bg-success-muted text-success'
                        : 'border-warning/25 bg-warning-muted text-warning'
                    }`}
                  >
                    {coverage.supported ? (
                      <Check className="mt-0.5 size-4 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="mt-0.5 size-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="leading-6">
                      {coverage.supported
                        ? `Covered — ${coverage.area?.name}. We can schedule a professional here.`
                        : coverage.reason}
                    </span>
                  </div>
                ) : null}
              </section>

              <section aria-labelledby="schedule-heading" className="mt-10">
                <SectionHeading
                  id="schedule-heading"
                  number="03"
                  title="When do you need it?"
                  description="Choose a two-hour arrival window. The professional confirms the exact arrival time."
                />
                <div className="mb-6">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Visit date</p>
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                      <button
                        type="button"
                        key={day.value}
                        aria-pressed={state.scheduledDate === day.value}
                        onClick={() => update({ scheduledDate: day.value })}
                        className={`border px-4 py-3 text-sm transition ${
                          state.scheduledDate === day.value
                            ? 'border-gold bg-gold/10 text-gold-text'
                            : 'border-border text-muted-foreground hover:border-gold/40'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Arrival window
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TIME_SLOTS.map(slot => {
                      const past = hasSlotStarted(state.scheduledDate, slot.start, todayKey)
                      const active = state.timeSlotStart === slot.start
                      return (
                        <button
                          type="button"
                          key={slot.start}
                          aria-pressed={active}
                          disabled={past}
                          onClick={() =>
                            update({
                              timeSlotStart: slot.start,
                              timeSlotEnd: slot.end,
                              timeSlotLabel: slot.label,
                            })
                          }
                          className={`flex items-center gap-2 border px-4 py-3.5 text-sm transition ${
                            active
                              ? 'border-gold bg-gold/10 text-gold-text'
                              : 'border-border text-muted-foreground hover:border-gold/40'
                          } ${past ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          <Clock className="size-4 flex-shrink-0" aria-hidden="true" />
                          {slot.label}
                          {past ? <span className="ml-auto text-[10px] uppercase tracking-[0.14em]">Passed</span> : null}
                        </button>
                      )
                    })}
                  </div>
                  {state.scheduledDate === todayKey ? (
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      Arrival windows that have already started are unavailable today. Choose a later
                      window or another date.
                    </p>
                  ) : null}
                </div>
              </section>

              <section aria-labelledby="notes-heading" className="mt-10">
                <SectionHeading
                  id="notes-heading"
                  number="04"
                  title="Anything the professional should know?"
                  description="Optional. Describe the problem so the right tools and parts are brought along."
                />
                <FormField label="Problem description">
                  <textarea
                    value={state.problemDescription}
                    onChange={event => update({ problemDescription: event.target.value })}
                    rows={4}
                    maxLength={1000}
                    placeholder="e.g. The kitchen sink has been leaking from under the basin for two days."
                    className="input-base resize-none leading-6"
                  />
                </FormField>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Photos are not uploaded by this form. The professional inspects the issue on arrival and agrees
                  any material cost with you before starting.
                </p>
              </section>
            </div>

            <div className="border border-border bg-card p-5 lg:sticky lg:top-24">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Estimate</p>
              <div className="mt-2">
                <PriceBreakdown service={state.service} />
              </div>
              <p className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <Info className="mt-0.5 size-3.5 flex-shrink-0" aria-hidden="true" />
                This is an indicative total, not a charge. Materials and extra labour are agreed with you before
                work begins.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <h2 className="font-serif text-3xl text-foreground">Review your request</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Check the details below. Sending this records a request — the slot is confirmed only after
                Heptome allocates a verified professional.
              </p>

              <div className="mt-6 divide-y divide-border-subtle border border-border bg-card">
                <SummaryRow
                  label="Service"
                  value={state.service?.name ?? state.categoryLabel}
                  onEdit={goBack}
                />
                <SummaryRow
                  label="Date"
                  value={
                    state.scheduledDate
                      ? new Date(`${state.scheduledDate}T12:00:00+05:30`).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          timeZone: IST_TIME_ZONE,
                        })
                      : 'Not selected'
                  }
                  onEdit={goBack}
                />
                <SummaryRow label="Arrival window" value={state.timeSlotLabel || 'Not selected'} onEdit={goBack} />
                <SummaryRow
                  label="Address"
                  value={[
                    state.addressLine1,
                    state.addressLine2,
                    state.addressCity,
                    state.addressState,
                    state.addressPincode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  onEdit={goBack}
                />
                <SummaryRow
                  label="Payment preference"
                  value={selectedPayment?.label ?? state.paymentMethod}
                  onEdit={goBack}
                />
              </div>

              {state.problemDescription ? (
                <div className="mt-4 border border-border bg-card p-4">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Your description
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">{state.problemDescription}</p>
                </div>
              ) : null}

              <section className="mt-8" aria-labelledby="payment-heading">
                <h3 id="payment-heading" className="font-serif text-2xl text-foreground">
                  How would you like to pay?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nothing is charged now. This is only your preference for settling the bill after the work.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {PAYMENT_METHODS.map(method => {
                    const active = state.paymentMethod === method.id
                    return (
                      <button
                        type="button"
                        key={method.id}
                        aria-pressed={active}
                        onClick={() => update({ paymentMethod: method.id })}
                        className={`flex items-center gap-3 border p-4 text-left transition ${
                          active
                            ? 'border-gold bg-gold/10'
                            : 'border-border bg-card hover:border-gold/40'
                        }`}
                      >
                        <span className="text-xl" aria-hidden="true">
                          {method.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground">{method.label}</span>
                          <span className="block text-xs text-muted-foreground">{method.desc}</span>
                        </span>
                        {active ? <Check className="size-4 text-gold-text" aria-hidden="true" /> : null}
                      </button>
                    )
                  })}
                </div>
              </section>

              <label className="mt-7 flex cursor-pointer items-start gap-3 border border-gold/25 bg-gold/5 p-4">
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
                  I understand this is a <strong className="font-medium text-foreground">booking request</strong>,
                  not a confirmed appointment. Heptome will allocate a professional and the booking is confirmed
                  only after the slot is accepted.
                </span>
              </label>

              {!isAuthenticated ? (
                <p className="mt-4 border border-warning/20 bg-warning-muted px-4 py-3 text-sm leading-6 text-warning">
                  You will be asked to{' '}
                  <Link href="/login?redirect=%2Fbook%2Ftechnician" className="underline">
                    sign in
                  </Link>{' '}
                  before the request is sent. Your answers stay saved in this tab.
                </p>
              ) : null}
            </div>

            <div className="border border-border bg-card p-5 lg:sticky lg:top-24">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your estimate</p>
              <div className="mt-2">
                <PriceBreakdown service={state.service} />
              </div>
              <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                The final amount may change if materials or extra labour are needed. The professional must get
                your approval before adding them.
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step === 0 ? (
            <Link
              href="/home-services"
              className="flex min-h-12 items-center justify-center gap-2 border border-border px-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:border-gold/50 hover:text-gold-text sm:justify-start"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to home services
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="flex min-h-12 items-center justify-center gap-2 border border-border px-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:border-gold/50 hover:text-gold-text sm:justify-start"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Edit details
            </button>
          )}

          {step === 0 ? (
            <button
              type="button"
              onClick={goToReview}
              className="group flex min-h-12 items-center justify-center gap-2 bg-gold px-8 text-[11px] uppercase tracking-[0.18em] text-gold-foreground transition hover:bg-gold-soft"
            >
              Review request <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitRequest}
              disabled={submitting || isLoading}
              className="flex min-h-12 items-center justify-center gap-2 bg-gold px-8 text-[11px] uppercase tracking-[0.18em] text-gold-foreground transition hover:bg-gold-soft disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…
                </>
              ) : (
                <>
                  Send booking request <Check className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </>
  )
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm leading-6 text-foreground/90">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
        className="flex-shrink-0 text-xs text-gold-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Edit
      </button>
    </div>
  )
}

export default function BookTechnicianPage() {
  return (
    <SiteShell hideFooter>
      <SearchParamsBoundary>
        <BookTechnicianInner />
      </SearchParamsBoundary>
    </SiteShell>
  )
}
