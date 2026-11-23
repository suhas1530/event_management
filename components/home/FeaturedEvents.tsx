'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import { eventsApi, type Event as ApiEvent } from '@/lib/api'
import { resolveEventImage } from '@/lib/event-images'
import { FEATURED_FALLBACK } from '@/lib/home-content'

interface FeaturedCard {
  key: string
  title: string
  img: string
  fallback: string
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
  fallback: item.img,
  badge: item.date,
  location: item.location,
  price: item.price,
  href: '/events',
}))

function toCard(event: ApiEvent): FeaturedCard {
  const { src, fallback } = resolveEventImage(event)
  return {
    key: event.id,
    title: event.title,
    img: src,
    fallback,
    badge: event.type.replaceAll('_', ' ').toLowerCase(),
    location: event.location || event.city,
    price: event.startingPrice > 0 ? event.startingPrice : null,
    href: `/events/${event.slug}`,
  }
}

/**
 * Event slider.
 *
 * Reads live catalogue data from the API (`/events/featured`) with a curated
 * fallback so the section never renders empty. Cards link to the real event
 * pages, and every price shown comes from the backend.
 */
export default function FeaturedEvents() {
  const [cards, setCards] = useState<FeaturedCard[] | null>(null)
  const railRef = useRef<HTMLUListElement>(null)

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

  function scroll(direction: 1 | -1) {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * Math.min(rail.clientWidth * 0.8, 720), behavior: 'smooth' })
  }

  return (
    <section className="border-b border-border bg-background px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-gold-text">Featured experiences</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground">
              Ideas from the live catalogue.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Read from the live catalogue — prices appear only where the catalogue carries one.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll featured experiences left"
              className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll featured experiences right"
              className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {cards === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton min-h-[300px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <ul
            ref={railRef}
           
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
            aria-label="Featured experiences"
            tabIndex={0}
          >
            {cards.map(card => (
              <li
                key={card.key}
               
                className="w-[82vw] max-w-[420px] shrink-0 snap-start sm:w-[360px] lg:w-[380px]"
              >
                <Link
                  href={card.href}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <img
                    src={card.img}
                    alt={card.title}
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.dataset.fallbackApplied === '1') return
                      img.dataset.fallbackApplied = '1'
                      img.src = card.fallback
                    }}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/25 to-transparent"
                  />

                  <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-neutral-950/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80 capitalize backdrop-blur-sm">
                    {card.badge}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">{card.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {card.location}
                      </span>
                      {card.price !== null && (
                        <span className="font-medium text-gold-soft">From {formatPrice(card.price)}</span>
                      )}
                    </div>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      View details
                      <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
