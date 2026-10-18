'use client'

import { cn } from '@/lib/utils'

/**
 * Static visual stand-in for the 3D hero.
 *
 * Rendered when WebGL is unavailable, when the visitor prefers reduced motion,
 * while the lazy-loaded scene chunk is downloading, and as the Suspense
 * fallback inside the Canvas. Pure CSS — no assets, no JS animation.
 */
export default function SceneFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Ambient violet + champagne glows */}
      <div
        className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(240,184,110,0.08) 38%, rgba(8,9,13,0) 70%)',
        }}
      />
      <div
        className="absolute right-[8%] top-[18%] h-[34vmin] w-[34vmin]"
        style={{
          background:
            'radial-gradient(circle, rgba(240,184,110,0.16) 0%, rgba(8,9,13,0) 70%)',
        }}
      />

      {/* Sculptural rings */}
      <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2">
        <div className="size-[62vmin] rounded-full border border-violet/25" />
        <div className="absolute inset-[9%] rounded-full border border-champagne/15" />
        <div className="absolute inset-[22%] rounded-full border border-white/8" />
      </div>

      {/* Stage floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,9,13,0) 0%, rgba(16,18,26,0.85) 45%, #08090d 100%)',
        }}
      />
    </div>
  )
}
