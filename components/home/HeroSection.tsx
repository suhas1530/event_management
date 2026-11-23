'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HERO_SLIDES } from '@/lib/home-content'
import { usePrefersReducedMotion } from '@/lib/motion'
import HeroBookingPanel from './HeroBookingPanel'

const AUTOPLAY_MS = 5000
const CROSSFADE_MS = 1200
/** Let the first frame paint and settle before the story starts moving. */
const AUTOPLAY_GRACE_MS = 1200

/**
 * Photography-first hero.
 *
 * Eight licensed photographs cross-fade behind a fixed editorial promise and a
 * single booking panel. The copy does not move between slides: the imagery
 * carries the range of the product while the visitor reads one clear message
 * and can start either booking journey without waiting for a transition.
 *
 * The slider advances automatically every 5 seconds, loops continuously, and
 * keeps running after manual navigation. Autoplay pauses only when the tab is
 * hidden or the user prefers reduced motion.
 */
export default function HeroSection() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [hidden, setHidden] = useState(false)
  const [settled, setSettled] = useState(false)
  const pointerStart = useRef<number | null>(null)

  const count = HERO_SLIDES.length
  const slide = HERO_SLIDES[index]
  const paused = hidden || reduced

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const previous = useCallback(() => go(index - 1), [go, index])

  /* Give the first frame a beat to paint before autoplay begins. */
  useEffect(() => {
    if (reduced) {
      setSettled(true)
      return
    }
    const grace = window.setTimeout(() => setSettled(true), AUTOPLAY_GRACE_MS)
    return () => window.clearTimeout(grace)
  }, [reduced])

  /* One timer per cycle — never stacked. Manual navigation changes `index`,
     which resets this timer so autoplay continues after the configured interval. */
  useEffect(() => {
    if (!settled || paused) return
    const timer = window.setTimeout(() => setIndex(current => (current + 1) % count), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [count, index, paused, settled])

  /* Pause when the tab is in the background. */
  useEffect(() => {
    const sync = () => setHidden(document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  function onPointerDown(event: ReactPointerEvent) {
    pointerStart.current = event.clientX
  }

  function onPointerUp(event: ReactPointerEvent) {
    const start = pointerStart.current
    pointerStart.current = null
    if (start === null) return
    const delta = event.clientX - start
    if (Math.abs(delta) > 48) {
      if (delta < 0) next()
      else previous()
    }
  }

  return (
    <section
      id="hero"
      aria-roledescription="carousel"
      aria-label="Heptome photography"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          next()
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault()
          previous()
        } else if (event.key === 'Home') {
          event.preventDefault()
          go(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          go(count - 1)
        }
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStart.current = null
      }}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0b0f0d] text-white outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-inset"
    >
      {/* Photography — every frame stays mounted so a cross-fade never flashes. */}
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_SLIDES.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              'absolute inset-0 transition-opacity ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
            style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
          >
            <Image
              src={item.image}
              alt=""
              fill
              preload={i === 0}
              loading={i === 0 ? 'eager' : i === 1 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : i === 1 ? 'auto' : 'low'}
              sizes="100vw"
              quality={75}
              className={cn('object-cover', i === index && 'hero-kenburns')}
              style={{ objectPosition: item.focus }}
            />
          </div>
        ))}
      </div>

      {/* Theme-aware readability scrims. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,8,0.86)_0%,rgba(7,10,8,0.62)_40%,rgba(7,10,8,0.22)_72%,rgba(7,10,8,0.52)_100%)] dark:bg-[linear-gradient(90deg,rgba(5,8,6,0.9)_0%,rgba(5,8,6,0.68)_40%,rgba(5,8,6,0.28)_72%,rgba(5,8,6,0.62)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,8,0.72)_0%,rgba(7,10,8,0.12)_26%,rgba(7,10,8,0.08)_54%,rgba(7,10,8,0.92)_100%)] dark:bg-[linear-gradient(180deg,rgba(4,7,5,0.8)_0%,rgba(4,7,5,0.18)_28%,rgba(4,7,5,0.12)_54%,rgba(4,7,5,0.95)_100%)]"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-[1380px] items-center gap-10 px-5 pb-28 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:px-10 lg:pb-32 lg:pt-36">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/90 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
              Events · Home services · Venues
            </p>

            <h1 className="mt-6 font-display text-[clamp(2.55rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
              Every Celebration.
              <br />
              Every Corner.
              <span className="mt-1 block font-serif font-light italic text-gold-soft">
                One Perfect Place.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              From unforgettable events to trusted home services, discover everything you need to make
              life easier and every moment special.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/plan-event"
                className="group inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_40px_-16px_rgba(0,0,0,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f0d]"
              >
                Plan an Event
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/book/technician"
                className="group inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-colors duration-300 hover:border-white/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Book a Home Service
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <p className="mt-6 text-xs leading-5 text-white/60">
              One account · Verified professionals · No payment until you approve
            </p>
          </div>

          {/* Booking panel — stationary across every slide. */}
          <div className="w-full justify-self-start lg:justify-self-end">
            <HeroBookingPanel />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1380px] flex-wrap items-end justify-between gap-5 px-5 pb-7 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Choose a photograph">
            {HERO_SLIDES.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${item.label}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'relative h-1 overflow-hidden rounded-full bg-white/30 transition-all duration-300 hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f0d]',
                  i === index ? 'w-9 bg-white/35' : 'w-5',
                )}
              >
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full bg-gold-soft',
                      reduced ? 'w-full' : 'hero-progress',
                    )}
                    style={{ animationPlayState: paused ? 'paused' : 'running' }}
                  />
                )}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.22em] text-white/60">
            <span className="tabular-nums text-white/85">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <span className="h-px w-5 bg-white/25" aria-hidden="true" />
            <span className="normal-case tracking-[0.12em] text-white/70">{slide.label}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous photograph"
            className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next photograph"
            className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <a
            href="#paths"
            aria-label="Scroll to the two discovery paths"
            className="ml-1 hidden size-10 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white sm:flex"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Photograph {index + 1} of {count}: {slide.label}
      </p>
    </section>
  )
}
