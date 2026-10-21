'use client'

import { cn } from '@/lib/utils'

/**
 * Static stand-in for the Heptome Living World.
 *
 * Rendered when WebGL is unavailable, when the visitor prefers reduced motion,
 * while the lazy-loaded scene chunk downloads, and as the Suspense fallback.
 * It shows the same story as the 3D scene — a warmly lit celebration arch on
 * one side, a daylit home with a service corner on the other, joined by a
 * champagne threshold — using pure CSS so it costs nothing and cannot fail.
 */
export default function SceneFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="scene-fallback"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Overall room glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, rgba(23,21,29,0) 34%, rgba(213,174,121,0.06) 50%, rgba(250,248,244,0.05) 66%, rgba(23,21,29,0) 84%)',
        }}
      />

      {/* ── Celebration wing (left) ─────────────────────────────────── */}
      <div
        className="absolute left-[4%] top-1/2 h-[62vmin] w-[44vmin] -translate-y-1/2"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(213,174,121,0.22) 0%, rgba(139,92,246,0.12) 42%, rgba(15,13,20,0) 76%)',
        }}
      />
      <div className="absolute left-[16%] top-1/2 -translate-y-1/2">
        <div className="h-[26vmin] w-[26vmin] rounded-t-full border-2 border-hept-gold/45" />
        <div className="absolute inset-x-3 bottom-0 h-[18vmin] rounded-sm bg-[linear-gradient(180deg,rgba(213,174,121,0.16),rgba(23,21,29,0.9))]" />
        <div className="absolute inset-x-6 bottom-[3vmin] flex justify-between">
          {[0, 1, 2].map(i => (
            <span key={i} className="block size-[4.4vmin] rounded-full bg-white/12" />
          ))}
        </div>
      </div>

      {/* ── Home wing (right) ───────────────────────────────────────── */}
      <div
        className="absolute right-[6%] top-1/2 h-[54vmin] w-[46vmin] -translate-y-1/2"
        style={{
          background:
            'radial-gradient(58% 58% at 50% 42%, rgba(255,240,207,0.28) 0%, rgba(255,255,255,0.1) 40%, rgba(15,13,20,0) 76%)',
        }}
      />
      <div className="absolute right-[13%] top-[36%] h-[22vmin] w-[26vmin] border border-white/20 bg-[linear-gradient(180deg,rgba(255,243,214,0.5),rgba(255,243,214,0.14))]" />
      {/* Sofa + lamp silhouettes */}
      <div className="absolute bottom-[30%] right-[24%] h-[7vmin] w-[18vmin] rounded-sm bg-[#cdc4b6]/70" />
      <div className="absolute bottom-[30%] right-[22%] h-[4vmin] w-[3vmin] rounded-t-full bg-[#f6ead3]/80" />
      <div className="absolute bottom-[37%] right-[20%] h-[9vmin] w-[5vmin] rounded-sm bg-[#5c7a48]/60" />

      {/* ── Champagne threshold in the middle ───────────────────────── */}
      <div className="absolute inset-y-[22%] left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-hept-gold/60 to-transparent" />

      {/* Stage / room floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background: 'linear-gradient(180deg, rgba(15,13,20,0) 0%, rgba(23,21,29,0.88) 48%, #0f0d14 100%)',
        }}
      />
    </div>
  )
}
