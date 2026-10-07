'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Wrench, Sparkles, ArrowRight, Star, Search, ChevronDown,
  Zap, Droplets, Wind, Hammer, Paintbrush2, Tv2, Shield,
  Camera, Utensils, Music, Flower2, Mic2, MapPin, Users,
  CheckCircle2, Phone
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import PlatformStats from '@/components/brand/PlatformStats'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TECH_SERVICES = [
  { name: 'Plumber', icon: Droplets, category: 'PLUMBING', price: '₹299', rating: 4.8, color: 'bg-blue-500/10 text-blue-400' },
  { name: 'Electrician', icon: Zap, category: 'ELECTRICAL', price: '₹349', rating: 4.9, color: 'bg-yellow-500/10 text-yellow-400' },
  { name: 'AC Technician', icon: Wind, category: 'AC_SERVICE', price: '₹399', rating: 4.7, color: 'bg-cyan-500/10 text-cyan-400' },
  { name: 'Carpenter', icon: Hammer, category: 'CARPENTRY', price: '₹449', rating: 4.6, color: 'bg-orange-500/10 text-orange-400' },
  { name: 'Painter', icon: Paintbrush2, category: 'PAINTING', price: '₹299', rating: 4.7, color: 'bg-purple-500/10 text-purple-400' },
  { name: 'Appliance Repair', icon: Tv2, category: 'APPLIANCE_REPAIR', price: '₹449', rating: 4.8, color: 'bg-green-500/10 text-green-400' },
  { name: 'CCTV Install', icon: Shield, category: 'CCTV_INSTALLATION', price: '₹799', rating: 4.9, color: 'bg-red-500/10 text-red-400' },
  { name: 'Cleaning', icon: Sparkles, category: 'CLEANING', price: '₹599', rating: 4.8, color: 'bg-pink-500/10 text-pink-400' },
]

