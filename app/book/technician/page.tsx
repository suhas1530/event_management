'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { technicianApi } from '@/lib/api'
import type { TechnicianServiceItem, Technician } from '@/lib/api'
import {
  ArrowLeft, ArrowRight, Check, Loader2, Wrench, Zap, Droplets, Wind,
  Hammer, Paintbrush2, Tv2, Shield, Sparkles, MapPin, CalendarDays,
  Clock, User, Camera, Star, Phone, ChevronRight, AlertCircle,
  CreditCard, CheckCircle2, Home, Briefcase
} from 'lucide-react'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import SiteShell from '@/components/layout/SiteShell'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'PLUMBING', label: 'Plumbing', icon: Droplets, color: 'text-blue-400', desc: 'Tap repair, pipe leakage, bathroom, water tank' },
  { id: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: 'text-yellow-400', desc: 'Switch/socket, fan, lighting, wiring, MCB' },
  { id: 'AC_SERVICE', label: 'AC Service', icon: Wind, color: 'text-cyan-400', desc: 'Servicing, installation, repair, gas refill' },
  { id: 'APPLIANCE_REPAIR', label: 'Appliance Repair', icon: Tv2, color: 'text-green-400', desc: 'Washing machine, fridge, microwave, geyser' },
  { id: 'CARPENTRY', label: 'Carpentry', icon: Hammer, color: 'text-orange-400', desc: 'Furniture, doors, windows, wardrobes' },
  { id: 'PAINTING', label: 'Painting', icon: Paintbrush2, color: 'text-purple-400', desc: 'Interior, exterior, texture, waterproofing' },
  { id: 'CLEANING', label: 'Cleaning', icon: Sparkles, color: 'text-pink-400', desc: 'Deep cleaning, sofa, carpet, bathroom' },
  { id: 'CCTV_INSTALLATION', label: 'CCTV Install', icon: Shield, color: 'text-red-400', desc: 'CCTV cameras, DVR setup, maintenance' },
  { id: 'COMPUTER_REPAIR', label: 'Computer Repair', icon: Tv2, color: 'text-indigo-400', desc: 'Laptop, desktop, printer, networking' },
  { id: 'PEST_CONTROL', label: 'Pest Control', icon: Shield, color: 'text-emerald-400', desc: 'Cockroach, termite, rodent, bed bugs' },
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

