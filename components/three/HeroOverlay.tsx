'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'

/**
 * The hero copy layer that sits above the 3D scene.
 *
 * Every element that should animate in carries `data-hero-reveal`; the hero's
 * GSAP timeline targets them with a stagger. No inline animation here, so the
 * text renders instantly (and stays put) when JS animation is disabled.
 */
export default function HeroOverlay() {
  return (
    <div className="max-w-2xl">
      <p
        data-hero-reveal
        className="mb-6 inline-flex items-center gap-2 border border-violet/30 bg-violet/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-violet-pale"
      >
        Experiences, beautifully executed
      </p>

      <h1 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-slate-50">
        <span data-hero-reveal className="block">
          Make Every
        </span>
        <span data-hero-reveal className="block">
          Moment
        </span>
        <span data-hero-reveal className="block">
          <em className="text-gradient-champagne not-italic">Extraordinary.</em>
        </span>
      </h1>

      <p data-hero-reveal className="mt-6 max-w-xl text-base leading-7 text-fg-dim sm:text-lg">
        Discover, design, and manage unforgettable events with one seamless platform.
      </p>

      <div data-hero-reveal className="pointer-events-auto mt-9 flex flex-wrap items-center gap-4">
        <Link
          href="/plan-event"
          className="gradient-cta group inline-flex min-h-12 items-center gap-3 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_rgba(139,92,246,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
        >
          Plan Your Event
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>

        <a
          href="#experiences"
          className="group inline-flex min-h-12 items-center gap-3 border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-slate-50/90 backdrop-blur-sm transition-colors duration-300 hover:border-violet/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
        >
          Explore Experiences
          <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
