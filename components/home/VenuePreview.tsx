'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Check, Move3d } from 'lucide-react'
import SceneFallback from '@/components/three/SceneFallback'
import { useInView, usePrefersReducedMotion, useQualityTier, useWebGLAvailable } from '@/lib/motion'

const EventScene = dynamic(() => import('@/components/three/EventScene'), {
  ssr: false,
  loading: () => <SceneFallback />,
})

const FEATURES = [
  'Modern stage architecture with ceremonial arches',
  'Tunable violet and champagne lighting rigs',
  'Concert-grade sound and LED backdrops',
  'Capacity from intimate 60-guest rooms to 2,000-seat halls',
]

/**
 * Venue exploration section.
 *
 * The interactive canvas is deferred twice: it is code-split, and it only
 * mounts once the panel scrolls near the viewport. Before that — and on
 * reduced-motion / no-WebGL devices — the venue still shows as a photograph.
 */
export default function VenuePreview() {
  const [wrapperRef, inView] = useInView<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const webgl = useWebGLAvailable()
  const tier = useQualityTier()

  const showScene = webgl === true && !reduced && inView

  return (
    <section id="venue" className="scroll-mt-20 bg-ink-950 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1380px] items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        <div data-reveal>
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-champagne">Venue exploration</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
            Step inside before you step in.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-fg-dim">
            Preview the stage, lighting and room while you plan. Our venues are scouted in person,
            then rebuilt here so you can explore every angle.
          </p>

          <ul className="mt-8 flex flex-col gap-3.5">
            {FEATURES.map(feature => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-fg-dim">
                <Check className="mt-1 size-4 shrink-0 text-violet-pale" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div ref={wrapperRef} className="relative">
          <div className="relative aspect-[16/10] overflow-hidden border border-hairline bg-ink-900">
            {showScene ? (
              <EventScene controls quality={tier} interactive={false} />
            ) : (
              <Image
                src="/venue-hero.png"
                alt="Stage and venue preview"
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover opacity-90"
              />
            )}

            {showScene && (
              <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 border border-white/15 bg-ink-950/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-fg-dim backdrop-blur-sm">
                <Move3d className="size-3.5 text-violet-pale" aria-hidden="true" />
                Drag to explore
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
