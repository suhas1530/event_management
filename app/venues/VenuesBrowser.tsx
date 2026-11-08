'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Building2, Loader2, MapPin, Search, Users } from 'lucide-react'
import { eventsApi, type Venue } from '@/lib/api'

const PAGE_SIZE = 12
/** How many catalogue rows we read once to build the city filter list. */
const CITY_FACET_LIMIT = 100

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

const VENUE_FALLBACKS = [
  '/images/venues/banquet-hall.webp',
  '/images/venues/garden-lawn.webp',
  '/images/venues/resort.webp',
  '/images/hero/banquet-hall.webp',
]

function venueImageSrc(venue: Venue): string | null {
  const src = venue.images?.[0]
  if (!src) return null
  if (src.startsWith('/')) return src
  const key = `${venue.name}|${venue.city}|${venue.id}`
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return VENUE_FALLBACKS[hash % VENUE_FALLBACKS.length]
}

/**
 * Venue browser.
 *
 * Reads `GET /events/venues` — the same catalogue the event pages use, filtered
 * server-side by city and search — so a venue shown here is a venue that exists
 * in the database, with its real capacity, city and pricing fields. Nothing is
 * invented: when the catalogue is empty the page says so and points at the
 * planning wizard, where a venue can be sourced against the brief (including
 * spaces not listed yet).
 */
