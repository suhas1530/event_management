import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Event Design Studio',
  description:
    'Describe a celebration and explore event design ideas with Heptome’s AI design studio. Designs are inspiration, not a confirmed package or price.',
  alternates: { canonical: '/ai-event-designer' },
  // The three-direction assistant is the canonical experience. Keep this
  // classic single-design page available, but avoid duplicate search results.
  robots: { index: false, follow: true },
}

export default function AiEventDesignerLayout({ children }: { children: React.ReactNode }) {
  return children
}
