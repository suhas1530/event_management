'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { eventsApi, type Event as ApiEvent } from '@/lib/api'
import { FEATURED_FALLBACK } from '@/lib/home-content'

interface FeaturedCard {
  key: string
  title: string
  img: string
  badge: string
  location: string
  price: number | null
  href: string
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

const FALLBACK_CARDS: FeaturedCard[] = FEATURED_FALLBACK.map(item => ({
  key: item.id,
  title: item.title,
  img: item.img,
  badge: item.date,
  location: item.location,
  price: item.price,
  href: '/events',
}))

function toCard(event: ApiEvent): FeaturedCard {
  return {
    key: event.id,
    title: event.title,
    img: event.heroImages?.[0] ?? '/placeholder.jpg',
    badge: event.type.replaceAll('_', ' ').toLowerCase(),
    location: event.location || event.city,
    price: event.startingPrice > 0 ? event.startingPrice : null,
    href: `/events/${event.slug}`,
  }
}

/**
 * Editorial grid of featured events.
 *
 * Reads live catalogue data from the API (`/events/featured`) with a curated
 * fallback so the section never renders empty; cards link to the real event
 * pages, and every price shown comes from the backend.
 */
export default function FeaturedEvents() {
  const [cards, setCards] = useState<FeaturedCard[] | null>(null)

  useEffect(() => {
    let cancelled = false

    eventsApi
      .featured(6)
      .then(list => {
        if (cancelled) return
        setCards(Array.isArray(list) && list.length > 0 ? list.slice(0, 6).map(toCard) : FALLBACK_CARDS)
      })
      .catch(() => {
        if (!cancelled) setCards(FALLBACK_CARDS)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="border-t border-hairline/60 bg-ink-900/40 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="mb-14 max-w-2xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-champagne">Featured experiences</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
            Productions our clients still talk about.
          </h2>
        </div>

        {cards === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton min-h-[280px]" />
            ))}
          </div>
        ) : (
          <div data-reveal-group className="grid gap-4 sm:grid-cols-2 lg:auto-rows-[264px] lg:grid-cols-4">
            {cards.map((card, index) => (
              <Link
                key={card.key}
                data-reveal-item
                href={card.href}
                className={`group relative block overflow-hidden border border-white/8 transition-colors duration-500 hover:border-violet/50 ${
                  index === 0 ? 'min-h-[420px] sm:col-span-2 lg:row-span-2 lg:min-h-0' : 'min-h-[260px]'
                }`}
              >
                <Image
                  src={card.img}
                  alt={card.title}
                  fill
                  sizes={index === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/30 to-transparent" />

                <span className="absolute left-4 top-4 border border-white/15 bg-ink-950/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-fg-dim capitalize backdrop-blur-sm">
                  {card.badge}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className={`font-display font-semibold text-slate-50 ${index === 0 ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
                    {card.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-dim">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {card.location}
                    </span>
                    {card.price !== null && (
                      <span className="font-medium text-champagne-light">From {formatPrice(card.price)}</span>
                    )}
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-pale opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    View details
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
