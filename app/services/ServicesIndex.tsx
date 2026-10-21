'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Bug,
  CalendarHeart,
  Camera,
  ChevronDown,
  Droplet,
  Droplets,
  Flower2,
  Hammer,
  Laptop,
  Layers,
  Lightbulb,
  Mail,
  MapPin,
  Music,
  Package,
  Paintbrush2,
  Scissors,
  Search,
  Shield,
  Sparkles,
  Utensils,
  WashingMachine,
  Wind,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import SearchParamsBoundary from '@/components/layout/SearchParamsBoundary'
import { EVENT_SERVICE_CATEGORIES, HOME_CATALOG, type HomeCatalogGroup } from '@/lib/catalog'
import { useCategoryPrices, type CategoryPriceState } from '@/lib/use-category-prices'

const ICONS: Record<string, LucideIcon> = {
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
  MapPin,
  Utensils,
  Lightbulb,
  Camera,
  Music,
  Mail,
  Package,
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

/** Event types the catalogue understands, with words a customer might type. */
const EVENT_TYPES = [
  { label: 'Weddings', type: 'WEDDING', keywords: ['wedding', 'shaadi', 'marriage'] },
  { label: 'Engagements', type: 'ENGAGEMENT', keywords: ['engagement', 'ring'] },
  { label: 'Birthdays', type: 'BIRTHDAY', keywords: ['birthday', 'cake'] },
  { label: 'Anniversaries', type: 'ANNIVERSARY', keywords: ['anniversary'] },
  { label: 'Corporate events', type: 'CORPORATE', keywords: ['corporate', 'office', 'company'] },
  { label: 'Conferences', type: 'CONFERENCE', keywords: ['conference', 'seminar', 'summit'] },
  { label: 'Product launches', type: 'PRODUCT_LAUNCH', keywords: ['launch'] },
  { label: 'College events', type: 'COLLEGE_EVENT', keywords: ['college', 'campus', 'fest'] },
  { label: 'Concerts & live events', type: 'OTHER', keywords: ['concert', 'live', 'show'] },
  { label: 'Housewarmings', type: 'HOUSEWARMING', keywords: ['housewarming', 'griha'] },
] as const

type Section = 'home' | 'event'

/**
 * All-services index.
 *
 * One page, two catalogues, zero invented facts. Service names come from
 * `lib/catalog.ts`; home-service prices come from the live booking catalogue
 * (via `useCategoryPrices`); and every card's action starts a workflow the
 * backend can actually complete:
 *
 *   bookable category      → the technician booking wizard
 *   advertised, no booking → an enquiry (the wizard could not finish)
 *   event service line     → the planning wizard with that group highlighted
 *   event type             → the filtered event catalogue
 *
 * The search box routes the query to whichever flow matches it, which is what
 * the previous version of this page tried to do with a hand-written list of
 * prices, ratings and job counts that the database never backed.
 */
function ServicesIndexInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [section, setSection] = useState<Section>('home')
  const [expanded, setExpanded] = useState<string | null>(null)

  const bookableCategories = useMemo(
    () => HOME_CATALOG.filter(group => group.bookingCategory).map(group => group.bookingCategory as string),
    [],
  )
  const prices = useCategoryPrices(bookableCategories)

  const normalised = query.trim().toLowerCase()

  const homeResults = normalised
    ? HOME_CATALOG.filter(
        group =>
          group.name.toLowerCase().includes(normalised) ||
          group.shortName.toLowerCase().includes(normalised) ||
          group.blurb.toLowerCase().includes(normalised) ||
          group.services.some(service => service.name.toLowerCase().includes(normalised)),
      )
    : HOME_CATALOG

  const eventResults = normalised
    ? EVENT_SERVICE_CATEGORIES.filter(
        service =>
          service.name.toLowerCase().includes(normalised) ||
          service.blurb.toLowerCase().includes(normalised) ||
          service.wizardGroup.toLowerCase().includes(normalised),
      )
    : EVENT_SERVICE_CATEGORIES

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    if (!normalised) return

    // Event type names win first: they have a dedicated filtered catalogue.
    const eventType = EVENT_TYPES.find(type => type.label.toLowerCase().includes(normalised) || type.keywords.some(word => word.includes(normalised)))
    if (eventType) {
      router.push(`/events?type=${eventType.type}`)
      return
    }
    const home = homeResults[0]
    const eventService = eventResults[0]

    const homeTarget = home
      ? home.bookingCategory
        ? `/book/technician?category=${home.bookingCategory}`
        : `/home-services#${home.id}`
      : null
    const eventTarget = eventService
      ? `/plan-event?service=${encodeURIComponent(eventService.wizardGroup)}`
      : null

    /*
     * The selected family answers first. `cleaning` is a home service *and* a
     * line item of the event "Other" group, so a flat precedence rule sent
     * customers to the wrong wizard; the other catalogue is only consulted when
     * the selected one has never heard of the query.
     */
    const target = section === 'home' ? homeTarget ?? eventTarget : eventTarget ?? homeTarget
    if (target) {
      router.push(target)
      return
    }
    router.push(`/events?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="immersive bg-ink-950">
      <section className="border-b border-hairline/60 bg-ink-900/40 px-5 py-14 sm:px-10 lg:py-16">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-champagne">All services</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-slate-50">
            Every service, one place.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-fg-dim">
            Celebrations and home care under one roof. Search below, or pick the half of Heptome you need —
            each card starts the workflow that actually completes that service.
          </p>

          <form onSubmit={submitSearch} className="mt-8 flex max-w-xl" role="search">
            <label className="relative flex-1">
              <span className="sr-only">Search services</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-mute" aria-hidden="true" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Try “plumber”, “catering”, “wedding”…"
                className="w-full border border-border bg-muted/50 py-3.5 pl-11 pr-10 text-sm text-foreground placeholder:text-fg-mute focus:border-champagne focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-mute transition-colors hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center border border-champagne bg-champagne/15 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-champagne-light transition-colors hover:bg-champagne hover:text-ink-950"
            >
              Search
            </button>
          </form>

          <div role="group" aria-label="Choose a service family" className="mt-6 inline-flex border border-border bg-muted/50 p-1">
            {([
              { id: 'home' as const, label: 'Home services', icon: Wrench },
              { id: 'event' as const, label: 'Event services', icon: CalendarHeart },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                aria-pressed={section === id}
                className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale ${
                  section === id ? 'bg-hept-purple text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="bg-ink-950 px-5 py-14 sm:px-10 lg:py-16">
        <div className="mx-auto max-w-[1380px]">
          {section === 'home' && (
            <>
              <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-50">Home services</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-dim">
                    Prices shown are the cheapest active service in each category, read live from the booking
                    catalogue. The visit charge and taxes are itemised before you confirm.
                  </p>
                </div>
                <Link href="/home-services" className="inline-flex items-center gap-2 text-sm font-medium text-fg-dim transition-colors hover:text-foreground">
                  Home services hub
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </header>

              {homeResults.length === 0 ? (
                <NoMatch query={query} onClear={() => setQuery('')} />
              ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {homeResults.map(group => (
                    <HomeServiceCard
                      key={group.id}
                      group={group}
                      price={group.bookingCategory ? prices[group.bookingCategory] : undefined}
                      expanded={expanded === group.id}
                      onToggle={() => setExpanded(expanded === group.id ? null : group.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {section === 'event' && (
            <>
              <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-50">Event services</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-dim">
                    Event work is quoted per brief, so nothing here carries a price. Each line opens the
                    planning wizard with that area of interest highlighted.
                  </p>
                </div>
                <Link href="/events" className="inline-flex items-center gap-2 text-sm font-medium text-fg-dim transition-colors hover:text-foreground">
                  Event catalogue
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </header>

              {eventResults.length === 0 ? (
                <NoMatch query={query} onClear={() => setQuery('')} />
              ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {eventResults.map(service => {
                    const Icon = ICONS[service.icon] ?? Sparkles
                    return (
                      <Link
                        key={service.id}
                        href={`/plan-event?service=${encodeURIComponent(service.wizardGroup)}`}
                        className="group flex flex-col border border-white/8 bg-ink-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-champagne/40 hover:bg-ink-800/70"
                      >
                        <span className="flex size-11 items-center justify-center border border-champagne/25 bg-champagne/10 text-champagne">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="mt-5 text-base font-medium text-slate-50">{service.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-fg-dim">{service.blurb}</p>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-champagne">
                          Open the planner
                          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}

              <div className="mt-12 border-t border-hairline/60 pt-8">
                <h3 className="text-sm font-semibold text-slate-50">Browse by occasion</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {EVENT_TYPES.map(type => (
                    <li key={type.type}>
                      <Link
                        href={`/events?type=${type.type}`}
                        className="inline-flex min-h-9 items-center border border-border px-3.5 py-1.5 text-xs text-fg-dim transition-colors hover:border-champagne/40 hover:text-champagne"
                      >
                        {type.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function NoMatch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="mt-8 border border-white/8 bg-ink-900/50 p-10 text-center">
      <Search className="mx-auto size-9 text-fg-mute" aria-hidden="true" />
      <h3 className="mt-4 font-display text-lg font-semibold text-slate-50">No match for “{query}”</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-fg-dim">
        Try a shorter word, or tell us what you need and the team will point you the right way.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={onClear} className="text-sm font-medium text-champagne underline underline-offset-2">
          Clear the search
        </button>
        <Link href="/contact" className="text-sm font-medium text-fg-dim transition-colors hover:text-foreground">
          Ask the team
        </Link>
      </div>
    </div>
  )
}

/**
 * Home-service card.
 *
 * The action depends on what the backend can actually do: bookable categories
 * open the wizard, and everything else routes to an enquiry. Prices are never
 * filled in by hand — a category with no catalogue entry says so.
 */
function HomeServiceCard({
  group,
  price,
  expanded,
  onToggle,
}: {
  group: HomeCatalogGroup
  price?: CategoryPriceState
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = ICONS[group.icon] ?? Sparkles
  const bookable = Boolean(group.bookingCategory) && typeof price === 'number'
  const openingSoon = Boolean(group.bookingCategory) && (price === undefined || price === 'empty')

  return (
    <article className="flex flex-col border border-white/10 bg-ink-900/50 p-6 transition-colors hover:border-hept-purple/50">
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-11 items-center justify-center bg-hept-purple/15 text-violet-pale">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {typeof price === 'number' && (
          <span className="text-right">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-fg-mute">From</span>
            <span className="font-display text-lg font-semibold text-champagne-light">{formatINR(price)}</span>
          </span>
        )}
        {price === null && group.bookingCategory && (
          <span className="text-[10px] uppercase tracking-[0.16em] text-fg-mute">Checking price…</span>
        )}
        {price === 'error' && <span className="text-[10px] uppercase tracking-[0.16em] text-[#e7a48c]">Price unavailable</span>}
        {!group.bookingCategory && (
          <span className="rounded-none bg-hept-lavender px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#4c1d95]">
            On request
          </span>
        )}
        {openingSoon && (
          <span className="border border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-fg-dim">
            Opening soon
          </span>
        )}
      </div>

      <h3 className="mt-5 text-base font-medium text-slate-50">{group.name}</h3>
      <p className="mt-2 text-sm leading-6 text-fg-dim">{group.blurb}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {bookable ? (
          <Link
            href={`/book/technician?category=${group.bookingCategory}`}
            className="btn-heptome inline-flex min-h-11 items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
          >
            Book
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center gap-2 border border-hept-purple px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-violet-pale transition-colors hover:bg-hept-purple hover:text-white"
          >
            Enquire
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="inline-flex min-h-11 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim transition-colors hover:text-foreground"
        >
          {expanded ? 'Hide services' : `All ${group.services.length} services`}
          <ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {expanded && (
        <ul className="mt-4 flex flex-col gap-1.5 border-t border-border-subtle pt-4 text-xs leading-5 text-fg-dim">
          {group.services.map(service => (
            <li key={service.name} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-hept-purple/70" />
              {service.name}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/**
 * Reads the query string via `useSearchParams()`, so it must render inside a
 * Suspense boundary to stay statically prerenderable.
 */
export default function ServicesIndex() {
  return (
    <SearchParamsBoundary>
      <ServicesIndexInner />
    </SearchParamsBoundary>
  )
}
