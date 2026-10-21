import type { Metadata } from 'next'
import SiteShell from '@/components/layout/SiteShell'
import HomeServicesLanding from './HomeServicesLanding'

export const metadata: Metadata = {
  title: 'Home Services',
  description:
    'Book trusted professionals for cleaning, AC and appliance repair, electrical, plumbing, carpentry, painting and personal care at home in Bengaluru — prices agreed before the visit.',
}

export default function HomeServicesPage() {
  return (
    <SiteShell>
      <HomeServicesLanding />
    </SiteShell>
  )
}
