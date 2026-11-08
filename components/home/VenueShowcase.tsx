import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { VENUE_STYLES } from '@/lib/home-content'
import { SUPPORTED_CITY } from '@/lib/service-area'

/**
 * Venue discovery by style.
 *
 * Deliberately not a listing rail: the live catalogue owns real venues,
 * capacities and availability. This section helps a visitor recognise the kind
 * of room they want, then hands them to the catalogue with a clear next step.
 */
export default function VenueShowcase() {
  return (
    <section
      id="venues"
      aria-labelledby="venues-heading"
      className="scroll-mt-20 border-b border-border bg-background px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">
              <MapPin className="size-3.5" aria-hidden="true" />
              Venues & banquet halls
            </p>
            <h2
              id="venues-heading"
              className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground"
            >
              The room is half the story.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Start with the setting — a ballroom, a lawn, a resort — then let a planner match capacity,
              catering and production to it. Real spaces, real availability, no invented packages.
            </p>
          </div>

          <Link
            href="/venues"
            className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse all venues
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {VENUE_STYLES.map((venue, index) => (
            <Link
              key={venue.id}
              href={venue.href}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                index === 0 ? 'min-h-[420px] lg:col-span-2 lg:row-span-2 lg:min-h-[620px]' : 'min-h-[300px]'
              }`}
            >
              <Image
                src={venue.image}
                alt={venue.alt}
                fill
                loading="eager"
                decoding="async"
                sizes={index === 0 ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,11,0.04)_0%,rgba(8,7,11,0.28)_48%,rgba(8,7,11,0.9)_100%)]"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <p className="text-[10px] uppercase tracking-[0.26em] text-white/60">
                  {index === 0 ? `Featured in ${SUPPORTED_CITY}` : 'Venue style'}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
                  {venue.name}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/75">{venue.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  Explore {venue.name.toLowerCase()}
                  <ArrowUpRight
                    className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
