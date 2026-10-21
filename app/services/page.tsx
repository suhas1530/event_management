import type { Metadata } from 'next'
import SiteShell from '@/components/layout/SiteShell'
import ServicesIndex from './ServicesIndex'

export const metadata: Metadata = {
  title: 'All Services',
  description:
    'Every Heptome service in one place — event venues, catering, décor, photography and production, plus cleaning, repairs, appliance care and personal services at home.',
}

export default function ServicesPage() {
  return (
    <SiteShell>
      <ServicesIndex />
    </SiteShell>
  )
}
