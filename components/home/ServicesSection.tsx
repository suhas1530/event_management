'use client'

import {
  Briefcase,
  Camera,
  Flower2,
  Lightbulb,
  MapPin,
  Music,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { HOME_SERVICES } from '@/lib/home-content'

const ICONS: Record<string, LucideIcon> = {
  MapPin,
  Flower2,
  Utensils,
  Camera,
  Lightbulb,
  Music,
  Users,
  Briefcase,
}

export default function ServicesSection() {
  return (
    <section className="bg-ink-950 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="mb-14 max-w-2xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-violet-pale">Everything covered</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
            One team for every moving part.
          </h2>
        </div>

        <div data-reveal-group className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_SERVICES.map(service => {
            const Icon = ICONS[service.icon] ?? MapPin
            return (
              <div
                key={service.name}
                data-reveal-item
                className="group border border-white/8 bg-ink-800/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet/40 hover:bg-ink-800"
              >
                <span className="flex size-11 items-center justify-center border border-violet/25 bg-violet/10 text-violet-pale">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-medium text-slate-50">{service.name}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-dim">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
