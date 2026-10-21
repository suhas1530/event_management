import type { Metadata } from 'next'
import SiteShell from '@/components/layout/SiteShell'
import VenuesBrowser from './VenuesBrowser'

export const metadata: Metadata = {
  title: 'Venues & Banquet Halls',
  description:
    'Browse banquet halls, resorts, hotels and outdoor venues for weddings, corporate events and celebrations — capacities, cities and amenities from the live Heptome catalogue.',
}

export default function VenuesPage() {
  return (
    <SiteShell>
      <VenuesBrowser />
    </SiteShell>
  )
}
