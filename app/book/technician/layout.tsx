import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Home Service',
  description:
    'Book a cleaning, AC, appliance, electrical, plumbing, carpentry, painting or security professional at home in Bengaluru. Check your pincode and choose a two-hour arrival window.',
  alternates: { canonical: '/book/technician' },
  openGraph: {
    type: 'website',
    title: 'Book a Home Service | Heptome',
    description:
      'Choose a service, confirm your Bengaluru address and request a two-hour arrival window.',
  },
}

export default function BookTechnicianLayout({ children }: { children: React.ReactNode }) {
  return children
}
