'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  Flower2,
  Lightbulb,
  Mail,
  MapPin,
  Music,
  Package,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { EVENT_SERVICE_CATEGORIES } from '@/lib/catalog'

/** Catalog `icon` names resolved to components — catalogue data stays string-only. */
const ICONS: Record<string, LucideIcon> = {
  MapPin,
  Utensils,
  Flower2,
  Lightbulb,
  Camera,
  Music,
  Mail,
  Sparkles,
  Package,
}

/**
 * Event service lines.
 *
 * Every card pre-selects its area of interest in the planning wizard
 * (`?service=` maps to a `SERVICE_GROUPS` key), so clicking "Catering" lands on
 * the wizard with catering already ticked. Nothing here quotes a price: event
 * work is quoted per brief, and the wizard is where the brief is captured.
 */
export default function ServicesSection() {
  return (
    <section id="event-services" className="scroll-mt-20 bg-ink-950 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-champagne">Event services</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
              Everything your celebration needs.
            </h2>
            <p className="mt-5 text-sm leading-7 text-fg-dim">
              Venues, catering, décor, production and planning — coordinated by one team and priced per
              brief, so you approve the plan before you commit.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-fg-dim transition-colors hover:text-foreground"
          >
            Browse the catalogue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div data-reveal-group className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_SERVICE_CATEGORIES.map(service => {
            const Icon = ICONS[service.icon] ?? Sparkles
            return (
              <Link
                key={service.id}
                data-reveal-item
                href={`/plan-event?service=${encodeURIComponent(service.wizardGroup)}`}
                className="group flex flex-col border border-white/8 bg-ink-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-champagne/40 hover:bg-ink-800/70"
              >
                <span className="flex size-11 items-center justify-center border border-champagne/25 bg-champagne/10 text-champagne">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-medium text-slate-50">{service.name}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-dim">{service.blurb}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-champagne opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Add to your plan
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