function getNextDays(count = 7) {
  const days = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    })
  }
  return days
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepCategory({ state, set, next }: { state: BookingState; set: (u: Partial<BookingState>) => void; next: () => void }) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">What do you need help with?</h2>
      <p className="mb-8 text-sm text-white/50">Choose a service category</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const active = state.category === cat.id
          return (
            <button type="button" key={cat.id}
              onClick={() => { set({ category: cat.id, categoryLabel: cat.label }); next() }}
              className={`flex items-start gap-4 border p-5 text-left transition ${active ? 'border-[#d7b98b] bg-[#d7b98b]/8' : 'border-white/12 bg-[#111114] hover:border-[#d7b98b]/40'}`}>
              <div className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-white/5 ${cat.color}`}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{cat.label}</p>
                <p className="mt-0.5 text-xs text-white/40">{cat.desc}</p>
              </div>
              {active && <Check className="ml-auto mt-1 size-4 flex-shrink-0 text-[#d7b98b]" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepService({ state, set, next, prev }: { state: BookingState; set: (u: Partial<BookingState>) => void; next: () => void; prev: () => void }) {
  const [services, setServices] = useState<TechnicianServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!state.category) return
    technicianApi.servicesByCategory(state.category)
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [state.category])

  // Fallback static services when backend has none
  const fallbackServices: TechnicianServiceItem[] = [
    { id: 'f1', technicianId: '', name: 'Tap Repair', slug: 'tap-repair', description: 'Fix dripping or broken taps', category: state.category as any, basePrice: 299, pricingType: 'FIXED', estimatedDuration: 60, images: [], isActive: true, isPopular: true, tags: [] },
    { id: 'f2', technicianId: '', name: 'Pipe Leakage', slug: 'pipe-leakage', description: 'Fix leaking pipes and joints', category: state.category as any, basePrice: 399, pricingType: 'FIXED', estimatedDuration: 90, images: [], isActive: true, isPopular: false, tags: [] },
    { id: 'f3', technicianId: '', name: 'Bathroom Plumbing', slug: 'bathroom-plumbing', description: 'Complete bathroom plumbing service', category: state.category as any, basePrice: 599, pricingType: 'FIXED', estimatedDuration: 120, images: [], isActive: true, isPopular: true, tags: [] },
    { id: 'f4', technicianId: '', name: 'Water Tank Cleaning', slug: 'water-tank', description: 'Water tank cleaning & repair', category: state.category as any, basePrice: 799, pricingType: 'FIXED', estimatedDuration: 180, images: [], isActive: true, isPopular: false, tags: [] },
    { id: 'f5', technicianId: '', name: 'New Installation', slug: 'installation', description: 'New tap, shower or pipe installation', category: state.category as any, basePrice: 499, pricingType: 'FIXED', estimatedDuration: 90, images: [], isActive: true, isPopular: false, tags: [] },
    { id: 'f6', technicianId: '', name: 'Other Work', slug: 'other', description: 'Any other plumbing work', category: state.category as any, basePrice: 299, pricingType: 'CUSTOM_QUOTE', images: [], isActive: true, isPopular: false, tags: [] },
  ]

  const displayServices = services.length > 0 ? services : (loading ? [] : fallbackServices)

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">Select the service</h2>
      <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-[#d7b98b]">{state.categoryLabel}</p>
      <p className="mb-8 text-sm text-white/50">What exactly do you need?</p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-7 animate-spin text-[#d7b98b]" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayServices.map(svc => {
            const active = state.serviceId === svc.id
            return (
              <button type="button" key={svc.id}
                onClick={() => { set({ serviceId: svc.id, service: svc }); next() }}
                className={`flex items-center gap-4 border p-4 text-left transition ${active ? 'border-[#d7b98b] bg-[#d7b98b]/8' : 'border-white/12 bg-[#111114] hover:border-[#d7b98b]/40'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{svc.name}</p>
                    {svc.isPopular && <span className="bg-[#d7b98b]/15 px-1.5 py-0.5 text-[9px] text-[#d7b98b]">Popular</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-white/40">{svc.description}</p>
                  {svc.estimatedDuration && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-white/30">
                      <Clock className="size-3" /> Est. {svc.estimatedDuration} mins
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#d7b98b]">
                    {svc.pricingType === 'CUSTOM_QUOTE' ? 'Get quote' : fmt(svc.basePrice)}
                  </p>
                  {svc.pricingType !== 'CUSTOM_QUOTE' && <p className="text-[10px] text-white/30">starting from</p>}
                </div>
                <ChevronRight className="size-4 flex-shrink-0 text-white/30" />
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
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">Service location</h2>
      <p className="mb-8 text-sm text-white/50">Where should the technician come?</p>

      <div className="mb-6 flex gap-3">
        {addressTypes.map(({ id, icon: Icon, label }) => (
          <button type="button" key={id} onClick={() => set({ addressLabel: id })}
            className={`flex items-center gap-2 border px-4 py-2.5 text-sm transition ${state.addressLabel === id ? 'border-[#d7b98b] bg-[#d7b98b]/10 text-[#d7b98b]' : 'border-white/15 text-white/50 hover:border-[#d7b98b]/40'}`}>
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
              required placeholder="Mumbai" className="input-field" />
          </FormField>
          <FormField label="State">
            <input value={state.addressState} onChange={e => set({ addressState: e.target.value })}
              placeholder="Maharashtra" className="input-field" />
          </FormField>
          <FormField label="Pincode *">
            <input value={state.addressPincode} onChange={e => set({ addressPincode: e.target.value })}
              required placeholder="400001" maxLength={6} className="input-field" />
          </FormField>
        </div>
      </div>
    </div>
  )
}

function StepDateTime({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  const days = getNextDays(7)
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">When do you need it?</h2>
      <p className="mb-8 text-sm text-white/50">Choose a convenient date and time</p>

      <div className="mb-8">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">Select date</p>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <button type="button" key={day.value} onClick={() => set({ scheduledDate: day.value })}
              className={`border px-5 py-3 text-sm transition ${state.scheduledDate === day.value ? 'border-[#d7b98b] bg-[#d7b98b]/10 text-[#d7b98b]' : 'border-white/15 text-white/60 hover:border-[#d7b98b]/40'}`}>
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">Select time slot</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TIME_SLOTS.map(slot => (
            <button type="button" key={slot.start} onClick={() => set({ timeSlotStart: slot.start, timeSlotEnd: slot.end, timeSlotLabel: slot.label })}
              className={`flex items-center gap-2 border px-4 py-3.5 text-sm transition ${state.timeSlotStart === slot.start ? 'border-[#d7b98b] bg-[#d7b98b]/10 text-[#d7b98b]' : 'border-white/15 text-white/60 hover:border-[#d7b98b]/40'}`}>
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
      <h2 className="mb-2 font-serif text-3xl text-white">Choose a technician</h2>
      <p className="mb-8 text-sm text-white/50">Pick one or let us assign the best available</p>

      {/* Auto-assign option */}
      <button type="button" onClick={() => set({ anyTechnician: true, technicianId: '', technician: null })}
        className={`mb-4 flex w-full items-center gap-4 border p-5 text-left transition ${state.anyTechnician ? 'border-[#d7b98b] bg-[#d7b98b]/8' : 'border-white/12 bg-[#111114] hover:border-[#d7b98b]/40'}`}>
        <div className="flex size-12 flex-shrink-0 items-center justify-center border border-white/15 bg-white/5">
          <User className="size-6 text-[#d7b98b]" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white">Assign any available technician</p>
          <p className="mt-0.5 text-xs text-white/40">We'll assign the best-rated available technician in your area</p>
        </div>
        {state.anyTechnician && <Check className="size-4 flex-shrink-0 text-[#d7b98b]" />}
      </button>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-[#d7b98b]" /></div>
      ) : technicians.length === 0 ? (
        <div className="border border-white/10 bg-[#111114] p-6 text-center">
          <AlertCircle className="mx-auto mb-3 size-6 text-white/30" />
          <p className="text-sm text-white/50">No verified technicians found for this area.</p>
          <p className="mt-1 text-xs text-white/30">We'll assign one when you proceed.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {technicians.map(tech => {
            const active = state.technicianId === tech.id && !state.anyTechnician
            return (
              <button type="button" key={tech.id} onClick={() => set({ technicianId: tech.id, technician: tech, anyTechnician: false })}
                className={`flex items-center gap-4 border p-4 text-left transition ${active ? 'border-[#d7b98b] bg-[#d7b98b]/8' : 'border-white/12 bg-[#111114] hover:border-[#d7b98b]/40'}`}>
                <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
                  {tech.avatar ? (
                    <img src={tech.avatar} alt={tech.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-medium text-white/50">
                      {tech.name?.[0]}
                    </div>
                  )}
                  {tech.isVerified && (
                    <div className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#d7b98b]">
                      <Check className="size-2.5 text-[#0b0b0d]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{tech.name}</p>
                    {tech.isVerified && (
                      <span className="flex-shrink-0 border border-[#d7b98b]/30 px-1.5 py-0.5 text-[9px] uppercase text-[#d7b98b]">Verified</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Star className="size-3 fill-[#d7b98b] text-[#d7b98b]" />{tech.rating.toFixed(1)}</span>
                    <span>{tech.completedJobs} jobs</span>
                    <span>{tech.experience}y exp</span>
                  </div>
                </div>
                {active && <Check className="size-4 flex-shrink-0 text-[#d7b98b]" />}
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
      <h2 className="mb-2 font-serif text-3xl text-white">Describe the problem</h2>
      <p className="mb-8 text-sm text-white/50">Help the technician understand your issue before arriving</p>
      <div className="flex flex-col gap-5">
        <FormField label="Problem description">
          <textarea value={state.problemDescription}
            onChange={e => set({ problemDescription: e.target.value })}
            rows={5}
            placeholder="e.g. My kitchen sink has been leaking from under the basin for 2 days. The water pressure also seems low."
            className="input-field resize-none leading-6" />
        </FormField>
        <div className="border border-white/10 bg-[#111114] p-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">Attach photos (optional)</p>
          <p className="text-xs text-white/30">Upload photos of the issue to help the technician prepare</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 border border-dashed border-white/20 px-4 py-3 text-sm text-white/40 hover:border-[#d7b98b]/40 hover:text-white/60">
            <Camera className="size-4" /> Click to upload photos
            <input type="file" multiple accept="image/*" className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files ?? [])
                set({ attachments: files.map(f => URL.createObjectURL(f)) })
              }} />
          </label>
          {state.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {state.attachments.map((url, i) => (
                <img key={i} src={url} alt="" className="size-16 object-cover border border-white/15" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepPricing({ state }: { state: BookingState }) {
  const basePrice = state.service?.basePrice ?? 299
  const visitCharge = 99
  const subtotal = basePrice + visitCharge
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + tax

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">Price estimate</h2>
      <p className="mb-8 text-sm text-white/50">Final price may vary based on inspection and materials</p>

      <div className="border border-white/15 bg-[#111114]">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Service breakdown</p>
        </div>
        <div className="flex flex-col gap-0 divide-y divide-white/8 px-5">
          <PriceLine label={state.service?.name ?? 'Service charge'} value={fmt(basePrice)} />
          <PriceLine label="Visit charge" value={fmt(visitCharge)} />
          <PriceLine label="Materials cost" value="As required" dim />
          <div className="py-3">
            <div className="flex justify-between text-xs text-white/40">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-white/40">
              <span>GST (18%)</span><span>{fmt(tax)}</span>
            </div>
          </div>
          <div className="flex justify-between py-4 text-base font-medium">
            <span className="text-white">Estimated Total</span>
            <span className="text-[#d7b98b]">{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/8 p-4">
        <AlertCircle className="mt-0.5 size-4 flex-shrink-0 text-yellow-400" />
        <p className="text-xs leading-5 text-yellow-300/80">
          <strong>Note:</strong> The estimated price covers the service charge and visit fee. If the job requires additional materials or extra labour, the technician will inform you before proceeding. Final amount may vary.
        </p>
      </div>
    </div>
  )
}

function StepPayment({ state, set }: { state: BookingState; set: (u: Partial<BookingState>) => void }) {
  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">Payment method</h2>
      <p className="mb-8 text-sm text-white/50">How would you like to pay?</p>
      <div className="flex flex-col gap-3">
        {PAYMENT_METHODS.map(method => (
          <button type="button" key={method.id} onClick={() => set({ paymentMethod: method.id })}
            className={`flex items-center gap-4 border p-5 text-left transition ${state.paymentMethod === method.id ? 'border-[#d7b98b] bg-[#d7b98b]/8' : 'border-white/12 bg-[#111114] hover:border-[#d7b98b]/40'}`}>
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-white">{method.label}</p>
              <p className="text-xs text-white/40">{method.desc}</p>
            </div>
            {state.paymentMethod === method.id && <Check className="size-4 text-[#d7b98b]" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepConfirm({ state }: { state: BookingState }) {
  const basePrice = state.service?.basePrice ?? 299
  const visitCharge = 99
  const subtotal = basePrice + visitCharge
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + tax

  const rows: [string, string][] = [
    ['Service', state.service?.name ?? state.categoryLabel],
    ['Category', state.categoryLabel],
    ['Date', state.scheduledDate ? new Date(state.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
    ['Time', state.timeSlotLabel || '—'],
    ['Technician', state.anyTechnician ? 'Auto-assigned' : (state.technician?.name ?? 'Auto-assigned')],
    ['Address', [state.addressLine1, state.addressLine2, state.addressCity, state.addressPincode].filter(Boolean).join(', ')],
    ['Payment', PAYMENT_METHODS.find(m => m.id === state.paymentMethod)?.label ?? state.paymentMethod],
    ['Estimated Total', fmt(total)],
  ]

  return (
    <div>
      <h2 className="mb-2 font-serif text-3xl text-white">Review & confirm</h2>
      <p className="mb-8 text-sm text-white/50">Please verify your booking details before confirming</p>
      <div className="divide-y divide-white/8 border border-white/15 bg-[#111114]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <span className="flex-shrink-0 text-xs text-white/40">{k}</span>
            <span className="text-right text-sm text-white/80">{v}</span>
          </div>
        ))}
      </div>
      {state.problemDescription && (
        <div className="mt-4 border border-white/10 bg-[#111114] p-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">Your description</p>
          <p className="text-sm leading-6 text-white/60">{state.problemDescription}</p>
        </div>
      )}
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ booking }: { booking: { bookingNumber: string; totalAmount: number; scheduledDate: string; timeSlotStart: string; timeSlotEnd: string } }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-6 flex size-20 items-center justify-center bg-[#d7b98b]/15 text-[#d7b98b]">
        <CheckCircle2 className="size-10" />
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Booking confirmed</p>
      <h2 className="font-serif text-4xl text-white">You're all set!</h2>
      <p className="mt-3 text-sm text-white/50">Your technician has been notified and will be there on time.</p>

      <div className="mt-8 w-full max-w-sm border border-white/15 bg-[#111114]">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Booking ID</p>
          <p className="mt-1 font-mono text-xl font-medium text-[#d7b98b]">{booking.bookingNumber}</p>
        </div>
        <div className="px-5 py-4 text-sm text-white/60">
          <p className="flex justify-between"><span>Date</span><span className="text-white">{new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
          <p className="mt-2 flex justify-between"><span>Time</span><span className="text-white">{booking.timeSlotStart} – {booking.timeSlotEnd}</span></p>
          <p className="mt-2 flex justify-between"><span>Estimated Total</span><span className="text-[#d7b98b]">{fmt(booking.totalAmount)}</span></p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-[#d7b98b] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
          Track Booking <ArrowRight className="size-4" />
        </button>
        <button type="button" onClick={() => router.push('/')}
          className="flex items-center gap-2 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white/60 hover:border-[#d7b98b] hover:text-[#d7b98b]">
          Back to Home
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PriceLine({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className={`flex justify-between py-3 text-sm ${dim ? 'text-white/30' : 'text-white/60'}`}>
      <span>{label}</span><span className={dim ? '' : 'text-white/80'}>{value}</span>
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
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">
        {label}
        {placeholder ? <span className="sr-only"> — {placeholder}</span> : null}
      </label>
      {children}
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
  }
  if (step === 3) {
    if (!state.scheduledDate) return 'Please select a date'
    if (!state.timeSlotStart) return 'Please select a time slot'
  }
  if (step === 4 && !state.anyTechnician && !state.technicianId) return 'Please select a technician or choose auto-assign'
  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

function BookTechnicianInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  const [step, setStep] = useState(0)
  const [state, setState] = useState<BookingState>({
    ...EMPTY,
    category: searchParams.get('category') ?? '',
    categoryLabel: CATEGORIES.find(c => c.id === searchParams.get('category'))?.label ?? '',
  })
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<{ bookingNumber: string; totalAmount: number; scheduledDate: string; timeSlotStart: string; timeSlotEnd: string } | null>(null)

  // If category pre-selected from URL, skip step 0
  useEffect(() => {
    if (state.category && step === 0) setStep(1)
  }, [])

  const set = useCallback((update: Partial<BookingState>) => {
    setState(prev => ({ ...prev, ...update }))
    setValidationError('')
  }, [])

  function next() {
    const err = validateStep(step, state)
    if (err) { setValidationError(err); return }
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
    if (!isAuthenticated) { router.push('/login?redirect=/book/technician'); return }
    const err = validateStep(step, state)
    if (err) { setValidationError(err); return }

    setSubmitting(true)
    try {
      const booking = await technicianApi.createBooking({
        serviceId: state.serviceId,
        category: state.category,
        serviceDescription: state.problemDescription || undefined,
        technicianId: state.anyTechnician ? undefined : (state.technicianId || undefined),
        addressLine1: state.addressLine1,
        addressLine2: state.addressLine2 || undefined,
        addressCity: state.addressCity,
        addressState: state.addressState || undefined,
        addressPincode: state.addressPincode,
        addressLabel: state.addressLabel,
        scheduledDate: new Date(state.scheduledDate).toISOString(),
        timeSlotStart: state.timeSlotStart,
        timeSlotEnd: state.timeSlotEnd,
        paymentMethod: state.paymentMethod as any,
        customerNotes: state.problemDescription || undefined,
      })
      setCreatedBooking({
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        scheduledDate: booking.scheduledDate,
        timeSlotStart: booking.timeSlotStart,
        timeSlotEnd: booking.timeSlotEnd,
      })
      setSubmitted(true)
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
    <StepCategory key={0} state={state} set={set} next={next} />,
    <StepService key={1} state={state} set={set} next={next} prev={prev} />,
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
      <div className="border-b border-white/8 bg-white/[0.02]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/services" className="flex items-center gap-2 text-sm text-white/50 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>All services</span>
          </Link>
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-[#d7b98b]" aria-hidden="true" />
            <span className="font-serif text-lg text-white">Book a Technician</span>
          </div>
          <span className="w-[6.5rem]" aria-hidden="true" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-[10px] text-white/40">
            <span className="uppercase tracking-[0.2em]">Step {step + 1} of {STEPS.length}</span>
            <span className="text-[#d7b98b]">{STEPS[step]}</span>
          </div>
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-[#d7b98b] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step dots for desktop */}
          <div className="mt-3 hidden justify-between sm:flex">
            {STEPS.map((s, i) => (
              <div key={s} className={`text-[9px] uppercase tracking-[0.1em] ${i <= step ? 'text-[#d7b98b]' : 'text-white/20'}`}>
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
              className="flex items-center gap-2 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white/60 transition hover:border-[#d7b98b]/50 hover:text-[#d7b98b]">
              <ArrowLeft className="size-4" /> Previous
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="group flex items-center gap-2 bg-[#d7b98b] px-8 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] transition hover:bg-[#e8cfa0]">
                Continue <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting || isLoading}
                className="group flex items-center gap-2 bg-[#d7b98b] px-8 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] transition hover:bg-[#e8cfa0] disabled:opacity-50">
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Booking…</> : <>Confirm Booking <Check className="size-4" /></>}
              </button>
            )}
          </div>
        )}

        {/* Login notice */}
        {step === STEPS.length - 1 && !isAuthenticated && (
          <div className="mt-4 border border-yellow-500/20 bg-yellow-500/8 px-4 py-3 text-center text-sm text-yellow-300/80">
            You'll be asked to <Link href="/login" className="underline">sign in</Link> before confirming.
          </div>
        )}
      </div>

      <style>{`
        .input-field { width:100%; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.05); padding:.75rem 1rem; font-size:.875rem; color:#fff; }
        .input-field::placeholder { color: rgba(255,255,255,.3); }
        .input-field:focus { outline: none; border-color: #d7b98b; }
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
