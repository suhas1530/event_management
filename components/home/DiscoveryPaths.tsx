import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, CalendarHeart, Wrench } from 'lucide-react'
import { brand, verticals } from '@/lib/brand'
import { BOOKABLE_HOME_GROUPS } from '@/lib/catalog'
import { SUPPORTED_CITY } from '@/lib/service-area'
import { HOME_CATEGORIES } from '@/lib/home-content'

const PATHS = [
  {
    id: 'events',
    eyebrow: 'Event management',
    title: verticals.events.heading,
    description:
      'Weddings, birthdays, corporate events and celebrations — briefed, proposed and planned with one team. Nothing is confirmed until you approve the proposal.',
    image: '/images/paths/events.webp',
    alt: 'A long banquet table dressed with flowers, linen and glassware',
    icon: CalendarHeart,
    href: verticals.events.href,
    cta: verticals.events.cta,
    ctaLabel: verticals.events.ctaLabel,
    planHref: verticals.events.planHref,
    chips: HOME_CATEGORIES.slice(0, 4).map(category => category.name),
  },
  {
    id: 'home',
    eyebrow: 'Home services',
    title: verticals.home.heading,
    description:
      'Cleaning, repairs and installations booked by the slot. Pick a service, confirm your pincode and choose a two-hour arrival window.',
    image: '/images/paths/home-services.webp',
    alt: 'A home-service professional cleaning windows in a bright living room',
    icon: Wrench,
    href: verticals.home.href,
    cta: verticals.home.cta,
    ctaLabel: verticals.home.ctaLabel,
    planHref: verticals.home.planHref,
    chips: BOOKABLE_HOME_GROUPS.slice(0, 4).map(group => group.shortName),
  },
]

/**
 * The two discovery paths.
 *
 * Sits directly under the hero so a visitor meets both halves of the platform
 * at the same weight. Each card is photographic, states what it covers, lists
 * real catalogue entries (never invented services) and carries exactly one
 * primary action.
 */
export default function DiscoveryPaths() {
  return (
    <section
      id="paths"
      aria-labelledby="paths-heading"
      className="scroll-mt-20 border-b border-border bg-background px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-gold-text">Where would you like to start?</p>
            <h2
              id="paths-heading"
              className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground"
            >
              {brand.headline}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Two teams, one account. Plan a celebration end to end, or get a vetted professional to your
              door — with the same dashboard tracking both.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Home visits in {SUPPORTED_CITY} · events across India
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {PATHS.map(path => {
            const Icon = path.icon
            return (
              <article
                key={path.id}
               
                className="group relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-neutral-950 p-6 shadow-sm sm:min-h-[560px] sm:p-9"
              >
                <Image
                  src={path.image}
                  alt={path.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,11,0.08)_0%,rgba(8,7,11,0.35)_45%,rgba(8,7,11,0.9)_100%)]"
                />

                <div className="relative">
                  <span className="flex size-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur-sm">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-white/65">{path.eyebrow}</p>
                  <h3 className="mt-2 max-w-lg font-display text-2xl font-semibold text-white sm:text-3xl">
                    {path.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-white/75">{path.description}</p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {path.chips.map(chip => (
                      <li
                        key={chip}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-sm"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <Link
                      href={path.planHref}
                      className="group/cta inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-neutral-950 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                    >
                      {path.ctaLabel}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" />
                    </Link>
                    <Link
                      href={path.href}
                      className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {path.cta}
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
