'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Bug,
  Droplet,
  Droplets,
  Flower2,
  Hammer,
  Laptop,
  Layers,
  Paintbrush2,
  Scissors,
  Shield,
  Sparkles,
  WashingMachine,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { HOME_CATALOG, homeGroupById, type HomeCatalogGroup } from '@/lib/catalog'
import { SUPPORTED_CITY } from '@/lib/service-area'

/** Catalog `icon` names resolved to components — catalogue data stays string-only. */
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

/**
 * Featured doorstep services. Chosen by catalogue id (not by hand-written copy)
 * so a card can never advertise a service the booking API does not recognise.
 */
const FEATURED_IDS = ['cleaning', 'ac-service', 'electrical', 'plumbing', 'pest-control', 'appliance-repair']

const featured = FEATURED_IDS.map(homeGroupById).filter((group): group is HomeCatalogGroup => Boolean(group))

/** Service lines that are advertised but not insta-bookable yet. */
const onRequest = HOME_CATALOG.filter(group => !group.bookingCategory)

/**
 * The home-services half of the homepage.
 *
 * Deliberately light (ivory + lavender + purple) so the two verticals feel like
 * two products from one brand rather than one dark page with a second section
 * bolted on. Every card starts the real slot-based wizard with its category
 * pre-selected; service lines the backend has no booking category for are
 * listed as "on request" and link to the enquiry-first landing page instead.
 */
export default function HomeServicesShowcase() {
  return (
    <section id="home-services" className="surface-ivory scroll-mt-20 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-accent">Home services</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-hept-charcoal">
              Care for every corner.
            </h2>
            <p className="surface-ivory-muted mt-5 text-base leading-7">
              Cleaning, repairs and improvements booked by the slot. Pick a service, confirm your address and
              a two-hour window — the price is agreed before the professional starts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/book/technician"
              className="btn-heptome group inline-flex min-h-12 items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-foreground shadow-[0_10px_30px_-14px_rgba(109,54,216,0.9)] focus-ring-ivory"
            >
              Book a Home Service
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/home-services"
              className="surface-ivory-muted inline-flex min-h-12 items-center gap-2 text-sm font-medium transition-colors hover:text-accent focus-ring-ivory"
            >
              All home services
            </Link>
          </div>
        </div>

        <div data-reveal-group className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(group => {
            const Icon = ICONS[group.icon] ?? Sparkles
            return (
              <Link
                key={group.id}
                data-reveal-item
                href={`/book/technician?category=${group.bookingCategory}`}
                className="panel-ivory group flex flex-col p-6 focus-ring-ivory hover:-translate-y-1"
              >
                <span className="flex size-11 items-center justify-center bg-hept-lavender text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-hept-charcoal">{group.shortName}</h3>
                <p className="surface-ivory-muted mt-2 text-sm leading-6">{group.blurb}</p>

                <ul className="surface-ivory-muted mt-4 flex flex-col gap-1.5 text-xs leading-5">
                  {group.services.slice(0, 3).map(service => (
                    <li key={service.name} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-hept-purple/60" />
                      {service.name}
                    </li>
                  ))}
                </ul>

                <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                  Choose a slot
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>

        {/* Honesty row: service lines we advertise but cannot insta-book yet. */}
        <div data-reveal className="mt-10 border border-hept-line bg-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h3 className="text-sm font-semibold text-hept-charcoal">Also available on request</h3>
            <p className="surface-ivory-muted mt-1.5 text-sm leading-6">
              These service lines are served by appointment with the team rather than an instant slot:
            </p>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
            {onRequest.map(group => (
              <li key={group.id}>
                <Link
                  href={`/home-services#${group.id}`}
                  className="chip-lavender inline-flex px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hept-purple hover:text-white focus-ring-ivory"
                >
                  {group.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="surface-ivory-muted mt-6 text-xs leading-5">
          Doorstep coverage in {SUPPORTED_CITY}. Prices, visit charge and taxes are itemised in the booking
          step, and your pincode is verified before a slot is reserved.
        </p>
      </div>
    </section>
  )
}
