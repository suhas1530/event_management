'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, CalendarHeart, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { brand, verticals } from '@/lib/brand'
import { SUPPORTED_CITY } from '@/lib/service-area'
import type { WorldZone } from '@/components/three/HeptomeWorld'

interface HeroOverlayProps {
  /** Wing of the 3D world the visitor is looking at. */
  zone: WorldZone
  onZoneChange: (zone: WorldZone) => void
}

/**
 * Hero copy layer.
 *
 * Two equally clear entry points — one per vertical — sit on top of the world
 * scene. Every element that should animate in carries `data-hero-reveal`, which
 * the hero's GSAP timeline targets with a stagger; without JS the copy simply
 * renders in place.
 */
export default function HeroOverlay({ zone, onZoneChange }: HeroOverlayProps) {
  return (
    <div className="max-w-2xl">
      <p
        data-hero-reveal
        className="mb-6 inline-flex items-center gap-2 border border-hept-gold/30 bg-hept-gold/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-champagne-light"
      >
        {brand.promise}
      </p>

      <h1 className="font-display text-[clamp(2.4rem,6.4vw,5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-slate-50">
        <span data-hero-reveal className="block">
          Celebrate Every Moment.
        </span>
        <span data-hero-reveal className="block">
          <em className="text-gradient-champagne not-italic">Care for Every Corner.</em>
        </span>
      </h1>

      <p data-hero-reveal className="mt-6 max-w-xl text-base leading-7 text-fg-dim sm:text-lg">
        {brand.heroSupport}
      </p>

      {/* Zone control: moves the camera in the living world and re-points the
          booking panel, so the two halves of the platform are both one tap away. */}
      <div
        data-hero-reveal
        className="pointer-events-auto mt-7 inline-flex border border-white/12 bg-white/[0.04] p-1 backdrop-blur-sm"
        role="group"
        aria-label="Choose what to explore"
      >
        {(
          [
            { id: 'celebration' as const, label: verticals.events.label, icon: CalendarHeart },
            { id: 'home' as const, label: verticals.home.label, icon: Wrench },
          ]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onZoneChange(id)}
            aria-pressed={zone === id}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale',
              zone === id ? 'bg-hept-purple text-white' : 'text-white/60 hover:text-white'
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div data-hero-reveal className="pointer-events-auto mt-7 flex flex-wrap items-center gap-4">
        <Link
          href={verticals.events.planHref}
          className="gradient-cta group inline-flex min-h-12 items-center gap-3 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(109,54,216,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_rgba(109,54,216,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
        >
          {verticals.events.ctaLabel}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>

        <Link
          href={verticals.home.href}
          className="group inline-flex min-h-12 items-center gap-3 border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-slate-50/90 backdrop-blur-sm transition-colors duration-300 hover:border-hept-gold/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
        >
          {verticals.home.ctaLabel}
          <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
        </Link>
      </div>

      <p data-hero-reveal className="mt-5 text-xs leading-5 text-fg-mute">
        Doorstep services in {SUPPORTED_CITY} today · event partners across India
      </p>
    </div>
  )
}
