'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { eventsApi } from '@/lib/api'
import type { Event, EventCategory } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import {
  Search, SlidersHorizontal, Star, Heart, MapPin, Users,
  ArrowRight, Loader2, X, ChevronDown, Sparkles
} from 'lucide-react'

const EVENT_TYPES = [
  'WEDDING','BIRTHDAY','ANNIVERSARY','ENGAGEMENT','BABY_SHOWER',
  'CORPORATE','CONFERENCE','KIDS_PARTY','GRADUATION','HOUSEWARMING',
  'PROPOSAL','THEME_PARTY','PRIVATE_CELEBRATION','CUSTOM'
]
const TYPE_LABELS: Record<string, string> = {
  WEDDING:'Wedding', BIRTHDAY:'Birthday', ANNIVERSARY:'Anniversary',
  ENGAGEMENT:'Engagement', BABY_SHOWER:'Baby Shower', CORPORATE:'Corporate',
  CONFERENCE:'Conference', KIDS_PARTY:"Kids' Party", GRADUATION:'Graduation',
  HOUSEWARMING:'Housewarming', PROPOSAL:'Proposal', THEME_PARTY:'Theme Party',
  PRIVATE_CELEBRATION:'Private Celebration', CUSTOM:'Custom',
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(0)}k`
  return `₹${n}`
}

const EVENT_IMAGE_FALLBACKS: Record<string, string> = {
  WEDDING: '/images/featured/production-wedding.webp',
  BIRTHDAY: '/images/featured/birthday-soiree.webp',
  ANNIVERSARY: '/images/featured/floral-studio.webp',
  ENGAGEMENT: '/images/hero/engagement-ceremony.webp',
  BABY_SHOWER: '/images/featured/floral-studio.webp',
  CORPORATE: '/images/featured/annual-summit.webp',
  CONFERENCE: '/images/featured/annual-summit.webp',
  KIDS_PARTY: '/images/featured/birthday-soiree.webp',
  GRADUATION: '/images/featured/annual-summit.webp',
  HOUSEWARMING: '/images/hero/modern-interior.webp',
  PROPOSAL: '/images/hero/engagement-ceremony.webp',
  THEME_PARTY: '/images/featured/live-music.webp',
  PRIVATE_CELEBRATION: '/images/hero/outdoor-celebration.webp',
  CUSTOM: '/images/featured/product-launch.webp',
}

function eventImageFor(event: Event): string {
  return EVENT_IMAGE_FALLBACKS[event.type] ?? '/images/featured/product-launch.webp'
}

function EventCard({ event, onFavoriteToggle }: { event: Event; onFavoriteToggle?: (id: string) => void }) {
  const fallback = eventImageFor(event)
  const raw = event.heroImages?.[0]
  const src = raw && raw.startsWith('/') ? raw : fallback
  return (
    <article className="group relative flex flex-col overflow-hidden border border-border bg-card transition hover:border-gold/30">
      <Link href={`/events/${event.slug}`} className="block relative aspect-[1.2] overflow-hidden bg-muted">
        <img
          src={src}
          alt={event.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget
            if (img.src.endsWith(fallback)) return
            img.src = fallback
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114]/80 via-transparent to-transparent" />
        {event.isFeatured && (
          <span className="absolute left-3 top-3 bg-gold px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-gold-foreground">Featured</span>
        )}
        {event.averageRating > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/80 px-2 py-1 text-xs">
            <Star className="size-3 fill-gold text-gold-text" />
            <span className="text-foreground">{event.averageRating.toFixed(1)}</span>
            {event.totalReviews > 0 && <span className="text-muted-foreground">({event.totalReviews})</span>}
          </div>
        )}
        <button type="button"
          onClick={e => { e.preventDefault(); onFavoriteToggle?.(event.id) }}
          aria-label="Save event"
          className="absolute right-3 top-3 flex size-8 items-center justify-center border border-white/20 bg-black/40 backdrop-blur-sm transition hover:bg-gold hover:text-gold-foreground hover:border-transparent">
          <Heart className="size-3.5" />
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold-text">
          {event.category?.name ?? TYPE_LABELS[event.type] ?? event.type}
        </p>
        <Link href={`/events/${event.slug}`}>
          <h3 className="mt-1 font-serif text-xl text-foreground transition group-hover:text-gold-text">{event.title}</h3>
        </Link>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          {event.city && <span className="flex items-center gap-1"><MapPin className="size-3" />{event.city}</span>}
          {event.maxGuests && <span className="flex items-center gap-1"><Users className="size-3" />Up to {event.maxGuests}</span>}
        </div>
        {event.isLuxury && (
          <span className="mt-2 inline-block border border-gold/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-gold-text">Luxury</span>
        )}
        <div className="mt-3 flex items-end justify-between border-t border-border-subtle pt-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Starting from</p>
            <p className="text-base font-medium text-foreground">{fmt(event.startingPrice)}</p>
          </div>
          <Link href={`/events/${event.slug}`}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gold-text hover:underline">
            View <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function Skeleton() {
  return <div className="aspect-[1.2] animate-pulse border border-border-subtle bg-muted/60" />
}

/**
 * The results view reads its filters from the query string, so it reads
 * `useSearchParams()`. That hook opts the component out of static prerendering,
 * which Next requires to sit inside a Suspense boundary — hence the thin
 * wrapper below that provides one and a matching skeleton fallback.
 */
function EventsResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state from URL
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [minGuests, setMinGuests] = useState(searchParams.get('minGuests') ?? '')
  const [isLuxury, setIsLuxury] = useState(searchParams.get('isLuxury') === 'true')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? 'createdAt')
  const [page, setPage] = useState(1)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | boolean> = { page, limit: 12 }
      if (search) params.search = search
      if (type) params.type = type
      if (city) params.city = city
      if (minPrice) params.minPrice = Number(minPrice)
      if (maxPrice) params.maxPrice = Number(maxPrice)
      if (minGuests) params.minGuests = Number(minGuests)
      if (isLuxury) params.isLuxury = true
      if (sortBy) params.sortBy = sortBy
      const res = await eventsApi.list(params)
      setEvents(res.data)
      setTotal(res.pagination.total)
      setTotalPages(res.pagination.totalPages)
    } catch {}
    finally { setLoading(false) }
  }, [page, search, type, city, minPrice, maxPrice, minGuests, isLuxury, sortBy])

  useEffect(() => { eventsApi.categories().then(setCategories).catch(() => {}) }, [])
  useEffect(() => { fetchEvents() }, [fetchEvents])

  function clearFilters() {
    setSearch(''); setType(''); setCity(''); setMinPrice(''); setMaxPrice('')
    setMinGuests(''); setIsLuxury(false); setSortBy('createdAt'); setPage(1)
  }

  const hasFilters = search || type || city || minPrice || maxPrice || minGuests || isLuxury

  return (
    <>
      {/* Header */}
      <section className="border-b border-border-subtle bg-card px-5 py-14 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-gold-text">Event inspiration</p>
          <h1 className="font-serif text-5xl tracking-tight text-foreground lg:text-6xl">
            Find your<br /><em className="font-light text-gold-text">perfect event.</em>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            Explore example event ideas, or tell our planners what you have in mind for a customized proposal.
            {total > 0 && ` ${total} experiences available.`}
          </p>
          {/* Search bar */}
          <div className="mt-8 flex max-w-xl gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search weddings, birthdays, venues…"
                className="w-full border border-border bg-muted/60 py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
              />
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border border-l-0 px-5 text-[10px] uppercase tracking-[0.15em] transition ${showFilters ? 'border-gold bg-gold text-gold-foreground' : 'border-border text-muted-foreground hover:border-gold hover:text-gold-text'}`}>
              <SlidersHorizontal className="size-4" /> Filters
              {hasFilters && <span className="flex size-4 items-center justify-center rounded-full bg-gold text-[8px] text-gold-foreground">!</span>}
            </button>
          </div>
          <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-between gap-3 border border-gold/25 bg-gold/5 px-4 py-3">
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold-text" aria-hidden="true" />
              Not sure which direction fits? Get three personalised design ideas first.
            </p>
            <Link
              href="/event-design-assistant"
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gold-text hover:underline"
            >
              Find your design <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Filter panel */}
      {showFilters && (
        <div className="border-b border-border bg-card px-5 py-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="f-type" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Event type</label>
                <select id="f-type" value={type} onChange={e => { setType(e.target.value); setPage(1) }}
                  className="border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none">
                  <option value="">All types</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="f-city" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">City</label>
                <input id="f-city" value={city} onChange={e => { setCity(e.target.value); setPage(1) }} placeholder="Mumbai, Delhi…"
                  className="border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="f-guests" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Min guests</label>
                <input id="f-guests" type="number" value={minGuests} onChange={e => { setMinGuests(e.target.value); setPage(1) }} placeholder="50"
                  className="border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
              </div>
              {/* A "Budget range" label cannot name two controls, so it labels the
                  group and each input carries its own sr-only bound label. */}
              <fieldset className="flex flex-col gap-2">
                <legend className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Budget range</legend>
                <div className="flex gap-2">
                  <label htmlFor="f-min-price" className="sr-only">Minimum budget</label>
                  <input id="f-min-price" type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1) }} placeholder="Min ₹"
                    className="w-1/2 border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
                  <label htmlFor="f-max-price" className="sr-only">Maximum budget</label>
                  <input id="f-max-price" type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1) }} placeholder="Max ₹"
                    className="w-1/2 border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none" />
                </div>
              </fieldset>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={isLuxury} onChange={e => { setIsLuxury(e.target.checked); setPage(1) }}
                  className="accent-gold" />
                Luxury only
              </label>
              <div className="flex items-center gap-2">
                <label htmlFor="f-sort" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Sort</label>
                <select id="f-sort" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}
                  className="border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-gold focus:outline-none">
                  <option value="createdAt">Newest</option>
                  <option value="startingPrice">Price: Low to High</option>
                  <option value="averageRating">Top Rated</option>
                  <option value="viewCount">Most Popular</option>
                </select>
              </div>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive">
                  <X className="size-3" /> Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="border-b border-border-subtle px-5 lg:px-10">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-4">
            <button type="button" onClick={() => { setType(''); setPage(1) }}
              className={`flex-shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition ${!type ? 'bg-gold text-gold-foreground' : 'border border-border text-muted-foreground hover:border-gold hover:text-gold-text'}`}>
              All
            </button>
            {categories.map(cat => (
              <button type="button" key={cat.id} onClick={() => { setType(''); setPage(1) }}
                className="flex-shrink-0 border border-border px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-gold hover:text-gold-text">
                {cat.name}
                {cat._count && <span className="ml-1.5 text-muted-foreground">{cat._count.events}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Search className="mb-4 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No events found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or search terms</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="mt-4 text-xs uppercase tracking-[0.2em] text-gold-text hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{total} events found</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="border border-border px-5 py-2.5 text-xs text-muted-foreground disabled:opacity-30 hover:border-gold hover:text-gold-text">
                  ← Previous
                </button>
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="border border-border px-5 py-2.5 text-xs text-muted-foreground disabled:opacity-30 hover:border-gold hover:text-gold-text">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default function EventsPage() {
  return (
    <SiteShell>
      <SearchParamsBoundary>
        <EventsResults />
      </SearchParamsBoundary>
    </SiteShell>
  )
}
