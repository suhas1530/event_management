'use client'

import Link from 'next/link'
import { ArrowUpRight, Handshake, Wrench } from 'lucide-react'

const PARTNER_PATHS = [
  {
    id: 'professional',
    icon: Wrench,
    title: 'Become a Professional',
    copy: 'Cleaning crews, electricians, plumbers, carpenters, technicians and stylists serving homes in Bengaluru.',
    href: '/become-a-professional',
    cta: 'Apply as a professional',
  },
  {
    id: 'event-partner',
    icon: Handshake,
    title: 'Become an Event Partner',
    copy: 'Venues, banquet halls, caterers, decorators, photographers, planners and production teams across India.',
    href: '/become-an-event-partner',
    cta: 'Partner with Heptome',
  },
]

/**
 * Partner band.
 *
 * Both supply-side journeys sit in one slim section so the homepage keeps a
 * single, equal-weight entry point per vertical and the recruitment paths stay
 * one tap away without competing with the customer CTAs.
 */
export default function PartnerBand() {
  return (
    <section className="border-y border-hairline/60 bg-ink-900/40 px-5 py-14 sm:px-10">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal-group className="grid gap-4 lg:grid-cols-2">
          {PARTNER_PATHS.map(path => {
            const Icon = path.icon
            return (
              <Link
                key={path.id}
                data-reveal-item
                href={path.href}
                className="group flex items-start gap-5 border border-white/8 bg-ink-950/60 p-6 transition-colors duration-300 hover:border-violet/40 hover:bg-ink-800/60"
              >
                <span className="flex size-11 shrink-0 items-center justify-center border border-violet/25 bg-violet/10 text-violet-pale">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="flex items-start justify-between gap-4">
                    <span className="text-base font-medium text-slate-50">{path.title}</span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-fg-mute transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-pale"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-fg-dim">{path.copy}</span>
                  <span className="mt-3 block text-[11px] font-medium uppercase tracking-[0.16em] text-violet-pale">
                    {path.cta}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
