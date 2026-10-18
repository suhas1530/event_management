'use client'

import { HOME_STEPS } from '@/lib/home-content'

/**
 * Four-step planning timeline. A vertical line on mobile and horizontal line
 * on desktop fill as the section scrolls (scrubbed), and each step brightens
 * when it becomes the active one — driven by `useHomeAnimations`.
 */
export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-hairline/60 bg-ink-900/40 px-5 py-24 sm:px-10 lg:py-32">
      <div className="mx-auto max-w-[1380px]">
        <div data-reveal className="mb-16 max-w-2xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-violet-pale">How it works</p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-slate-50">
            Four steps from idea to standing ovation.
          </h2>
        </div>

        <div className="relative">
          {/* Track lines */}
          <span aria-hidden="true" className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-hairline lg:hidden" />
          <span
            aria-hidden="true"
            data-progress-line="y"
            className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px origin-top bg-gradient-to-b from-violet to-violet/30 lg:hidden"
          />
          <span aria-hidden="true" className="absolute left-0 right-0 top-[5px] hidden h-px bg-hairline lg:block" />
          <span
            aria-hidden="true"
            data-progress-line="x"
            className="absolute left-0 right-0 top-[5px] hidden h-px origin-left bg-gradient-to-r from-violet via-violet/70 to-champagne lg:block"
          />

          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
            {HOME_STEPS.map(step => (
              <li key={step.step} data-step="false" className="relative pl-8 lg:pl-0 lg:pt-10">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 flex size-[11px] items-center justify-center rounded-full border border-violet/50 bg-ink-950 lg:top-0"
                >
                  <span className="size-[5px] rounded-full bg-violet" />
                </span>
                <p className="font-display text-4xl font-semibold text-violet/35">{step.step}</p>
                <h3 className="mt-3 text-lg font-medium text-slate-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-dim">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
