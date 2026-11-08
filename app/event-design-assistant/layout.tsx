import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'AI Event Design Assistant',
  description:
    'Tell Heptome about your event and explore three personalised design directions with reference images, real catalog services and honest indicative pricing. Designs are inspiration, not a confirmed package or quote.',
  alternates: { canonical: '/event-design-assistant' },
  openGraph: {
    title: 'AI Event Design Assistant | Heptome',
    description:
      'Three personalised event design directions, real catalog services and a clear path to a custom quote.',
    url: '/event-design-assistant',
  },
}

export default function EventDesignAssistantLayout({ children }: { children: ReactNode }) {
  return children
}
