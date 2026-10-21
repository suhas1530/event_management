'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { HOME_CATEGORIES } from '@/lib/home-content'

/**
 * Event category grid. Each card pre-selects its event type in the
 * plan-event wizard, so the click lands on a personalised first step.
 */
export default function CategoryGrid() {
  return (
    <section id="experiences" className="scroll-mt-20 bg-ink-950 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-violet-pale">Explore experiences</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
              Every celebration has a shape. Find yours.
            </h2>
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 text-sm font-medium text-fg-dim transition-colors hover:text-foreground"
          >
            Browse all experiences
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div data-reveal-group className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_CATEGORIES.map(category => (
            <Link
              key={category.name}
              data-reveal-item
              href={`/plan-event?type=${category.type}`}
              className="group relative block aspect-[4/3] overflow-hidden border border-border-subtle transition-colors duration-500 hover:border-violet/50 sm:aspect-[4/5]"
            >
              <Image
                src={category.img}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-2xl font-semibold text-slate-50">{category.name}</h3>
                <p className="mt-1.5 text-sm text-fg-dim">{category.blurb}</p>
                <p className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-pale opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Start planning
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
