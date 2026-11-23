'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, Wrench } from 'lucide-react'
import { HOME_SERVICE_SLIDES } from '@/lib/home-service-images'
import { homeGroupById } from '@/lib/catalog'
import { usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const SLIDE_MS = 4800

/**
 * Photography-led hero for the home-services landing page.
 *
 * Six real service photographs, a 4.8s crossfade, arrows and dots, pointer
 * swipe, pause on hover/focus/background tab, and full reduced-motion support.
 * Only the catalog id drives the CTA — no service is advertised that the
 * booking catalog does not actually offer.
 */
export default function HomeServicesHeroSlider() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const pointerStart = useRef<number | null>(null)
  const count = HOME_SERVICE_SLIDES.length
  const slide = HOME_SERVICE_SLIDES[index]
  const group = homeGroupById(slide.category)
  const bookingHref = group?.bookingCategory
    ? `/book/technician?category=${group.bookingCategory}`
    : '/contact'
  const detailHref = `/home-services/${slide.category}`

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  )

  useEffect(() => {
    if (reduced || paused || hidden) return
    const timer = window.setTimeout(() => setIndex(current => (current + 1) % count), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [count, index, paused, hidden, reduced])

  useEffect(() => {
    const sync = () => setHidden(document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  function onPointerDown(event: React.PointerEvent) {
    pointerStart.current = event.clientX
  }
  function onPointerUp(event: React.PointerEvent) {
    if (pointerStart.current === null) return
    const distance = event.clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(distance) > 48) go(index + (distance < 0 ? 1 : -1))
  }

  return (
    <section
      aria-label="Home services photographed at work"
      aria-roledescription="carousel"
      className="relative isolate min-h-[clamp(30rem,68svh,44rem)] overflow-hidden bg-[#0b0f0d] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { pointerStart.current = null }}
      onKeyDown={event => {
        if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1) }
      }}
    >
      {HOME_SERVICE_SLIDES.map((item, i) => (
        <div
          key={item.id}
          aria-hidden={i !== index}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-out',
            i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            reduced && 'duration-0',
          )}
        >
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            priority={i === 0}
            loading="eager"
            sizes="100vw"
            className="object-cover hero-kenburns"
            style={{ objectPosition: item.focus }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,8,0.9)_0%,rgba(7,10,8,0.66)_42%,rgba(7,10,8,0.16)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,8,0.5)_0%,transparent_30%,rgba(7,10,8,0.72)_100%)]"
          />
        </div>
      ))}

      <div className="container-full relative z-10 flex min-h-[clamp(30rem,68svh,44rem)] flex-col justify-end pb-12 pt-28 sm:pb-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/90 backdrop-blur-sm">
            <Wrench className="size-3" aria-hidden="true" />
            {slide.eyebrow}
          </p>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,5.4vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">
            {slide.headline}
            <span className="mt-1 block font-serif font-light italic text-gold-soft">{slide.accent}</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{slide.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={bookingHref}
              className="group inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f0d]"
            >
              Book a Service
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href={detailHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              View Details
            </Link>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/15 pt-5">
          <p className="hidden items-center gap-2.5 text-[10px] uppercase tracking-[0.22em] text-white/60 sm:flex">
            <span className="tabular-nums text-white/85">{String(index + 1).padStart(2, '0')}</span>
            <span className="h-px w-5 bg-white/25" aria-hidden="true" />
            <span className="normal-case tracking-[0.12em] text-white/70">{slide.label}</span>
          </p>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Choose a home service photo" className="flex items-center gap-1.5">
              {HOME_SERVICE_SLIDES.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}: ${item.label}`}
                  aria-current={i === index ? 'true' : undefined}
                  className="group flex h-6 items-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span className={cn('block h-1 rounded-full transition-all duration-300', i === index ? 'w-8 bg-white' : 'w-4 bg-white/35 group-hover:bg-white/55')} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
