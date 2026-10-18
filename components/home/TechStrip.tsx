'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOME_TECH_LINKS } from '@/lib/home-content'

/**
 * Slim band that keeps avān's home-services side one tap away from the
 * event-focused homepage.
 */
export default function TechStrip() {
  return (
    <section className="border-y border-hairline/60 bg-ink-900/40 px-5 py-10 sm:px-10">
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-center gap-x-6 gap-y-4">
        <p className="text-sm text-fg-dim">
          Also on avān — <span className="text-slate-50">verified home professionals</span>
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {HOME_TECH_LINKS.map(item => (
            <Link
              key={item.label}
              href={`/book/technician?category=${item.category}`}
              className="border border-white/12 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-fg-dim transition-colors duration-200 hover:border-violet/40 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/services"
          className="group ml-auto inline-flex items-center gap-2 text-sm font-medium text-violet-pale transition-colors hover:text-white"
        >
          All home services
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
