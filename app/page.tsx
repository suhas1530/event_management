import type { Metadata } from 'next'
import SiteShell from '@/components/layout/SiteShell'
import HeroSection from '@/components/home/HeroSection'
import DiscoveryPaths from '@/components/home/DiscoveryPaths'
import CategoryGrid from '@/components/home/CategoryGrid'
import FeaturedEvents from '@/components/home/FeaturedEvents'
import HomeServicesShowcase from '@/components/home/HomeServicesShowcase'
import VenueShowcase from '@/components/home/VenueShowcase'
import BrandStory from '@/components/home/BrandStory'
import HowItWorks from '@/components/home/HowItWorks'
import TrustCoverage from '@/components/home/TrustCoverage'
import FinalCTA from '@/components/home/FinalCTA'
import { brand } from '@/lib/brand'
import { SUPPORTED_CITY } from '@/lib/service-area'
import {
  absoluteUrl,
  jsonLdString,
  organizationJsonLd,
  serviceJsonLd,
  websiteJsonLd,
} from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — ${brand.headline}` },
  description: brand.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: absoluteUrl('/'),
    siteName: brand.name,
    title: `${brand.name} — ${brand.headline}`,
    description: brand.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} — ${brand.headline}`,
    description: brand.description,
  },
}

/**
 * Photography-first homepage.
 *
 * The page tells one story in two halves: an eight-frame photographic hero, the
 * two discovery paths, live event and home-service rails, venue discovery by
 * style, the brand standard, and one factual section explaining how each
 * journey actually works. All imagery is stored locally under `public/images`;
 * all services come from `lib/catalog.ts`; prices only appear when the API
 * supplies them.
 */
export default function HomePage() {
  const structuredData = [
    organizationJsonLd(),
    websiteJsonLd(),
    serviceJsonLd({
      name: 'Event planning and celebration services',
      description:
        'Event planning for weddings, birthdays, corporate events and celebrations across India, with a reviewed proposal before anything is confirmed.',
      path: '/event-management',
      areaServed: 'India',
    }),
    serviceJsonLd({
      name: 'Home services in Bengaluru',
      description:
        'Doorstep cleaning, repair, installation and personal-care services in Bengaluru, booked by a two-hour arrival window.',
      path: '/home-services',
      areaServed: SUPPORTED_CITY,
    }),
  ]

  return (
    <SiteShell transparentHeader>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(structuredData) }}
      />
      <HeroSection />
      <div className="home-flow">
        <DiscoveryPaths />
        <CategoryGrid />
        <FeaturedEvents />
        <HomeServicesShowcase />
        <VenueShowcase />
        <BrandStory />
        <HowItWorks />
        <TrustCoverage />
        <FinalCTA />
      </div>
    </SiteShell>
  )
}
