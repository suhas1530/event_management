'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Star, Heart, MapPin, Users, ArrowRight } from 'lucide-react'
import type { Event } from '@/lib/api'

interface EventCardProps {
  event: Event
  onFavoriteToggle?: (eventId: string) => Promise<boolean>
  initialFavorited?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Wedding', BIRTHDAY: 'Birthday', ANNIVERSARY: 'Anniversary',
  ENGAGEMENT: 'Engagement', BABY_SHOWER: 'Baby Shower', CORPORATE: 'Corporate',
  CONFERENCE: 'Conference', KIDS_PARTY: "Kids' Party", GRADUATION: 'Graduation',
  HOUSEWARMING: 'Housewarming', PROPOSAL: 'Proposal', THEME_PARTY: 'Theme Party',
  PRIVATE_CELEBRATION: 'Private Celebration', CUSTOM: 'Custom',
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return `₹${n}`
}

export default function EventCard({ event, onFavoriteToggle, initialFavorited = false }: EventCardProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [toggling, setToggling] = useState(false)

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!onFavoriteToggle || toggling) return
    setToggling(true)
    try {
      const nowFav = await onFavoriteToggle(event.id)
      setFavorited(nowFav)
    } catch {}
    finally { setToggling(false) }
  }

  const categoryLabel = event.category?.name ?? TYPE_LABELS[event.type] ?? event.type

  return (
    <article className="group relative flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 hover:border-[#d5ae79]/30 hover:shadow-[0_0_30px_rgba(213,174,121,0.06)]">
      {/* Image */}
      <Link href={`/events/${event.slug}`} className="relative block aspect-[1.15] overflow-hidden" tabIndex={-1} aria-hidden="true">
        {event.heroImages?.[0] ? (
          <img
            src={event.heroImages[0]}
            alt={event.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/60">
            <span className="text-xs uppercase tracking-widest text-muted-foreground/80">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114]/70 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {event.isFeatured && (
            <span className="bg-[#d5ae79] px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-[#17151d]">
              Featured
            </span>
          )}
          {event.isLuxury && (
            <span className="border border-[#d5ae79]/50 bg-black/50 px-2 py-0.5 text-[8px] uppercase tracking-[0.18em] text-[#d5ae79] backdrop-blur-sm">
              Luxury
            </span>
          )}
        </div>

        {/* Rating */}
        {event.averageRating > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/75 px-2 py-1 backdrop-blur-sm">
            <Star className="size-3 fill-[#d5ae79] text-gold-text" />
            <span className="text-xs text-foreground">{event.averageRating.toFixed(1)}</span>
            {event.totalReviews > 0 && (
              <span className="text-[10px] text-muted-foreground">({event.totalReviews})</span>
            )}
          </div>
        )}

        {/* Favourite button */}
        <button type="button"
          onClick={handleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
          aria-pressed={favorited}
          className={`absolute right-3 top-3 flex size-8 items-center justify-center border backdrop-blur-sm transition ${
            favorited
              ? 'border-[#d5ae79] bg-[#d5ae79]/20 text-[#d5ae79]'
              : 'border-white/25 bg-black/40 text-white hover:border-[#d5ae79] hover:text-[#d5ae79]'
          } ${toggling ? 'opacity-60' : ''}`}
        >
          <Heart className={`size-3.5 ${favorited ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold-text">{categoryLabel}</p>
        <Link href={`/events/${event.slug}`}>
          <h3 className="mt-1 font-serif text-xl leading-tight text-foreground transition group-hover:text-gold-text/90">
            {event.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground/80">
          {event.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 flex-shrink-0" />{event.city}
            </span>
          )}
          {event.maxGuests && (
            <span className="flex items-center gap-1">
              <Users className="size-3 flex-shrink-0" />Up to {event.maxGuests}
            </span>
          )}
        </div>

        {/* Color palette */}
        {event.colorPalette?.length > 0 && (
          <div className="mt-2.5 flex gap-1">
            {event.colorPalette.slice(0, 5).map((c, i) => (
              <div key={i} className="size-2.5 rounded-full border border-border" style={{ background: c }} />
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between border-t border-border-subtle pt-3.5">
          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/80">Starting from</p>
            <p className="mt-0.5 text-base font-medium text-foreground">{fmt(event.startingPrice)}</p>
          </div>
          <Link
            href={`/events/${event.slug}`}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-gold-text transition hover:gap-2.5"
            aria-label={`View ${event.title}`}
          >
            View <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}
