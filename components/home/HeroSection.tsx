'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroOverlay from '@/components/three/HeroOverlay'
import HeroBookingPanel from '@/components/home/HeroBookingPanel'
import SceneFallback from '@/components/three/SceneFallback'
import { usePrefersReducedMotion, useQualityTier, useWebGLAvailable } from '@/lib/motion'

gsap.registerPlugin(ScrollTrigger)

/**
 * The 3D scene ships as its own client chunk (never SSR'd) and is only
 * requested when WebGL is available and the visitor allows motion. Everyone
 * else gets the static SceneFallback — the page keeps its full design.
 */
const EventScene = dynamic(() => import('@/components/three/EventScene'), {
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

  const scrollToExperiences = useCallback(() => {
    const target = document.getElementById('experiences')
    target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink-950"
    >
      {/* 3D scene (or static fallback) */}
      <div className="absolute inset-0">
        {showScene ? (
          <EventScene
            scrollProgress={scrollProgress}
            interactive={tier === 'high'}
            quality={tier}
            onSculptureSelect={scrollToExperiences}
          />
        ) : (
          <SceneFallback />
        )}
      </div>

      {/* Readability vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,13,0.55)_0%,rgba(8,9,13,0.12)_38%,rgba(8,9,13,0.55)_78%,#08090d_100%)]"
      />

      {/* Copy + floating booking panel */}
      <div ref={overlayRef} className="relative z-10 flex flex-1 items-center">
        <div className="pointer-events-none mx-auto grid w-full max-w-[1380px] items-center gap-12 px-5 pb-28 pt-32 sm:px-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-32 lg:pt-36">
          <HeroOverlay />
          <div data-hero-reveal className="pointer-events-auto w-full justify-self-end">
            <HeroBookingPanel />
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
