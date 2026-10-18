'use client'

import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'

/**
 * Final CTA — the visual focus returns to the ambient glow before the last
 * booking action.
 */
export default function FinalCTA() {
  return (
    <section id="start" className="relative scroll-mt-20 overflow-hidden bg-ink-950 px-5 py-28 sm:px-10 lg:py-36">
      {/* Ambient glow + rings */}
      <div aria-hidden="true" className="hero-glow absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2" />
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="size-[54vmin] rounded-full border border-violet/20" />
        <div className="absolute inset-[12%] rounded-full border border-champagne/10" />
      </div>

      <div data-reveal className="relative mx-auto max-w-3xl text-center">
        <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-champagne">Get started today</p>
        <h2 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold tracking-[-0.02em] text-slate-50">
          Your Next Great Event <span className="text-gradient-champagne">Starts Here.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-fg-dim">
          Tell us what you are celebrating. A dedicated planner will shape the venues, design and
          production around you.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/plan-event"
            className="gradient-cta group inline-flex min-h-12 items-center gap-3 px-8 py-4 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-12px_rgba(139,92,246,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
          >
            Start Planning
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>

          <a
            href={siteConfig.contact.phoneHref}
            className="inline-flex min-h-12 items-center gap-3 border border-white/15 bg-white/5 px-7 py-4 text-sm font-medium text-slate-50/90 backdrop-blur-sm transition-colors duration-300 hover:border-violet/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
          >
            <Phone className="size-4" aria-hidden="true" />
            Talk to an expert
          </a>
        </div>
      </div>
    </section>
  )
}
