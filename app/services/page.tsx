'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Wrench, Zap, Droplets, Wind, Hammer, Paintbrush2, Tv2, Shield,
  Sparkles, Leaf, Bug, ArrowRight, Star, Search, ChevronRight,
  Camera, Flower2, Utensils, Music, Mic2, Package, Home, X
} from 'lucide-react'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import SiteShell from '@/components/layout/SiteShell'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TECH_CATEGORIES = [
  {
    id: 'PLUMBING', label: 'Plumbing', icon: Droplets,
    color: 'text-blue-400', bg: 'bg-blue-500/10',
    desc: 'Tap repair, pipe leakage, bathroom plumbing, water tank, new installations',
    startingPrice: 299, rating: 4.8, jobs: '12,400+',
    services: ['Tap Repair', 'Pipe Leakage Fix', 'Bathroom Plumbing', 'Water Tank Repair', 'New Pipe Installation', 'Drain Cleaning', 'Geyser Installation', 'Kitchen Sink'],
  },
  {
    id: 'ELECTRICAL', label: 'Electrical', icon: Zap,
    color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    desc: 'Switch/socket repair, fan installation, wiring, MCB, electrical panel',
    startingPrice: 349, rating: 4.9, jobs: '18,200+',
    services: ['Switch/Socket Repair', 'Fan Installation', 'Light Fitting', 'Wiring & Cabling', 'MCB/Fuse Box', 'Inverter Setup', 'Meter Board', 'Extension Board'],
  },
  {
    id: 'AC_SERVICE', label: 'AC Service', icon: Wind,
    color: 'text-cyan-400', bg: 'bg-cyan-500/10',
    desc: 'AC servicing, installation, repair, gas refill, deep cleaning',
    startingPrice: 399, rating: 4.7, jobs: '9,800+',
    services: ['AC Servicing', 'AC Installation', 'Gas Refill', 'AC Repair', 'Deep Cleaning', 'Fan Motor Repair', 'PCB Repair', 'Remote Repair'],
  },
  {
    id: 'APPLIANCE_REPAIR', label: 'Appliance Repair', icon: Tv2,
    color: 'text-green-400', bg: 'bg-green-500/10',
    desc: 'Washing machine, refrigerator, microwave, TV, geyser, dishwasher',
    startingPrice: 449, rating: 4.8, jobs: '15,600+',
    services: ['Washing Machine', 'Refrigerator/Fridge', 'Microwave Oven', 'Television/LCD', 'Geyser/Water Heater', 'Dishwasher', 'Mixer/Grinder', 'Induction Cooktop'],
  },
  {
    id: 'CARPENTRY', label: 'Carpentry', icon: Hammer,
    color: 'text-orange-400', bg: 'bg-orange-500/10',
    desc: 'Furniture repair, door/window, wardrobe, wooden flooring, partitions',
    startingPrice: 449, rating: 4.6, jobs: '7,300+',
    services: ['Furniture Repair', 'Door/Window Fix', 'Wardrobe Assembly', 'Wooden Flooring', 'Kitchen Cabinet', 'Cupboard Fitting', 'Partition Work', 'False Ceiling'],
  },
  {
    id: 'PAINTING', label: 'Painting', icon: Paintbrush2,
    color: 'text-purple-400', bg: 'bg-purple-500/10',
    desc: 'Interior, exterior, texture, waterproofing, wood polish, POP work',
    startingPrice: 299, rating: 4.7, jobs: '6,100+',
    services: ['Interior Painting', 'Exterior Painting', 'Texture Painting', 'Waterproofing', 'Wood Polish/Paint', 'POP Work', 'Wall Putty', 'Enamel Painting'],
  },
  {
    id: 'CLEANING', label: 'Cleaning', icon: Sparkles,
    color: 'text-pink-400', bg: 'bg-pink-500/10',
    desc: 'Home deep cleaning, sofa, carpet, bathroom, kitchen, post-renovation',
    startingPrice: 599, rating: 4.8, jobs: '22,000+',
    services: ['Full Home Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'Bathroom Deep Clean', 'Kitchen Cleaning', 'Post-Renovation Clean', 'Water Tank Cleaning', 'Glass/Window Cleaning'],
  },
  {
    id: 'CCTV_INSTALLATION', label: 'CCTV Installation', icon: Shield,
    color: 'text-red-400', bg: 'bg-red-500/10',
    desc: 'CCTV camera installation, DVR/NVR setup, maintenance, IP cameras',
    startingPrice: 799, rating: 4.9, jobs: '4,200+',
    services: ['Camera Installation', 'DVR/NVR Setup', 'IP Camera Setup', 'Wiring & Cabling', 'Remote Viewing', 'Annual Maintenance', 'Camera Upgrade', 'Hard Disk Setup'],
  },
  {
    id: 'COMPUTER_REPAIR', label: 'Computer Repair', icon: Tv2,
    color: 'text-indigo-400', bg: 'bg-indigo-500/10',
    desc: 'Laptop, desktop, printer, WiFi, networking, virus removal, data recovery',
    startingPrice: 499, rating: 4.7, jobs: '8,900+',
    services: ['Laptop Repair', 'Desktop Repair', 'Printer Service', 'WiFi Setup', 'Virus Removal', 'Data Recovery', 'OS Installation', 'Networking'],
  },
  {
    id: 'PEST_CONTROL', label: 'Pest Control', icon: Bug,
    color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    desc: 'Cockroach, termite, rodent, bed bugs, mosquito, lizard treatment',
    startingPrice: 999, rating: 4.8, jobs: '5,600+',
    services: ['Cockroach Control', 'Termite Control', 'Rodent Control', 'Bed Bug Treatment', 'Mosquito Control', 'Ant Control', 'Lizard Control', 'General Pest Control'],
  },
  {
    id: 'OTHER', label: 'Other Services', icon: Wrench,
    color: 'text-white/60', bg: 'bg-white/8',
    desc: 'Welding, flooring, waterproofing, miscellaneous home repair',
    startingPrice: 299, rating: 4.6, jobs: '3,100+',
    services: ['Welding Work', 'Tile Grouting', 'Waterproofing', 'Epoxy Flooring', 'Interlock Tiles', 'Gate/Grill Repair', 'Metal Fabrication', 'Miscellaneous'],
  },
]

const EVENT_SERVICES = [
  { id: 'decoration', label: 'Decoration', icon: Flower2, color: 'text-pink-400', bg: 'bg-pink-500/10', desc: 'Floral, theme, stage, balloon, LED setups', price: 15000 },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Candid, cinematic, portrait, drone', price: 15000 },
  { id: 'catering', label: 'Catering', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/10', desc: 'Multi-cuisine, live stations, desserts', price: 850 },
  { id: 'music', label: 'DJ & Music', icon: Music, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'DJ, live band, sound system', price: 18000 },
  { id: 'host', label: 'Event Host', icon: Mic2, color: 'text-yellow-400', bg: 'bg-yellow-500/10', desc: 'Professional emcee, anchor, performer', price: 12000 },
  { id: 'packages', label: 'Event Packages', icon: Package, color: 'text-[#d7b98b]', bg: 'bg-[#d7b98b]/10', desc: 'Complete event bundles, all-inclusive', price: 25000 },
]

function ServicesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const [searchQuery, setSearchQuery] = useState(initialQ)
  const [activeSection, setActiveSection] = useState<'home' | 'event'>('home')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase()
    const match = TECH_CATEGORIES.find(cat =>
      cat.label.toLowerCase().includes(q) || cat.services.some(s => s.toLowerCase().includes(q))
    )
    if (match) router.push(`/book/technician?category=${match.id}`)
    else router.push(`/events?search=${encodeURIComponent(searchQuery)}`)
  }

  const filteredTech = searchQuery
    ? TECH_CATEGORIES.filter(cat =>
        cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : TECH_CATEGORIES

  return (
    <>
      {/* Hero */}
      <section className="border-b border-white/8 bg-[#111114] px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">All services</p>
          <h1 className="font-serif text-5xl tracking-tight text-white lg:text-6xl">
            Every service<br /><em className="font-light text-[#d7b98b]">you need.</em>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
            Verified home service professionals and complete event planning. All on one platform.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8 flex max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search plumber, AC service, decoration…"
                className="w-full border border-white/20 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#d7b98b] focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button type="submit"
              className="bg-[#d7b98b] px-6 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
              Search
            </button>
          </form>

          {/* Section toggle */}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setActiveSection('home')}
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition ${activeSection === 'home' ? 'bg-[#d7b98b] text-[#1c1915]' : 'border border-white/20 text-white/60 hover:border-[#d7b98b]/50 hover:text-[#d7b98b]'}`}>
              <Home className="size-4" /> Home Services
            </button>
            <button type="button" onClick={() => setActiveSection('event')}
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition ${activeSection === 'event' ? 'bg-[#d7b98b] text-[#1c1915]' : 'border border-white/20 text-white/60 hover:border-[#d7b98b]/50 hover:text-[#d7b98b]'}`}>
              <Sparkles className="size-4" /> Event Services
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-10 lg:py-16">

        {/* ── HOME SERVICES ── */}
        {activeSection === 'home' && (
          <>
            {searchQuery && filteredTech.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <Search className="mb-4 size-10 text-white/20" />
                <p className="text-sm text-white/50">No services found for "{searchQuery}"</p>
                <button type="button" onClick={() => setSearchQuery('')} className="mt-3 text-xs text-[#d7b98b] hover:underline">Clear search</button>
              </div>
            )}

            {/* Categories grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTech.map(cat => {
                const Icon = cat.icon
                const expanded = expandedCat === cat.id
                return (
                  <div key={cat.id} className={`border border-white/10 bg-[#111114] transition ${expanded ? 'border-[#d7b98b]/30' : 'hover:border-white/20'}`}>
                    {/* Card header */}
                    <div className="p-5">
                      <div className="mb-4 flex items-start justify-between">
                        <div className={`flex size-12 items-center justify-center rounded-full ${cat.bg}`}>
                          <Icon className={`size-6 ${cat.color}`} />
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="size-3.5 fill-[#d7b98b] text-[#d7b98b]" />
                          <span className="text-xs text-white/50">{cat.rating}</span>
                          <span className="text-xs text-white/25 ml-1">({cat.jobs})</span>
                        </div>
                      </div>

                      <h3 className="text-base font-medium text-white">{cat.label}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/45">{cat.desc}</p>

                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-white/30">Starting from</p>
                          <p className="text-base font-medium text-[#d7b98b]">₹{cat.startingPrice}</p>
                        </div>
                        <Link href={`/book/technician?category=${cat.id}`}
                          className="flex items-center gap-1.5 bg-[#d7b98b] px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#1c1915] transition hover:bg-[#e8cfa0]">
                          Book <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Expandable sub-services */}
                    <button type="button"
                      onClick={() => setExpandedCat(expanded ? null : cat.id)}
                      className="flex w-full items-center justify-between border-t border-white/8 px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white/60"
                    >
                      <span>View all services ({cat.services.length})</span>
                      <ChevronRight className={`size-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>

                    {expanded && (
                      <div className="border-t border-white/8 px-5 pb-4 pt-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {cat.services.map(svc => (
                            <Link key={svc} href={`/book/technician?category=${cat.id}`}
                              className="flex items-center gap-1.5 py-1.5 text-xs text-white/50 hover:text-[#d7b98b]">
                              <div className="size-1 flex-shrink-0 rounded-full bg-[#d7b98b]/50" />
                              {svc}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* How it works strip */}
            <div className="mt-14 border-t border-white/8 pt-12">
              <h2 className="mb-8 text-center font-serif text-3xl text-white">
                How home services <em className="font-light text-[#d7b98b]">work</em>
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { num: '01', title: 'Choose a service', desc: 'Pick from our categories above' },
                  { num: '02', title: 'Set location & time', desc: 'Tell us when and where' },
                  { num: '03', title: 'Technician arrives', desc: 'Verified professional at your doorstep' },
                  { num: '04', title: 'Pay & review', desc: 'Pay after service is complete' },
                ].map(({ num, title, desc }) => (
                  <div key={num} className="border-l border-white/10 pl-5">
                    <p className="font-serif text-4xl text-[#d7b98b]/30">{num}</p>
                    <h3 className="mt-3 text-sm font-medium text-white">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-white/40">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href="/book/technician"
                  className="inline-flex items-center gap-2 bg-[#d7b98b] px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-[#1c1915] hover:bg-[#e8cfa0]">
                  <Wrench className="size-4" /> Book a Technician Now
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── EVENT SERVICES ── */}
        {activeSection === 'event' && (
          <>
            <div className="mb-10">
              <p className="text-sm text-white/50 max-w-xl">
                Complete event services for weddings, birthdays, corporate events and more. Mix and match, or choose a complete package.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT_SERVICES.map(svc => {
                const Icon = svc.icon
                return (
                  <div key={svc.id} className="group border border-white/10 bg-[#111114] p-6 transition hover:border-[#d7b98b]/30">
                    <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${svc.bg}`}>
                      <Icon className={`size-6 ${svc.color}`} />
                    </div>
                    <h3 className="text-base font-medium text-white">{svc.label}</h3>
                    <p className="mt-1 text-xs text-white/45 leading-5">{svc.desc}</p>
                    <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-4">
                      <div>
                        <p className="text-[10px] text-white/30">Starting from</p>
                        <p className="text-sm font-medium text-[#d7b98b]">
                          ₹{svc.price.toLocaleString('en-IN')}
                          {svc.id === 'catering' ? '/guest' : ''}
                        </p>
                      </div>
                      <Link href={svc.id === 'packages' ? '/events' : `/events?service=${svc.id}`}
                        className="flex items-center gap-1.5 border border-[#d7b98b]/40 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#d7b98b] transition hover:bg-[#d7b98b] hover:text-[#1c1915]">
                        Explore <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Event types */}
            <div className="mt-14">
              <h2 className="mb-6 font-serif text-3xl text-white">
                Events we <em className="font-light text-[#d7b98b]">specialise in</em>
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  'Weddings', 'Birthdays', 'Engagements', 'Anniversaries', 'Baby Showers',
                  'Corporate Events', 'Conferences', 'Product Launches', "Kids' Parties",
                  'Graduations', 'Housewarmings', 'Theme Parties', 'Proposals', 'Farewells'
                ].map(type => (
                  <Link key={type}
                    href={`/events?type=${type.toUpperCase().replace(/[^A-Z]/g, '_').replace(/_+/g, '_')}`}
                    className="border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:border-[#d7b98b]/40 hover:text-[#d7b98b]">
                    {type}
                  </Link>
                ))}
              </div>
            </div>

            {/* Event CTA */}
            <div className="mt-12 border border-white/10 bg-[#111114] p-8">
              <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#d7b98b]">Plan with AI</p>
                  <h3 className="font-serif text-2xl text-white">Let AI design your event</h3>
                  <p className="mt-2 max-w-sm text-sm text-white/50">Describe your dream event and our AI will create a complete design — theme, décor, budget breakdown, and more.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/ai-event-designer"
                    className="flex items-center gap-2 bg-[#d7b98b] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#1c1915] hover:bg-[#e8cfa0]">
                    <Sparkles className="size-4" /> Try AI Designer
                  </Link>
                  <Link href="/events"
                    className="flex items-center gap-2 border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white/60 hover:border-[#d7b98b] hover:text-[#d7b98b]">
                    Browse Events
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sticky book CTA on mobile */}
      <div className="fixed bottom-4 inset-x-4 z-20 lg:hidden">
        <Link href="/book/technician"
          className="flex items-center justify-center gap-2 bg-[#d7b98b] py-4 text-[11px] uppercase tracking-[0.2em] text-[#1c1915] shadow-2xl hover:bg-[#e8cfa0]">
          <Wrench className="size-4" /> Book a Technician
        </Link>
      </div>
    </>
  )
}

/**
 * Reads the query string via `useSearchParams()`, so it must render inside a
 * Suspense boundary to stay statically prerenderable.
 *
 * The boundary sits inside SiteShell so the navbar and footer still arrive with
 * the server-rendered HTML; only the results wait on the client.
 */
export default function ServicesPage() {
  return (
    <SiteShell>
      <SearchParamsBoundary>
        <ServicesInner />
      </SearchParamsBoundary>
    </SiteShell>
  )
}
