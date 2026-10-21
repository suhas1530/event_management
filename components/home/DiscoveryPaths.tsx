'use client'

import Link from 'next/link'
import { ArrowRight, CalendarHeart, Wrench } from 'lucide-react'
import { brand, verticals } from '@/lib/brand'
import { BOOKABLE_HOME_GROUPS } from '@/lib/catalog'
import { SUPPORTED_CITY } from '@/lib/service-area'
import { HOME_CATEGORIES } from '@/lib/home-content'

/**
 * The two discovery paths.
 *
 * Sits directly under the hero so a visitor who does not use the 3D switcher
 * still meets both halves of the platform at the same weight: one warm, dark
 * card for events and one light ivory card for home services. Each card states
 * what it covers, lists real catalogue entries (never invented services) and
 * carries exactly one primary action, so neither vertical can be mistaken for a
 * secondary feature of the other.
 */
export default function DiscoveryPaths() {
  const homeChips = BOOKABLE_HOME_GROUPS.slice(0, 4)
  const eventChips = HOME_CATEGORIES.slice(0, 4)

  return (
    <section
      id="paths"
      aria-labelledby="paths-heading"
      className="scroll-mt-20 border-b border-hairline/60 bg-ink-950 px-5 py-20 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="mb-12 max-w-2xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-violet-pale">Where would you like to start?</p>
          <h2
            id="paths-heading"
            className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50"
          >
            {brand.headline}
          </h2>
          <p className="mt-5 text-base leading-7 text-fg-dim">
            Two teams, one account. Plan a celebration end to end, or get a vetted professional to your
            door — with the same dashboard tracking both.
          </p>
        </div>

        <div data-reveal-group className="grid gap-5 lg:grid-cols-2">
          {/* ── Events ─────────────────────────────────────────────── */}
          <article
            data-reveal-item
            className="group relative flex flex-col overflow-hidden border border-hairline bg-ink-900/60 p-7 transition-colors duration-300 hover:border-champagne/45 sm:p-9"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(213,174,121,0.18)_0%,rgba(8,9,13,0)_70%)]"
            />
            <span className="relative flex size-12 items-center justify-center border border-champagne/30 bg-champagne/10 text-champagne">
              <CalendarHeart className="size-5" aria-hidden="true" />
            </span>
            <h3 className="relative mt-6 font-display text-2xl font-semibold text-slate-50 sm:text-3xl">
              {verticals.events.heading}
            </h3>
            <p className="relative mt-3 max-w-lg text-sm leading-7 text-fg-dim">
              {verticals.events.description} Every enquiry is a conversation: share the date and the guest
              count, compare real options, and approve the plan before anything is booked.
            </p>

            <ul className="relative mt-6 flex flex-wrap gap-2">
              {eventChips.map(chip => (
                <li
                  key={chip.type}
                  className="border border-border bg-muted/50 px-3 py-1.5 text-xs text-fg-dim"
                >
                  {chip.name}
                </li>
              ))}
            </ul>

            <div className="relative mt-8 flex flex-wrap items-center gap-4 pt-1">
              <Link
                href={verticals.events.planHref}
                className="btn-heptome gradient-cta group/cta inline-flex min-h-12 items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-foreground transition-transform duration-300 hover:-translate-y-0.5"
              >
                {verticals.events.ctaLabel}
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={verticals.events.href}
                className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-fg-dim transition-colors hover:text-foreground"
              >
                {verticals.events.cta}
              </Link>
            </div>
          </article>

          {/* ── Home services ──────────────────────────────────────── */}
          <article
            data-reveal-item
            className="surface-ivory relative flex flex-col overflow-hidden p-7 sm:p-9"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(109,54,216,0.14)_0%,rgba(250,248,244,0)_70%)]"
            />
            <span className="relative flex size-12 items-center justify-center rounded-none bg-hept-lavender text-accent">
              <Wrench className="size-5" aria-hidden="true" />
            </span>
            <h3 className="relative mt-6 font-display text-2xl font-semibold text-hept-charcoal sm:text-3xl">
              {verticals.home.heading}
            </h3>
            <p className="surface-ivory-muted relative mt-3 max-w-lg text-sm leading-7">
              {verticals.home.description} Pick a service, confirm your address and choose a two-hour slot —
              the professional arrives with the price already agreed.
            </p>

            <ul className="relative mt-6 flex flex-wrap gap-2">
              {homeChips.map(chip => (
                <li key={chip.id} className="chip-lavender px-3 py-1.5 text-xs font-medium">
                  {chip.shortName}
                </li>
              ))}
            </ul>

            <div className="relative mt-8 flex flex-wrap items-center gap-4 pt-1">
              <Link
                href={verticals.home.planHref}
                className="btn-heptome group/cta inline-flex min-h-12 items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-foreground shadow-[0_10px_30px_-14px_rgba(109,54,216,0.9)] focus-ring-ivory"
              >
                {verticals.home.ctaLabel}
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={verticals.home.href}
                className="surface-ivory-muted inline-flex min-h-12 items-center gap-2 text-sm font-medium transition-colors hover:text-accent focus-ring-ivory"
              >
                {verticals.home.cta}
              </Link>
            </div>

            <p className="surface-ivory-muted relative mt-6 text-xs leading-5">
              Doorstep coverage in {SUPPORTED_CITY} — your pincode is checked before a slot is reserved.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
