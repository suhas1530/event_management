'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { eventsApi, favoritesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/app/providers'
import type { Event } from '@/lib/api'
import SiteShell from '@/components/layout/SiteShell'
import {
  ArrowLeft, Star, MapPin, Users, Heart, ChevronLeft, ChevronRight,
  Check, Loader2, Sparkles, ArrowRight
} from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  WEDDING:'Wedding', BIRTHDAY:'Birthday', ANNIVERSARY:'Anniversary',
  ENGAGEMENT:'Engagement', BABY_SHOWER:'Baby Shower', CORPORATE:'Corporate',
  CONFERENCE:'Conference', KIDS_PARTY:"Kids' Party", GRADUATION:'Graduation',
  HOUSEWARMING:'Housewarming', PROPOSAL:'Proposal', THEME_PARTY:'Theme Party',
  PRIVATE_CELEBRATION:'Private Celebration', CUSTOM:'Custom',
}
function fmt(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(0)}k`
  return `₹${n}`
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'reviews'>('overview')

  useEffect(() => {
    eventsApi.bySlug(slug).then(e => {
      setEvent(e)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  async function handleFavorite() {
    if (!isAuthenticated) { router.push('/login'); return }
    if (!event) return
    try {
      const res = await favoritesApi.toggle({ eventId: event.id })
      setFavorited(res.favorited)
      toast(res.favorited ? 'Added to favorites' : 'Removed from favorites', 'success')
    } catch {}
  }

  const allImages = event ? [...(event.heroImages ?? []), ...(event.galleryImages ?? [])] : []

  if (loading) return (
    <SiteShell>
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <span className="sr-only">Loading event…</span>
        <Loader2 className="size-8 animate-spin text-gold-text" aria-hidden="true" />
      </div>
    </SiteShell>
  )

  if (!event) return (
    <SiteShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Link href="/events" className="mt-4 text-xs text-gold-text hover:underline">← Browse events</Link>
      </div>
    </SiteShell>
  )

  return (
    <SiteShell transparentHeader={allImages.length > 0}>
      {/* Hero gallery */}
      {allImages.length > 0 && (
        <div className="relative h-[55vh] overflow-hidden">
          <img src={allImages[imgIdx]} alt={event.title} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0b0b0d]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-[#0b0b0d]/20" />
          {allImages.length > 1 && (
            <>
              <button type="button" onClick={() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center bg-black/50 backdrop-blur-sm hover:bg-black/70">
                <ChevronLeft className="size-5 text-foreground" />
              </button>
              <button type="button" onClick={() => setImgIdx(i => (i + 1) % allImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center bg-black/50 backdrop-blur-sm hover:bg-black/70">
                <ChevronRight className="size-5 text-foreground" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`size-1.5 rounded-full transition ${i === imgIdx ? 'bg-[#d5ae79]' : 'bg-white/30'}`} />
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={handleFavorite}
            className={`absolute right-5 top-5 flex size-10 items-center justify-center border backdrop-blur-sm transition ${favorited ? 'border-[#d5ae79] bg-[#d5ae79]/20 text-[#d5ae79]' : 'border-white/30 bg-black/40 text-white hover:border-[#d5ae79]'}`}>
            <Heart className={`size-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 py-10 lg:flex lg:gap-12 lg:px-10">
        {/* Left — details */}
        <div className="flex-1 min-w-0">
          {/* Title block */}
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">
            {event.category?.name ?? TYPE_LABELS[event.type] ?? event.type}
            {event.isLuxury && ' · Luxury'}
          </p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight text-foreground">{event.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{event.city}{event.state && `, ${event.state}`}</span>
            <span className="flex items-center gap-1.5"><Users className="size-3.5" />{event.minGuests}–{event.maxGuests} guests</span>
            {event.averageRating > 0 && (
              <span className="flex items-center gap-1.5"><Star className="size-3.5 fill-[#d5ae79] text-gold-text" />{event.averageRating.toFixed(1)} ({event.totalReviews} reviews)</span>
            )}
          </div>

          {/* Color palette */}
          {event.colorPalette?.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Palette</span>
              {event.colorPalette.map((c, i) => (
                <div key={i} className="size-4 border border-border" style={{ background: c }} title={c} />
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-8 border-b border-border">
            <div className="flex gap-0">
              {(['overview', 'packages', 'reviews'] as const).map(t => (
                <button type="button" key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition ${activeTab === t ? 'border-b-2 border-[#d5ae79] text-gold-text' : 'text-muted-foreground hover:text-foreground/90'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">About</h2>
                <p className="text-sm leading-7 text-foreground/90">{event.description}</p>
              </div>
              {event.theme && (
                <div>
                  <h2 className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Theme</h2>
                  <p className="text-sm text-foreground/90">{event.theme}</p>
                </div>
              )}
              {event.venue && (
                <div>
                  <h2 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Venue</h2>
                  <div className="border border-border p-4">
                    <p className="font-medium text-foreground">{event.venue.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{event.venue.address}, {event.venue.city}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Capacity: up to {event.venue.capacity} guests</p>
                    {event.venue.amenities?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.venue.amenities.map((a, i) => (
                          <span key={i} className="border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Services */}
              {event.services && event.services.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Services available</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {event.services.map((s: any) => {
                      const svc = s.service ?? s
                      return (
                        <div key={svc.id} className="flex items-center justify-between border border-border-subtle px-3 py-2.5 text-sm">
                          <span className="text-foreground/90">{svc.name}</span>
                          <span className="text-xs text-muted-foreground">{fmt(svc.basePrice)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {event.packages?.length === 0
                ? <p className="text-sm text-muted-foreground col-span-2">No packages available for this event.</p>
                : event.packages?.map(pkg => (
                  <article key={pkg.id} className="border border-border p-5">
                    <div className="flex items-start justify-between">
                      <p className="font-serif text-xl text-foreground">{pkg.name}</p>
                      <span className="text-sm text-gold-text">{fmt(pkg.price)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pkg.description}</p>
                    {pkg.guestLimit && <p className="text-[10px] text-muted-foreground/80">Up to {pkg.guestLimit} guests</p>}
                    {pkg.highlights?.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {pkg.highlights.slice(0, 3).map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Check className="mt-0.5 size-3 flex-shrink-0 text-gold-text" />{h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="mt-6">
              {event.reviews?.length === 0
                ? <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
                : <div className="space-y-5">
                  {event.reviews?.map(r => (
                    <div key={r.id} className="border-b border-border-subtle pb-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center bg-[#d5ae79]/10 text-xs text-[#d5ae79]">
                            {r.user?.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{r.user?.name}</p>
                            {r.isVerified && <p className="text-[9px] uppercase tracking-[0.1em] text-green-400">Verified</p>}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`size-3 ${i < r.rating ? 'fill-[#d5ae79] text-gold-text' : 'text-muted-foreground/80'}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <p className="mt-3 text-sm font-medium text-foreground">{r.title}</p>}
                      {r.comment && <p className="mt-1 text-sm leading-6 text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>}
            </div>
          )}
        </div>

        {/* Right — booking panel */}
        <div className="mt-10 w-full lg:mt-0 lg:w-80 xl:w-96">
          <div className="sticky top-24 border border-border bg-card p-6">
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-gold-text">Made for your celebration</p>
            <h2 className="font-serif text-3xl text-foreground">Let&apos;s plan it around you.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Use this event as inspiration. Share your date, guest count, location, budget and ideas, and our team will create a custom proposal.</p>
            <Link href={`/plan-event?type=${encodeURIComponent(event.type)}`}
              className="mt-6 flex items-center justify-center gap-2 bg-[#d5ae79] py-3.5 text-[10px] uppercase tracking-[0.18em] text-[#17151d] transition hover:bg-[#e8cfa9]">
              Plan an event like this <ArrowRight className="size-4" />
            </Link>
            <Link href="/events" className="mt-3 flex items-center justify-center border border-border py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition h hover:text-foreground/90">Browse event ideas</Link>

            <Link href="/ai-event-designer"
              className="mt-3 flex items-center justify-center gap-2 border border-border py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-[#d5ae79] hover:text-gold-text">
              <Sparkles className="size-3.5" /> Design with AI first
            </Link>

            {!isAuthenticated && (
              <p className="mt-3 text-center text-[10px] text-muted-foreground/80">
                <Link href="/login" className="text-gold-text hover:underline">Sign in</Link> to book
              </p>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
