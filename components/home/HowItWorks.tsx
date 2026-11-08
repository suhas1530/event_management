'use client'

import { useState } from 'react'
import { CalendarHeart, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVENT_STEPS, HOME_STEPS, type HomeStep } from '@/lib/home-content'

type Journey = 'events' | 'home'

const JOURNEYS: { id: Journey; label: string; steps: HomeStep[]; blurb: string }[] = [
  {
    id: 'events',
    label: 'Planning an event',
    steps: EVENT_STEPS,
    blurb:
      'Enquiry first, never a forced instant booking: you approve the venues, services and pricing before anything is confirmed.',
  },
  {
    id: 'home',
    label: 'Booking a home service',
    steps: HOME_STEPS,
    blurb:
      'Slot-based and priced up front: the service, your address and a two-hour window are agreed before a professional is assigned.',
  },
]

/**
 * How it works — both journeys, one section.
 *
 * The two verticals run genuinely different processes (a quoted event enquiry
 * versus a slot booking), so they get separate timelines behind a switcher
 * instead of one blended list that would describe neither honestly.
 */
export default function HowItWorks() {
  const [journey, setJourney] = useState<Journey>('events')
  const active = JOURNEYS.find(item => item.id === journey) ?? JOURNEYS[0]
  const steps = active.steps

  return (
    <section
      id="how"
      className="scroll-mt-20 border-b border-border bg-background px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-gold-text">How it works</p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground">
              Two journeys, both this simple.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{active.blurb}</p>
          </div>

          <div
            role="group"
            aria-label="Choose a journey"
            className="inline-flex rounded-xl border border-border bg-muted/50 p-1"
          >
            {JOURNEYS.map(item => {
              const Icon = item.id === 'events' ? CalendarHeart : Wrench
              const selected = item.id === journey
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setJourney(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div key={journey} className="relative">
          <span aria-hidden="true" className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-border lg:hidden" />
          <span
            aria-hidden="true"
           
            className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px origin-top bg-gradient-to-b from-primary to-primary/30 lg:hidden"
          />
          <span aria-hidden="true" className="absolute left-0 right-0 top-[5px] hidden h-px bg-border lg:block" />
          <span
            aria-hidden="true"
           
            className="absolute left-0 right-0 top-[5px] hidden h-px origin-left bg-gradient-to-r from-primary via-primary/70 to-gold lg:block"
          />

          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
            {steps.map(step => (
              <li key={step.step} className="relative pl-8 lg:pl-0 lg:pt-10">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 flex size-[11px] items-center justify-center rounded-full border border-primary/50 bg-background lg:top-0"
                >
                  <span className="size-[5px] rounded-full bg-primary" />
                </span>
                <p aria-hidden="true" className="font-display text-4xl font-semibold text-primary/60">{step.step}</p>
                <h3 className="mt-3 text-lg font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
