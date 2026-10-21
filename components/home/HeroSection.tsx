'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroOverlay from '@/components/three/HeroOverlay'
import HeroBookingPanel from '@/components/home/HeroBookingPanel'
import SceneFallback from '@/components/three/SceneFallback'
import { usePrefersReducedMotion, useQualityTier, useWebGLAvailable } from '@/lib/motion'
import type { WorldZone } from '@/components/three/HeptomeWorld'

gsap.registerPlugin(ScrollTrigger)

/**
 * The living-world scene ships as its own client chunk (never SSR'd) and is only
 * requested when WebGL is available and the visitor allows motion. Everyone else
 * gets the static SceneFallback — the page keeps its full design and both
 * booking journeys stay reachable.
 */
const HeptomeWorld = dynamic(() => import('@/components/three/HeptomeWorld'), {
  ssr: false,
  loading: () => <SceneFallback />,
})

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const scrollProgress = useRef(0)

  const reduced = usePrefersReducedMotion()
  const webgl = useWebGLAvailable()
  const tier = useQualityTier()
  const showScene = webgl === true && !reduced

  /**
   * `auto` lets the scroll story move the camera between the celebration hall
   * and the home wing. As soon as the visitor picks a wing, the camera stays
   * there — an explicit choice always wins over ambient motion.
   */
  const [zone, setZone] = useState<WorldZone | 'auto'>('auto')
  const [activeZone, setActiveZone] = useState<WorldZone>('celebration')

  const selectZone = useCallback((next: WorldZone) => {
    setZone(next)
    setActiveZone(next)
  }, [])

  /* Intro reveal + scroll-linked camera + overlay exit. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section || reduced) return

    const ctx = gsap.context(() => {
      gsap.from('[data-hero-reveal]', {
        y: 44,
        autoAlpha: 0,
        duration: 1.05,
        stagger: 0.11,
        ease: 'power3.out',
        delay: 0.15,
      })

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        onUpdate: self => {
          scrollProgress.current = self.progress
        },
      })

      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          y: -70,
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '72% top', scrub: true },
        })
      }
    }, section)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink-950"
    >
      {/* The Heptome living world (or static fallback) */}
      <div className="absolute inset-0">
        {showScene ? (
          <HeptomeWorld
            zone={zone}
            scrollProgress={scrollProgress}
            interactive={tier === 'high'}
            quality={tier}
            onZoneSettled={next => {
              // Only follow the scene while the visitor has not chosen a wing.
              if (zone === 'auto') setActiveZone(next)
            }}
            onZoneSelect={selectZone}
          />
        ) : (
          <SceneFallback />
        )}
      </div>

      {/* Readability vignette — kept clear through the middle so both wings show */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,13,20,0.6)_0%,rgba(15,13,20,0.1)_38%,rgba(15,13,20,0.5)_78%,#0f0d14_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(90deg,rgba(15,13,20,0.72)_0%,rgba(15,13,20,0.25)_55%,rgba(15,13,20,0)_100%)]"
      />

      {/* Copy + floating booking panel */}
      <div ref={overlayRef} className="relative z-10 flex flex-1 items-center">
        <div className="pointer-events-none mx-auto grid w-full max-w-[1380px] items-center gap-12 px-5 pb-28 pt-32 sm:px-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-32 lg:pt-36">
          <HeroOverlay zone={activeZone} onZoneChange={selectZone} />
          <div data-hero-reveal className="pointer-events-auto w-full justify-self-end">
            <HeroBookingPanel
              mode={activeZone}
              onModeChange={mode => selectZone(mode)}
            />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 text-fg-mute">
        <span className="text-[9px] uppercase tracking-[0.3em]">Scroll</span>
        <span aria-hidden="true" className="block h-8 w-px bg-gradient-to-b from-violet-pale/70 to-transparent" />
      </div>
    </section>
  )
}
