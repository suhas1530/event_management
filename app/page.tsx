'use client'

import { useRef } from 'react'
import SiteShell from '@/components/layout/SiteShell'
import PlatformStats from '@/components/brand/PlatformStats'
import HeroSection from '@/components/home/HeroSection'
import DiscoveryPaths from '@/components/home/DiscoveryPaths'
import CategoryGrid from '@/components/home/CategoryGrid'
import FeaturedEvents from '@/components/home/FeaturedEvents'
import ServicesSection from '@/components/home/ServicesSection'
import HomeServicesShowcase from '@/components/home/HomeServicesShowcase'
import HowItWorks from '@/components/home/HowItWorks'
import VenuePreview from '@/components/home/VenuePreview'
import PartnerBand from '@/components/home/PartnerBand'
import FinalCTA from '@/components/home/FinalCTA'
import { usePrefersReducedMotion } from '@/lib/motion'
import { useHomeAnimations } from '@/lib/use-home-animations'

/**
 * The Heptome homepage.
 *
 * Story flow: the living-world hero → the two discovery paths (both verticals at
 * equal weight) → live platform counts → the event catalogue and its services →
 * the ivory home-services showcase → how both journeys run → the world preview
 * → partner recruitment → the final dual CTA.
 *
 * Surface rhythm alternates deliberately: cinematic dark with champagne for the
 * event half, ivory with purple for the home half, so one brand reads as two
 * distinct products rather than a single dark page.
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
      <div ref={rootRef} className="immersive bg-ink-950 text-slate-50">
        <HeroSection />
        <DiscoveryPaths />
        <PlatformStats />
        <CategoryGrid />
        <FeaturedEvents />
        <ServicesSection />
        <HomeServicesShowcase />
        <HowItWorks />
        <VenuePreview />
        <PartnerBand />
        <FinalCTA />
      </div>
    </SiteShell>
  )
}
