import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import ScrollRailButtons from './ScrollRailButtons'
import { HOME_CATEGORIES } from '@/lib/home-content'

/**
 * Event inspiration slider.
 *
 * A native, scroll-snap rail (touch, trackpad and keyboard all work) with
 * explicit arrow buttons for pointer users. Cards pre-select their event type
 * in the planning wizard, so a click lands on a personalised first step.
 */
export default function CategoryGrid() {
  return (
    <section id="experiences" className="scroll-mt-20 border-b border-border bg-surface-muted/50 px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-gold-text">Event inspiration</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground">
              Every celebration has a shape. Find yours.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A starting point, not a template. Choose an occasion and tell the planner what matters to you.
            </p>
          </div>

          <ScrollRailButtons
            targetId="event-inspiration-rail"
            leftLabel="Scroll event inspiration left"
            rightLabel="Scroll event inspiration right"
            step={640}
          />
        </div>

        <ul
          id="event-inspiration-rail"
         
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
          aria-label="Event inspiration"
          tabIndex={0}
        >
          {HOME_CATEGORIES.map(category => (
            <li key={category.name} className="w-[78vw] max-w-[360px] shrink-0 snap-start sm:w-[340px] lg:w-[360px]">
              <Link
                href={`/plan-event?type=${category.type}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Image
                  src={category.img}
                  alt={category.name}
                  fill
                  loading="eager"
                  decoding="async"
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 340px, 78vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/25 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">{category.name}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-white/70">{category.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Start planning
                    <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex justify-end">
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Browse all experiences
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