const EVENT_TYPES = [
  { name: 'Birthday', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80', type: 'BIRTHDAY' },
  { name: 'Baby Shower', img: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=600&q=80', type: 'BABY_SHOWER' },
  { name: 'Wedding', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80', type: 'WEDDING' },
  { name: 'Engagement', img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80', type: 'ENGAGEMENT' },
  { name: 'Anniversary', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80', type: 'ANNIVERSARY' },
  { name: 'Corporate Event', img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80', type: 'CORPORATE' },
  { name: 'College Event', img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80', type: 'COLLEGE_EVENT' },
  { name: 'Housewarming', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80', type: 'HOUSEWARMING' },
  { name: 'Other Celebration', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80', type: 'OTHER' },
]

const EVENT_SERVICES = [
  { icon: Camera, label: 'Photography' },
  { icon: Flower2, label: 'Decoration' },
  { icon: Utensils, label: 'Catering' },
  { icon: Music, label: 'DJ & Music' },
  { icon: Mic2, label: 'Event Host' },
  { icon: Sparkles, label: 'Stage Setup' },
]

// Statistics shown on this page are read live from the API by <PlatformStats />
// rather than hard-coded, so no number here can drift from the database.

const HOW_IT_WORKS = [
  { step: '01', title: 'Tell us your requirements', desc: 'Choose your event and share your date, guests, location, budget and ideas.' },
  { step: '02', title: 'We plan it with you', desc: 'An event expert reviews your request and shapes a plan around your needs.' },
  { step: '03', title: 'Review your proposal', desc: 'See the custom services and pricing. Ask for changes whenever you need.' },
  { step: '04', title: 'Approve your plan', desc: 'Approve the proposal and arrange the advance payment with your event team.' },
  { step: '05', title: 'We handle the event', desc: 'Your event team coordinates preparation and event-day delivery.' },
]

const TESTIMONIALS = [
  { name: 'Priya Kapoor', city: 'Mumbai', rating: 5, text: 'The plumber arrived within the hour. Extremely professional and fixed the leak perfectly. Will definitely use again!', service: 'Plumbing' },
  { name: 'Rahul Verma', city: 'Delhi', rating: 5, text: 'Booked a birthday party setup and it was absolutely stunning. The team handled everything flawlessly.', service: 'Event Planning' },
  { name: 'Anjali Singh', city: 'Bangalore', rating: 5, text: 'AC service was quick and affordable. The technician was polite and knowledgeable.', service: 'AC Service' },
]

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/services?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <SiteShell transparentHeader>
      <div className="text-[#f4f1ec]">
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-screen items-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b0b0d]/60 via-[#0b0b0d]/40 to-[#0b0b0d]" />

        <div className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 border border-[#d7b98b]/30 bg-[#d7b98b]/8 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">
              <CheckCircle2 className="size-3.5" /> Verified professionals · Transparent pricing · Pan-India
            </p>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-[80px]">
              Book Trusted<br />
              <em className="font-light text-[#d7b98b]">Professionals</em><br />
              & Event Services
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/60">
              Book trusted technicians for home services, or tell our event team what you are planning. We will help shape a custom proposal around your needs.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} role="search" className="mt-8 flex max-w-lg">
              <div className="relative flex-1">
                <label htmlFor="hero-search" className="sr-only">
                  Search services and events
                </label>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30"
                  aria-hidden="true"
                />
                <input
                  id="hero-search"
                  type="search"
                  name="q"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Plumber, Electrician, Wedding, Birthday…"
                  className="w-full border border-white/20 bg-white/5 py-4 pl-11 pr-4 text-sm text-white placeholder:text-white/30 transition-colors duration-200 focus:border-[#d7b98b] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="min-h-[3.25rem] bg-[#d7b98b] px-6 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] transition-colors duration-200 hover:bg-[#e8cfa0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Search
              </button>
            </form>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book/technician"
                className="group flex items-center gap-3 bg-white px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-[#0b0b0d] transition hover:bg-[#d7b98b]">
                <Wrench className="size-4" /> Book a Technician
              </Link>
              <Link href="/plan-event"
                className="group flex items-center gap-3 border border-[#d7b98b] px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-[#d7b98b] transition hover:bg-[#d7b98b] hover:text-[#1c1915]">
                <Sparkles className="size-4" /> Plan My Event
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
          <span className="text-[9px] uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="size-4 animate-bounce" />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <PlatformStats />

      {/* ── TWO PRODUCTS ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">One platform</p>
          <h2 className="font-serif text-4xl tracking-tight lg:text-5xl">Every service you need.</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Home Services card */}
          <div className="group relative overflow-hidden border border-white/15 bg-[#111114] p-8 transition hover:border-[#d7b98b]/40">
            <div className="mb-6 flex size-14 items-center justify-center border border-white/15 bg-white/5">
              <Wrench className="size-7 text-[#d7b98b]" />
            </div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#d7b98b]">Home Services</p>
            <h3 className="mb-3 font-serif text-3xl">Book verified technicians<br />at your doorstep.</h3>
            <p className="mb-6 text-sm leading-6 text-white/50">
              Plumbers, electricians, AC technicians, carpenters and more. All background-verified and rated by real customers.
            </p>
            <div className="mb-8 grid grid-cols-3 gap-3">
              {TECH_SERVICES.slice(0, 6).map(({ name, icon: Icon, category, color }) => (
                <Link key={name} href={`/book/technician?category=${category}`}
                  className="flex flex-col items-center gap-2 border border-white/10 p-3 text-center transition hover:border-[#d7b98b]/40">
                  <div className={`flex size-9 items-center justify-center rounded-full ${color}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] text-white/60">{name}</span>
                </Link>
              ))}
            </div>
            <Link href="/book/technician"
              className="inline-flex items-center gap-2 bg-[#d7b98b] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] transition hover:bg-[#e8cfa0]">
              Book a Technician <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Event Services card */}
          <div className="group relative overflow-hidden border border-white/15 bg-[#111114] p-8 transition hover:border-[#d7b98b]/40">
            <div className="mb-6 flex size-14 items-center justify-center border border-white/15 bg-white/5">
              <Sparkles className="size-7 text-[#d7b98b]" />
            </div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#d7b98b]">Event Services</p>
            <h3 className="mb-3 font-serif text-3xl">Planning something<br />special?</h3>
            <p className="mb-6 text-sm leading-6 text-white/50">
              Tell us what you are celebrating, your budget and what you need. Our event experts will create a customized plan with you.
            </p>
            <div className="mb-8 grid grid-cols-3 gap-3">
              {EVENT_SERVICES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 border border-white/10 p-3 text-center">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#d7b98b]/10 text-[#d7b98b]">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] text-white/60">{label}</span>
                </div>
              ))}
            </div>
            <Link href="/plan-event"
              className="inline-flex items-center gap-2 border border-[#d7b98b] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#d7b98b] transition hover:bg-[#d7b98b] hover:text-[#1c1915]">
              Plan My Event <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TECHNICIAN SERVICES GRID ─────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-[#0e0e11] px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Need a technician?</p>
              <h2 className="font-serif text-4xl lg:text-5xl">Book trusted professionals<br /><em className="font-light text-[#d7b98b]">at your doorstep.</em></h2>
            </div>
            <Link href="/services" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 hover:text-[#d7b98b]">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TECH_SERVICES.map(({ name, icon: Icon, category, price, rating, color }) => (
              <Link key={name} href={`/book/technician?category=${category}`}
                className="group flex flex-col gap-4 border border-white/10 bg-[#111114] p-6 transition hover:border-[#d7b98b]/40 hover:bg-[#131316]">
                <div className={`flex size-12 items-center justify-center rounded-full ${color}`}>
                  <Icon className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">{name}</h3>
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="size-3 fill-[#d7b98b] text-[#d7b98b]" />
                    <span className="text-xs text-white/50">{rating} rating</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Starting from</span>
                  <span className="text-sm font-medium text-[#d7b98b]">{price}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-[#d7b98b] opacity-0 transition group-hover:opacity-100">
                  Book Now <ArrowRight className="size-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Your celebration, your way</p>
            <h2 className="font-serif text-4xl lg:text-5xl">Planning something <em className="font-light text-[#d7b98b]">special?</em></h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">Tell us what you have in mind. Our event experts will help with the venue, decoration, catering, photography and everything in between.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/plan-event" className="flex items-center gap-2 bg-[#d7b98b] px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
              Plan My Event <ArrowRight className="size-4" />
            </Link>
            <a href="tel:+918050171547" className="flex items-center gap-2 border border-white/20 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-white/65 hover:border-[#d7b98b] hover:text-[#d7b98b]">
              <Phone className="size-4" /> Talk to an Event Expert
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {EVENT_TYPES.map(({ name, img, type }) => (
            <Link key={name} href={`/plan-event?type=${type}`} className="group relative aspect-[1.05] overflow-hidden border border-white/10">
              <img src={img} alt={name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-serif text-2xl text-white">{name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#d7b98b]">Start planning <ArrowRight className="size-3" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI DESIGNER PROMO ────────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-[#0e0e11] px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">AI-powered design</p>
              <h2 className="font-serif text-4xl leading-tight lg:text-5xl">
                Design your event<br /><em className="font-light text-[#d7b98b]">with AI.</em>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/55">
                Tell our AI what you're imagining — theme, mood, budget, guest count — and it builds a complete event concept with colour palette, décor plan, entertainment, and cost estimate.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/ai-event-designer"
                  className="flex items-center gap-2 bg-[#d7b98b] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] transition hover:bg-[#e8cfa0]">
                  <Sparkles className="size-4" /> Try AI Designer
                </Link>
              </div>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 border border-white/15 bg-[#141416] p-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#d7b98b]">Example prompt</p>
              <p className="text-sm italic text-white/60">"I want a luxury black and gold birthday party for 40 guests, ₹1 lakh budget, outdoor venue in Mumbai."</p>
              <div className="border-t border-white/10 pt-3">
                <p className="text-[10px] text-white/40">AI generates:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['Theme', 'Décor plan', 'Colour palette', 'Entertainment', 'Food menu', 'Cost estimate'].map(tag => (
                    <span key={tag} className="bg-[#d7b98b]/10 px-2 py-0.5 text-[10px] text-[#d7b98b]">{tag}</span>
                  ))}
                </div>
              </div>
              <Link href="/ai-event-designer"
                className="mt-1 flex items-center justify-center gap-2 border border-[#d7b98b]/30 py-2.5 text-[11px] uppercase tracking-[0.15em] text-[#d7b98b] hover:bg-[#d7b98b]/5">
                Generate your design <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Custom event planning</p>
          <h2 className="font-serif text-4xl lg:text-5xl">How event planning works</h2>
        </div>
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-5">
          {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
            <div key={step} className="relative border-t border-white/10 px-5 py-6 first:border-t-0 sm:first:border-t-0 lg:border-t">
              <p className="font-serif text-4xl text-[#d7b98b]/55">{step}</p>
              <h3 className="mt-4 text-base font-medium text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-[#0e0e11] px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">What customers say</p>
            <h2 className="font-serif text-4xl">Real experiences,<br /><em className="font-light text-[#d7b98b]">real people.</em></h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map(({ name, city, rating, text, service }) => (
              <div key={name} className="border border-white/10 bg-[#111114] p-6">
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-[#d7b98b] text-[#d7b98b]" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-white/70 italic">"{text}"</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-white/40">{city}</p>
                  </div>
                  <span className="border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-[#d7b98b]">{service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────────────────────── */}
      <section id="about" className="relative scroll-mt-16 overflow-hidden bg-[#d7b98b] px-5 py-20 lg:px-10 lg:py-24">
        <div className="absolute -right-16 -top-16 font-serif text-[200px] leading-none text-[#c9a878]/30">A</div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#8b6914]">Get started today</p>
              <h2 className="font-serif text-4xl leading-tight text-[#1c1915] lg:text-6xl">
                Your next service<br /><em className="font-light">starts here.</em>
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/book/technician"
                className="flex items-center gap-2 bg-[#1c1915] px-7 py-4 text-[11px] uppercase tracking-[0.18em] text-[#d7b98b] transition hover:bg-[#2e2925]">
                <Wrench className="size-4" /> Book Technician
              </Link>
              <Link href="/plan-event"
                className="flex items-center gap-2 border-2 border-[#1c1915] px-7 py-4 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] transition hover:bg-[#1c1915] hover:text-[#d7b98b]">
                <Sparkles className="size-4" /> Plan Your Event
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </SiteShell>
  )
}
