'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Heart, MapPin, Sparkles, Trash2 } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { PageHeader, buttonClass } from '@/components/shared/Primitives'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { favoritesApi, type Event } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface Favorite {
  id: string
  event?: Event
  createdAt: string
}

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      setItems(await favoritesApi.list())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    void load()
  }, [authLoading, load])

  async function remove(id: string, label: string) {
    setRemoving(id)
    // Optimistic removal keeps the list feeling instant.
    const snapshot = items
    setItems(prev => prev.filter(item => item.id !== id))
    try {
      await favoritesApi.remove(id)
      toast(`${label} removed from favorites.`, 'success')
    } catch {
      setItems(snapshot)
      toast('We could not remove that favorite.', 'error')
    } finally {
      setRemoving(null)
    }
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-5 py-24">
          <EmptyState
            icon={Heart}
            title="Sign in to see your favorites"
            description="Save events you are interested in and they will be waiting here."
            action={{ label: 'Log in', href: '/login' }}
            secondaryAction={{ label: 'Browse events', href: '/events' }}
          />
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-16 lg:px-8">
        <PageHeader
          eyebrow="Your account"
          title="Favorites"
          description="Events you have saved for later. Removing one here does not cancel anything you have booked."
          actions={
            items.length > 0 ? (
              <Link href="/events" className={buttonClass('secondary', 'md')}>
                Browse more events
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : undefined
          }
        />

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="space-y-2 p-5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="We couldn't load your favorites."
              description="Something went wrong on our side. Please try again."
              onRetry={() => void load()}
            />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
              <EmptyState
                icon={Heart}
                title="No favorites yet"
                description="Tap the heart on any event to save it here. It is the quickest way to compare options later."
                action={{ label: 'Explore events', href: '/events' }}
                secondaryAction={{ label: 'Plan an event', href: '/plan-event' }}
              />
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {items.map(item => {
                const event = item.event
                const title = event?.title ?? 'Saved item'
                return (
                  <li key={item.id} className="group relative">
                    <article className="h-full overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30">
                      <Link
                        href={event ? `/events/${event.slug}` : '/events'}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.04]">
                          {event?.heroImages?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote, user-supplied event imagery cannot be optimised ahead of time
                            <img
                              src={event.heroImages[0]}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <span className="grid size-full place-items-center">
                              <Sparkles className="size-6 text-white/15" aria-hidden="true" />
                            </span>
                          )}
                        </div>

                        <div className="p-5">
                          <p className="text-[0.6875rem] uppercase tracking-[0.15em] text-primary">
                            {event?.category?.name ?? event?.type ?? 'Event'}
                          </p>
                          <h2 className="mt-1.5 line-clamp-2 text-[0.9375rem] font-medium text-white/90">
                            {title}
                          </h2>
                          {event?.city && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                              <MapPin className="size-3.5 text-white/25" aria-hidden="true" />
                              {event.city}
                            </p>
                          )}
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => void remove(item.id, title)}
                        disabled={removing === item.id}
                        aria-label={`Remove ${title} from favorites`}
                        className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg border border-white/10 bg-black/45 text-white/60 backdrop-blur transition-all duration-200 hover:border-red-400/40 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </SiteShell>
  )
}
