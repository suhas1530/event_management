'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Move3d, Sparkles, Wrench } from 'lucide-react'
import SceneFallback from '@/components/three/SceneFallback'
import { cn } from '@/lib/utils'
import { useInView, usePrefersReducedMotion, useQualityTier, useWebGLAvailable } from '@/lib/motion'
import type { WorldZone } from '@/components/three/HeptomeWorld'

const HeptomeWorld = dynamic(() => import('@/components/three/HeptomeWorld'), {
  ssr: false,
  loading: () => <SceneFallback />,
})

const WINGS: { id: WorldZone; label: string; blurb: string; points: string[] }[] = [
  {
    id: 'celebration',
    label: 'Celebration hall',
    blurb:
      'The event wing: stage architecture, arches, banquet seating and tunable champagne lighting — the room your brief is designed against.',
    points: [
      'Stage, arches and seating laid out to scale',
      'Lighting and décor treatments you can preview before the build',
      'Venue options matched to your guest list and city',
    ],
  },
  {
    id: 'home',
    label: 'Home wing',
    blurb:
      'The doorstep wing: a daylit home with a kitchen run and a service corner where the professional works — what a Heptome visit looks like.',
    points: [
      'Cleaning, repair and installation slots booked by the hour',
      'Tools and materials carried by the assigned professional',
      'Work checked against the agreed scope before you pay',
    ],
  },
]

/**
 * The living world, revisited as an explorable preview.
 *
 * The same HeptomeWorld that runs behind the hero is re-mounted here in preview
 * mode: the camera orbits the wing you pick instead of following a scroll
 * story. Like the hero, the canvas is deferred twice — code-split and only
 * mounted once the panel approaches the viewport — and everything falls back to
 * the CSS SceneFallback for reduced-motion and no-WebGL visitors, so the section
 * reads correctly with no JavaScript and no missing image asset.
 */
export default function VenuePreview() {
  const [wrapperRef, inView] = useInView<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const webgl = useWebGLAvailable()
  const tier = useQualityTier()
  const [wing, setWing] = useState<WorldZone>('celebration')

  const showScene = webgl === true && !reduced && inView
  const active = WINGS.find(item => item.id === wing) ?? WINGS[0]

  return (
    <section id="venue" className="scroll-mt-20 bg-ink-950 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1380px] items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        <div data-reveal>
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-champagne">The living world</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
            Step inside before you step in.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-fg-dim">{active.blurb}</p>

          <ul className="mt-8 flex flex-col gap-3.5">
            {active.points.map(point => (
              <li key={point} className="flex items-start gap-3 text-sm leading-6 text-fg-dim">
                <span
                  aria-hidden="true"
                  className="mt-[9px] size-1.5 shrink-0 rounded-full bg-champagne"
                />
                {point}
              </li>
            ))}
          </ul>

          <div
            role="group"
            aria-label="Choose a wing to explore"
            className="mt-8 inline-flex border border-border bg-muted/50 p-1"
          >
            {WINGS.map(item => {
              const Icon = item.id === 'celebration' ? Sparkles : Wrench
              const selected = item.id === wing
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWing(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale',
                    selected ? 'bg-hept-purple text-white' : 'text-white/60 hover:text-white',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div ref={wrapperRef} className="relative">
          <div className="relative aspect-[16/10] overflow-hidden border border-hairline bg-ink-900">
            {showScene ? (
              <HeptomeWorld controls quality={tier} zone={wing} interactive={false} />
            ) : (
              <SceneFallback />
            )}

            {showScene && (
              <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 border border-white/15 bg-ink-950/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-fg-dim backdrop-blur-sm">
                <Move3d className="size-3.5 text-violet-pale" aria-hidden="true" />
                Drag to explore
              </span>
            )}
          </div>
          <p className="mt-4 text-xs leading-5 text-fg-mute">
            A design preview of the Heptome spaces — not a photograph of a specific venue or home. Live
            venue options appear in the event catalogue.
          </p>
        </div>
      </div>
    </section>
  )
}
