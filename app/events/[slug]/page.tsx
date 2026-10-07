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
    <SiteShell transparentHeader>
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <span className="sr-only">Loading event…</span>
        <Loader2 className="size-8 animate-spin text-[#d7b98b]" aria-hidden="true" />
      </div>
    </SiteShell>
  )

  if (!event) return (
    <SiteShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-white/50">Event not found</p>
        <Link href="/events" className="mt-4 text-xs text-[#d7b98b] hover:underline">← Browse events</Link>
      </div>
    </SiteShell>
  )

  return (
    <SiteShell transparentHeader>
      {/* Hero gallery */}
      {allImages.length > 0 && (
        <div className="relative h-[55vh] overflow-hidden">
          <img src={allImages[imgIdx]} alt={event.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-[#0b0b0d]/20" />
          {allImages.length > 1 && (
            <>
              <button type="button" onClick={() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center bg-black/50 backdrop-blur-sm hover:bg-black/70">
                <ChevronLeft className="size-5 text-white" />
              </button>
              <button type="button" onClick={() => setImgIdx(i => (i + 1) % allImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center bg-black/50 backdrop-blur-sm hover:bg-black/70">
                <ChevronRight className="size-5 text-white" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`size-1.5 rounded-full transition ${i === imgIdx ? 'bg-[#d7b98b]' : 'bg-white/30'}`} />
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={handleFavorite}
            className={`absolute right-5 top-5 flex size-10 items-center justify-center border backdrop-blur-sm transition ${favorited ? 'border-[#d7b98b] bg-[#d7b98b]/20 text-[#d7b98b]' : 'border-white/30 bg-black/40 text-white hover:border-[#d7b98b]'}`}>
            <Heart className={`size-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 py-10 lg:flex lg:gap-12 lg:px-10">
        {/* Left — details */}
        <div className="flex-1 min-w-0">
          {/* Title block */}
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">
            {event.category?.name ?? TYPE_LABELS[event.type] ?? event.type}
            {event.isLuxury && ' · Luxury'}
          </p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight text-white">{event.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{event.city}{event.state && `, ${event.state}`}</span>
            <span className="flex items-center gap-1.5"><Users className="size-3.5" />{event.minGuests}–{event.maxGuests} guests</span>
            {event.averageRating > 0 && (
              <span className="flex items-center gap-1.5"><Star className="size-3.5 fill-[#d7b98b] text-[#d7b98b]" />{event.averageRating.toFixed(1)} ({event.totalReviews} reviews)</span>
            )}
          </div>

          {/* Color palette */}
          {event.colorPalette?.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Palette</span>
              {event.colorPalette.map((c, i) => (
                <div key={i} className="size-4 border border-white/10" style={{ background: c }} title={c} />
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-8 border-b border-white/10">
            <div className="flex gap-0">
              {(['overview', 'packages', 'reviews'] as const).map(t => (
                <button type="button" key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition ${activeTab === t ? 'border-b-2 border-[#d7b98b] text-[#d7b98b]' : 'text-white/40 hover:text-white/70'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">About</h2>
                <p className="text-sm leading-7 text-white/70">{event.description}</p>
              </div>
              {event.theme && (
                <div>
                  <h2 className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">Theme</h2>
                  <p className="text-sm text-white/70">{event.theme}</p>
                </div>
              )}
              {event.venue && (
                <div>
                  <h2 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">Venue</h2>
                  <div className="border border-white/10 p-4">
                    <p className="font-medium text-white">{event.venue.name}</p>
                    <p className="mt-1 text-xs text-white/50">{event.venue.address}, {event.venue.city}</p>
                    <p className="mt-1 text-xs text-white/40">Capacity: up to {event.venue.capacity} guests</p>
                    {event.venue.amenities?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.venue.amenities.map((a, i) => (
                          <span key={i} className="border border-white/10 px-2 py-0.5 text-[9px] text-white/40">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Services */}
              {event.services && event.services.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">Services available</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {event.services.map((s: any) => {
                      const svc = s.service ?? s
                      return (
                        <div key={svc.id} className="flex items-center justify-between border border-white/8 px-3 py-2.5 text-sm">
                          <span className="text-white/70">{svc.name}</span>
                          <span className="text-xs text-white/40">{fmt(svc.basePrice)}</span>
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
                ? <p className="text-sm text-white/40 col-span-2">No packages available for this event.</p>
                : event.packages?.map(pkg => (
                  <article key={pkg.id} className="border border-white/10 p-5">
                    <div className="flex items-start justify-between">
                      <p className="font-serif text-xl text-white">{pkg.name}</p>
                      <span className="text-sm text-[#d7b98b]">{fmt(pkg.price)}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{pkg.description}</p>
                    {pkg.guestLimit && <p className="text-[10px] text-white/30">Up to {pkg.guestLimit} guests</p>}
                    {pkg.highlights?.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {pkg.highlights.slice(0, 3).map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-white/50">
                            <Check className="mt-0.5 size-3 flex-shrink-0 text-[#d7b98b]" />{h}
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
                ? <p className="text-sm text-white/40">No reviews yet. Be the first to review!</p>
                : <div className="space-y-5">
                  {event.reviews?.map(r => (
                    <div key={r.id} className="border-b border-white/8 pb-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center bg-[#d7b98b]/10 text-xs text-[#d7b98b]">
                            {r.user?.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm text-white">{r.user?.name}</p>
                            {r.isVerified && <p className="text-[9px] uppercase tracking-[0.1em] text-green-400">Verified</p>}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`size-3 ${i < r.rating ? 'fill-[#d7b98b] text-[#d7b98b]' : 'text-white/20'}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <p className="mt-3 text-sm font-medium text-white">{r.title}</p>}
                      {r.comment && <p className="mt-1 text-sm leading-6 text-white/60">{r.comment}</p>}
                    </div>
                  ))}
                </div>}
            </div>
          )}
        </div>

        {/* Right — booking panel */}
        <div className="mt-10 w-full lg:mt-0 lg:w-80 xl:w-96">
          <div className="sticky top-24 border border-white/15 bg-[#111114] p-6">
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[#d7b98b]">Made for your celebration</p>
            <h2 className="font-serif text-3xl text-white">Let&apos;s plan it around you.</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Use this event as inspiration. Share your date, guest count, location, budget and ideas, and our team will create a custom proposal.</p>
            <Link href={`/plan-event?type=${encodeURIComponent(event.type)}`}
              className="mt-6 flex items-center justify-center gap-2 bg-[#d7b98b] py-3.5 text-[10px] uppercase tracking-[0.18em] text-[#1c1915] transition hover:bg-[#e8cfa0]">
              Plan an event like this <ArrowRight className="size-4" />
            </Link>
            <Link href="/events" className="mt-3 flex items-center justify-center border border-white/15 py-3 text-[10px] uppercase tracking-[0.15em] text-white/50 transition hover:border-white/30 hover:text-white/75">Browse event ideas</Link>

            <Link href="/ai-event-designer"
              className="mt-3 flex items-center justify-center gap-2 border border-white/15 py-3 text-[10px] uppercase tracking-[0.15em] text-white/50 transition hover:border-[#d7b98b] hover:text-[#d7b98b]">
              <Sparkles className="size-3.5" /> Design with AI first
            </Link>

            {!isAuthenticated && (
              <p className="mt-3 text-center text-[10px] text-white/30">
                <Link href="/login" className="text-[#d7b98b] hover:underline">Sign in</Link> to book
              </p>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
