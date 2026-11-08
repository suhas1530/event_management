import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events & Celebrations',
  description:
    'Explore weddings, birthdays, corporate events, conferences and celebrations, with venues and services from the live Heptome catalogue.',
  alternates: { canonical: '/events' },
  openGraph: {
    type: 'website',
    title: 'Events & Celebrations | Heptome',
    description:
      'Explore weddings, birthdays, corporate events, conferences and celebrations with Heptome.',
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
