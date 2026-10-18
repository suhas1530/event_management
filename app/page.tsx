'use client'

import { useRef } from 'react'
import SiteShell from '@/components/layout/SiteShell'
import PlatformStats from '@/components/brand/PlatformStats'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import FeaturedEvents from '@/components/home/FeaturedEvents'
import ServicesSection from '@/components/home/ServicesSection'
import HowItWorks from '@/components/home/HowItWorks'
import VenuePreview from '@/components/home/VenuePreview'
import TechStrip from '@/components/home/TechStrip'
import FinalCTA from '@/components/home/FinalCTA'
import { usePrefersReducedMotion } from '@/lib/motion'
import { useHomeAnimations } from '@/lib/use-home-animations'

/**
 * Immersive homepage.
 *
 * Story flow: cinematic 3D hero → live platform stats → event categories →
 * featured experiences (live API) → services → how it works → venue preview →
 * home-services strip → final CTA.
 *
 * All scroll choreography is added by `useHomeAnimations`; without it (reduced
 * motion, no JS yet) every section renders in its final, readable state.
 */
export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  useHomeAnimations(rootRef, !reduced)

  return (
    <SiteShell transparentHeader>
      <div ref={rootRef} className="bg-ink-950 text-slate-50">
        <HeroSection />
        <PlatformStats />
        <CategoryGrid />
        <FeaturedEvents />
        <ServicesSection />
        <HowItWorks />
        <VenuePreview />
        <TechStrip />
        <FinalCTA />
      </div>
    </SiteShell>
  )
}
