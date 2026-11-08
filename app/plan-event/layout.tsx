import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plan an Event',
  description:
    'Share your event type, date, guest count, venue and service requirements. A Heptome planner reviews the brief and prepares a custom proposal before anything is confirmed.',
  alternates: { canonical: '/plan-event' },
  openGraph: {
    type: 'website',
    title: 'Plan an Event | Heptome',
    description:
      'Share your event brief and receive a custom proposal before anything is confirmed.',
  },
}

export default function PlanEventLayout({ children }: { children: React.ReactNode }) {
  return children
}
