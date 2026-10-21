'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bug,
  CalendarCheck,
  Droplet,
  Droplets,
  Flower2,
  Hammer,
  IndianRupee,
  Laptop,
  Layers,
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
import { technicianApi } from '@/lib/api'
import { HOME_CATALOG, type HomeCatalogGroup } from '@/lib/catalog'
import { HOME_STEPS } from '@/lib/home-content'
import { checkCoverage, SERVICE_AREA_NAMES, SUPPORTED_CITY, type CoverageResult } from '@/lib/service-area'
import { useLocation } from '@/lib/location'
import { siteConfig } from '@/lib/site-config'
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
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

/**
 * Home-services landing page.
 *
 * Light and clean (ivory, lavender, purple) — the deliberate counterweight to
 * the cinematic event pages, so the two verticals are visibly different
 * products from one brand.
 *
 * Every fact on this page is real: service names come from `lib/catalog.ts`,
 * prices come from the live technician catalogue, coverage comes from
 * `lib/service-area.ts`, and a service line with no backend booking category is
 * labelled "on request" rather than sold as an instant booking.
 */
export default function HomeServicesLanding() {
  const { location } = useLocation()
  const [pincode, setPincode] = useState('')
  const [coverage, setCoverage] = useState<CoverageResult | null>(null)
  const [proCount, setProCount] = useState<number | null>(null)

  const bookableCategories = useMemo(
    () => HOME_CATALOG.filter(group => group.bookingCategory).map(group => group.bookingCategory as string),
    [],
  )
  const prices = useCategoryPrices(bookableCategories)

  /* Live professional count — never a hard-coded "10,000+". */
  useEffect(() => {
    let cancelled = false
    technicianApi
      .list({ limit: 1 })
      .then(result => {
        if (!cancelled) setProCount(result.pagination.total)
      })
      .catch(() => {
        if (!cancelled) setProCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function verifyCoverage(value: string) {
    setPincode(value)
    setCoverage(value.length === 6 ? checkCoverage({ city: location.city, pincode: value }) : null)
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="surface-ivory px-5 pb-16 pt-14 sm:px-10 sm:pt-20 lg:pb-20">
        <div className="mx-auto grid max-w-[1380px] gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Home services</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-hept-charcoal">
              Expert help at your doorstep.
            </h1>
            <p className="surface-ivory-muted mt-5 max-w-xl text-base leading-7">
              Cleaning, repairs, installation and personal care booked by the slot. Choose the service,
              confirm your address and pick a two-hour window — the amount is agreed before the professional
              starts, and you pay after the work is done.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/book/technician"
                className="btn-heptome inline-flex min-h-12 items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-foreground shadow-[0_12px_34px_-16px_rgba(109,54,216,0.95)] focus-ring-ivory"
              >
                Book a Home Service
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="surface-ivory-muted inline-flex min-h-12 items-center gap-2 text-sm font-medium transition-colors hover:text-accent focus-ring-ivory"
              >
                Talk to the team
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              <div>
                <dt className="surface-ivory-muted text-xs uppercase tracking-[0.16em]">Professionals listed</dt>
                <dd className="mt-1 font-display text-2xl text-hept-charcoal">
                  {proCount === null ? '—' : proCount.toLocaleString('en-IN')}
                </dd>
              </div>
              <div>
                <dt className="surface-ivory-muted text-xs uppercase tracking-[0.16em]">Service lines</dt>
                <dd className="mt-1 font-display text-2xl text-hept-charcoal">{HOME_CATALOG.length}</dd>
              </div>
              <div>
                <dt className="surface-ivory-muted text-xs uppercase tracking-[0.16em]">Doorstep city</dt>
                <dd className="mt-1 font-display text-2xl text-hept-charcoal">{SUPPORTED_CITY}</dd>
              </div>
            </dl>
          </div>

          {/* Coverage checker */}
          <aside className="panel-ivory p-6 sm:p-7">
            <h2 className="flex items-center gap-2 text-base font-semibold text-hept-charcoal">
              <MapPin className="size-4 text-accent" aria-hidden="true" />
              Do we serve your address?
            </h2>
            <p className="surface-ivory-muted mt-2 text-sm leading-6">
              Coverage is decided by pincode. Check yours before you start — the same check runs again in
              the booking step.
            </p>

            <label className="mt-5 block text-xs font-medium text-hept-charcoal">
              Pincode
              <input
                value={pincode}
                onChange={event => verifyCoverage(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="560034"
                aria-describedby="coverage-result"
                className="mt-2 w-full border border-hept-line bg-card px-4 py-3 text-sm text-hept-charcoal outline-none transition focus:border-hept-purple focus-ring-ivory"
              />
            </label>

            <p id="coverage-result" aria-live="polite" className="mt-3 min-h-10 text-sm leading-6">
              {coverage === null && pincode.length < 6 && (
                <span className="surface-ivory-muted">Enter your 6-digit pincode.</span>
              )}
              {coverage?.supported === true && (
                <span className="font-medium text-[#2f6b3a]">
                  Covered — {coverage.area?.name}. Slots can be booked for this pincode.
                </span>
              )}
              {coverage?.supported === false && <span className="font-medium text-[#a4341f]">{coverage.reason}</span>}
            </p>

            {coverage?.supported === true && (
              <Link
                href={`/book/technician?pincode=${pincode}`}
                className="btn-heptome mt-4 inline-flex min-h-11 items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground focus-ring-ivory"
              >
                Start a booking
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}

            <div className="mt-6 border-t border-hept-line pt-5">
              <p className="surface-ivory-muted text-xs uppercase tracking-[0.16em]">Localities we cover</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {SERVICE_AREA_NAMES.map(area => (
                  <li key={area} className="bg-hept-lavender px-2.5 py-1 text-[11px] font-medium text-[#4c1d95]">
                    {area}
                  </li>
                ))}
              </ul>
              <p className="surface-ivory-muted mt-3 text-[11px] leading-5">
                Outside {SUPPORTED_CITY}?{' '}
                <Link href="/contact" className="font-medium text-accent underline underline-offset-2">
                  Tell us where to expand next
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Catalogue ─────────────────────────────────────────────── */}
      <section className="surface-ivory px-5 pb-20 sm:px-10" aria-labelledby="catalogue-heading">
        <div className="mx-auto max-w-[1380px]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-hept-line pt-12">
            <div>
              <h2 id="catalogue-heading" className="font-display text-2xl font-semibold text-hept-charcoal sm:text-3xl">
                What we do at home
              </h2>
              <p className="surface-ivory-muted mt-2 max-w-2xl text-sm leading-6">
                Prices are read live from the booking catalogue. Where a category has no bookable service
                yet, the card says so and offers an enquiry instead.
              </p>
            </div>
            <Link
              href="/book/technician"
              className="surface-ivory-muted inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-accent"
            >
              Open the booking wizard
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_CATALOG.map(group => (
              <ServiceGroupCard key={group.id} group={group} price={group.bookingCategory ? prices[group.bookingCategory] : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="surface-ivory px-5 pb-20 sm:px-10" aria-labelledby="home-steps-heading">
        <div className="mx-auto max-w-[1380px] border-t border-hept-line pt-12">
          <h2 id="home-steps-heading" className="font-display text-2xl font-semibold text-hept-charcoal sm:text-3xl">
            How a Heptome visit runs
          </h2>

          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_STEPS.map(step => (
              <li key={step.step} className="panel-ivory p-6">
                <p className="font-display text-3xl font-semibold text-accent/25">{step.step}</p>
                <h3 className="mt-3 text-base font-semibold text-hept-charcoal">{step.title}</h3>
                <p className="surface-ivory-muted mt-2 text-sm leading-6">{step.description}</p>
              </li>
            ))}
          </ol>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, text: 'Professional profiles are reviewed by our team before they are listed.' },
              { icon: IndianRupee, text: 'The visit charge and taxes are itemised before you confirm anything.' },
              { icon: CalendarCheck, text: 'You choose a two-hour window; you can reschedule from your dashboard.' },
              { icon: Wrench, text: 'Scope is agreed up front — extra work is quoted for approval, never added silently.' },
            ].map(item => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-start gap-3 text-sm leading-6">
                  <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span className="surface-ivory-muted">{item.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────────── */}
      <section className="bg-hept-charcoal px-5 py-16 sm:px-10" aria-labelledby="home-cta-heading">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-6">
          <div>
            <h2 id="home-cta-heading" className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Ready when your home is.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Slots across {SUPPORTED_CITY}. Questions first? Call{' '}
              <a href={siteConfig.contact.phoneHref} className="font-medium text-foreground underline underline-offset-2">
                {siteConfig.contact.phone}
              </a>{' '}
              — {siteConfig.contact.supportHours}.
            </p>
          </div>
          <Link
            href="/book/technician"
            className="btn-heptome inline-flex min-h-12 items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-foreground"
          >
            Book a Home Service
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}

/**
 * One catalogue card.
 *
 * Booking is only offered where the card maps to a real booking category *and*
 * the catalogue has at least one active service for it. Every other state — no
 * category, no services, API unreachable — ends in an enquiry route, which is
 * the honest option: the wizard could not complete for those.
 */
function ServiceGroupCard({ group, price }: { group: HomeCatalogGroup; price?: CategoryPriceState }) {
  const Icon = ICONS[group.icon] ?? Sparkles
  const bookable = Boolean(group.bookingCategory) && typeof price === 'number'
  const awaitingCatalogue = Boolean(group.bookingCategory) && (price === undefined || price === 'empty')

  return (
    <article className="panel-ivory flex flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-11 items-center justify-center bg-hept-lavender text-accent">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {typeof price === 'number' && (
          <span className="text-right">
            <span className="surface-ivory-muted block text-[10px] uppercase tracking-[0.16em]">From</span>
            <span className="font-display text-lg font-semibold text-hept-charcoal">{formatINR(price)}</span>
          </span>
        )}
        {price === null && group.bookingCategory && (
          <span className="surface-ivory-muted text-[10px] uppercase tracking-[0.16em]">Checking price…</span>
        )}
        {price === 'error' && (
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#a4341f]">Price unavailable</span>
        )}
        {!group.bookingCategory && (
          <span className="bg-hept-lavender px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#4c1d95]">
            On request
          </span>
        )}
        {awaitingCatalogue && (
          <span className="border border-hept-line px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8a5a2b]">
            Booking opening soon
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-hept-charcoal">{group.name}</h3>
      <p className="surface-ivory-muted mt-2 text-sm leading-6">{group.blurb}</p>

      <ul className="surface-ivory-muted mt-4 flex flex-col gap-1.5 text-xs leading-5">
        {group.services.map(service => (
          <li key={service.name} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-hept-purple/60" />
            {service.name}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {bookable ? (
          <Link
            href={`/book/technician?category=${group.bookingCategory}`}
            className="btn-heptome inline-flex min-h-11 items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground focus-ring-ivory"
          >
            Book a slot
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center gap-2 border border-hept-purple px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-hept-purple hover:text-white focus-ring-ivory"
          >
            Enquire
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
        <Link
          href="/book/technician"
          className="surface-ivory-muted inline-flex min-h-11 items-center text-xs font-medium transition-colors hover:text-accent focus-ring-ivory"
        >
          See all services
        </Link>
      </div>
    </article>
  )
}
