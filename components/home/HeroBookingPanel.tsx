'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { HOME_EVENT_TYPES } from '@/lib/home-content'

/**
 * Compact floating booking panel over the hero scene.
 *
 * On submit it hands the selections to the plan-event wizard via query params
 * (`?type=&date=&guests=`), where they are pre-filled into the real form —
 * nothing is stored locally and no request fires until the visitor continues.
 */
export default function HeroBookingPanel() {
  const router = useRouter()
  const [eventType, setEventType] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (eventType) params.set('type', eventType)
    if (date) params.set('date', date)
    if (guests) params.set('guests', guests)
    const query = params.toString()
    router.push(query ? `/plan-event?${query}` : '/plan-event')
  }

  const fieldClass =
    'w-full border border-white/12 bg-ink-900/80 px-3.5 py-3 text-sm text-slate-50 [color-scheme:dark] transition-colors duration-200 focus:border-violet focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/40'

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Start planning your event"
      className="glass-panel animate-float w-full max-w-[400px] p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
    >
      <p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-violet-pale">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Start your plan
      </p>

      <div className="flex flex-col gap-3.5">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-fg-dim">
            Event type
          </span>
          <select value={eventType} onChange={e => setEventType(e.target.value)} className={fieldClass}>
            <option value="">Any occasion</option>
            {HOME_EVENT_TYPES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-fg-dim">
              Date
            </span>
            <input
              type="date"
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-fg-dim">
              Guests
            </span>
            <input
              type="number"
              min={1}
              max={100000}
              inputMode="numeric"
              placeholder="120"
              value={guests}
              onChange={e => setGuests(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <button
          type="submit"
          className="gradient-cta mt-1 min-h-12 w-full px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_rgba(139,92,246,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(139,92,246,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-pale"
        >
          Check Availability
        </button>

        <p className="text-center text-[11px] leading-5 text-fg-mute">
          Free to start · No payment until you approve a plan
        </p>
      </div>
    </form>
  )
}
