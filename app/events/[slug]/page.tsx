import type { Metadata } from 'next'
import EventDetailClient from './EventDetailClient'
import { absoluteUrl } from '@/lib/seo'
import type { Event } from '@/lib/api'

interface EventPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Event details are rendered by the existing client component; this server
 * wrapper exists so each event can have its own title, description, canonical
 * and social image. If the API is unreachable the page still renders and falls
 * back to generic metadata rather than failing the route.
 */
async function loadEvent(slug: string): Promise<Event | null> {
  const base =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:5000/api/v1'
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/events/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    })
    if (!response.ok) return null
    return (await response.json()) as Event
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await loadEvent(slug)

  if (!event) {
    return {
      title: 'Event Details',
      description: 'View event details, packages and services from the Heptome catalogue.',
      alternates: { canonical: `/events/${slug}` },
    }
  }

  const description =
    event.shortDescription ??
    event.description.slice(0, 160).replace(/\s+/g, ' ').trim()
  const image = event.heroImages?.[0]

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: 'article',
      url: absoluteUrl(`/events/${event.slug}`),
      title: `${event.title} | Heptome`,
      description,
      images: image ? [{ url: image, alt: event.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} | Heptome`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  // Awaiting params keeps the route compatible with Next's async params API.
  await params
  return <EventDetailClient />
}