export default function VenuesBrowser() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [city, setCity] = useState('')
  /** Text in the search box, not yet applied. */
  const [search, setSearch] = useState('')
  /** Text actually queried — kept so paging does not lose the filter. */
  const [appliedSearch, setAppliedSearch] = useState('')
  const [knownCities, setKnownCities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async (nextPage: number, nextSearch: string, nextCity: string) => {
    setLoading(true)
    setFailed(false)
    try {
      const params: Record<string, string | number> = { page: nextPage, limit: PAGE_SIZE }
      if (nextSearch.trim()) params.search = nextSearch.trim()
      if (nextCity) params.city = nextCity
      const result = await eventsApi.venues(params)
      setVenues(result.data)
      setTotal(result.pagination.total)
      setPage(result.pagination.page)
      setAppliedSearch(nextSearch)
    } catch {
      setVenues([])
      setTotal(0)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1, '', '')
  }, [load])

  /*
   * City filter options. One wider read builds the list; it is labelled as the
   * cities present in the catalogue rather than presented as an exhaustive
   * coverage claim.
   */
  useEffect(() => {
    let cancelled = false
    eventsApi
      .venues({ limit: CITY_FACET_LIMIT })
      .then(result => {
        if (cancelled) return
        setKnownCities(Array.from(new Set(result.data.map(venue => venue.city).filter(Boolean))).sort())
      })
      .catch(() => {
        if (!cancelled) setKnownCities([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const cities = useMemo(() => {
    const fromResults = venues.map(venue => venue.city).filter(Boolean)
    return Array.from(new Set([...knownCities, ...fromResults])).sort()
  }, [knownCities, venues])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function applyCity(next: string) {
    setCity(next)
    void load(1, appliedSearch, next)
  }

  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-surface-muted/50 px-5 py-14 sm:px-10 lg:py-16">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Venues & banquet halls</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-foreground">
            Find the room your celebration deserves.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-fg-dim">
            Halls, resorts, hotels and outdoor spaces from the live Heptome catalogue, with their real
            capacity and amenities. Shortlist here, then hand the brief to a planner who negotiates and
            confirms the date with you.
          </p>

          <form
            onSubmit={event => {
              event.preventDefault()
              void load(1, search, city)
            }}
            className="mt-8 flex max-w-xl"
            role="search"
          >
            <label className="relative flex-1">
              <span className="sr-only">Search venues</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-mute" aria-hidden="true" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search by venue name or address"
                className="w-full border border-border bg-muted/50 py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-fg-mute focus:border-gold focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center gap-2 border border-gold bg-gold/15 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-gold-text transition-colors hover:bg-gold hover:text-gold-foreground"
            >
              Search
            </button>
          </form>

          {cities.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyCity('')}
                className={`min-h-9 border px-3.5 py-1.5 text-xs transition-colors ${
                  city === '' ? 'border-gold bg-gold/15 text-gold-text' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                All cities
              </button>
              {cities.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applyCity(name)}
                  className={`min-h-9 border px-3.5 py-1.5 text-xs transition-colors ${
                    city === name ? 'border-gold bg-gold/15 text-gold-text' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="bg-background px-5 py-14 sm:px-10 lg:py-16">
        <div className="mx-auto max-w-[1380px]">
          {loading && (
            <div className="flex items-center gap-3 text-sm text-fg-dim">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading the venue catalogue…
            </div>
          )}

          {!loading && venues.length === 0 && (
            <div className="border border-border bg-card p-10 text-center">
              <Building2 className="mx-auto size-10 text-fg-mute" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
                {failed ? 'The venue catalogue is unavailable right now' : 'No venues match these filters yet'}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-fg-dim">
                {failed
                  ? 'We could not reach the events API. Try again in a moment, or send us the brief and a planner will source venues for you.'
                  : 'Nothing in the catalogue matches those filters. Tell us the occasion, city and guest count and a planner will shortlist venues — including spaces not listed here yet.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/plan-event"
                  className="gradient-cta inline-flex min-h-12 items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-primary-foreground"
                >
                  Plan an event
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/events" className="text-sm font-medium text-fg-dim transition-colors hover:text-foreground">
                  Browse the event catalogue
                </Link>
              </div>
            </div>
          )}

          {!loading && venues.length > 0 && (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map(venue => (
                  <li key={venue.id} className="group flex flex-col border border-border bg-card transition-colors hover:border-gold/50">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {venueImageSrc(venue) ? (
                        <Image
                          src={venueImageSrc(venue)!}
                          alt={venue.name}
                          fill
                          loading="lazy"
                          decoding="async"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-fg-mute">
                          <Building2 className="size-8" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-display text-lg font-semibold text-foreground">{venue.name}</h2>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-dim">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {[venue.city, venue.state].filter(Boolean).join(', ') || 'Location on request'}
                        </span>
                        {venue.capacity > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5" aria-hidden="true" />
                            Up to {venue.capacity.toLocaleString('en-IN')} guests
                          </span>
                        )}
                      </p>

                      {venue.amenities?.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {venue.amenities.slice(0, 4).map(amenity => (
                            <li key={amenity} className="border border-border px-2 py-1 text-[11px] text-fg-dim">
                              {amenity}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                        <div>
                          {venue.pricePerDay ? (
                            <>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-fg-mute">Per day from</p>
                              <p className="text-base font-medium text-gold-text">{formatINR(venue.pricePerDay)}</p>
                            </>
                          ) : venue.pricePerHour ? (
                            <>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-fg-mute">Per hour from</p>
                              <p className="text-base font-medium text-gold-text">{formatINR(venue.pricePerHour)}</p>
                            </>
                          ) : (
                            <p className="text-xs text-fg-dim">Pricing on request</p>
                          )}
                        </div>
                        <Link
                          href={`/plan-event?venueName=${encodeURIComponent(venue.name)}${venue.city ? `&venueCity=${encodeURIComponent(venue.city)}` : ''}`}
                          className="inline-flex min-h-11 items-center gap-2 border border-gold/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-text transition-colors hover:bg-gold hover:text-gold-foreground"
                        >
                          Plan here
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Venue pages">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => void load(page - 1, appliedSearch, city)}
                    className="min-h-11 border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-fg-dim transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-fg-mute">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => void load(page + 1, appliedSearch, city)}
                    className="min-h-11 border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-fg-dim transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}

              <p className="mt-8 text-xs leading-5 text-fg-mute">
                Prices are the catalogue&apos;s indicative rates and are confirmed against your date and guest
                count before anything is booked.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
