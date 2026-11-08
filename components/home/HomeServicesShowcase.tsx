import Image from 'next/image'
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
import ScrollRailButtons from './ScrollRailButtons'
import { HOME_CATALOG, homeGroupById, type HomeCatalogGroup } from '@/lib/catalog'
import { HOME_SERVICE_IMAGES } from '@/lib/home-content'
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
const FEATURED_IDS = ['cleaning', 'ac-service', 'electrical', 'plumbing', 'carpentry', 'painting']

const featured = FEATURED_IDS.map(homeGroupById).filter((group): group is HomeCatalogGroup => Boolean(group))

/** Service lines that are advertised but not insta-bookable yet. */
const onRequest = HOME_CATALOG.filter(group => !group.bookingCategory)

/**
 * The home-services half of the homepage.
 *
 * A horizontal rail of real catalogue services, each with licensed photography
 * and a link into the slot-based wizard with its category pre-selected.
 */
export default function HomeServicesShowcase() {
  return (
    <section id="home-services" className="surface-ivory scroll-mt-20 border-b border-border px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-primary">Home services</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground">
              Care for every corner.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Cleaning, repairs and improvements booked by the slot. Pick a service, confirm your address and
              a two-hour window — the price is agreed before the professional starts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/book/technician"
              className="group inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted"
            >
              Book a home service
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/home-services"
              className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              All home services
            </Link>
          </div>
        </div>

        <ScrollRailButtons
          targetId="home-services-rail"
          leftLabel="Scroll home services left"
          rightLabel="Scroll home services right"
          className="mb-4 justify-end"
          buttonClassName="bg-card"
        />

        <ul
          id="home-services-rail"
         
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
          aria-label="Featured home services"
          tabIndex={0}
        >
          {featured.map(group => {
            const Icon = ICONS[group.icon] ?? Sparkles
            const image = HOME_SERVICE_IMAGES[group.id]
            return (
              <li
                key={group.id}
               
                className="w-[82vw] max-w-[400px] shrink-0 snap-start sm:w-[340px] lg:w-[360px]"
              >
                <Link
                  href={`/book/technician?category=${group.bookingCategory}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        loading="eager"
                        decoding="async"
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 340px, 82vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-muted-foreground">
                        <Icon className="size-8" aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-lg bg-background/90 text-primary shadow-sm backdrop-blur-sm">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold text-foreground">{group.shortName}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.blurb}</p>

                    <ul className="mt-4 flex flex-col gap-1.5 text-xs leading-5 text-muted-foreground">
                      {group.services.slice(0, 3).map(service => (
                        <li key={service.name} className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-primary/60" />
                          {service.name}
                        </li>
                      ))}
                    </ul>

                    <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Choose a slot
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Honesty row: service lines we advertise but cannot insta-book yet. */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Also available on request</h3>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              These service lines are served by appointment with the team rather than an instant slot:
            </p>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
            {onRequest.map(group => (
              <li key={group.id}>
                <Link
                  href={`/home-services#${group.id}`}
                  className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {group.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Doorstep coverage in {SUPPORTED_CITY}. Prices, visit charge and taxes are itemised in the booking
          step, and your pincode is verified before a slot is reserved.
        </p>
      </div>
    </section>
  )
}
