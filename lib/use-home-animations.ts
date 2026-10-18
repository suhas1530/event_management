/**
 * The homepage scroll story.
 *
 * One GSAP context bound to the page root drives every section reveal:
 *   - [data-reveal]          single elements fading up as they enter
 *   - [data-reveal-group]    grids whose [data-reveal-item] children stagger in
 *   - [data-parallax="12"]   slow counter-scroll for imagery (scrubbed)
 *   - [data-step]            "How it works" steps that activate sequentially
 *   - [data-progress-line]   scrubbed timeline line (data-progress-line="x|y")
 *
 * Deliberately no pinning and no scroll hijacking — the page scrolls natively
 * and ScrollTrigger only observes. When `enabled` is false (reduced motion),
 * nothing is hidden or moved, so every section renders in its final state.
 */
'use client'

import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useHomeAnimations(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = root.current
    if (!el || !enabled) return

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-reveal]').forEach(node => {
        gsap.from(node, {
          y: 30,
          autoAlpha: 0,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: { trigger: node, start: 'top 86%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach(group => {
        const items = group.querySelectorAll<HTMLElement>('[data-reveal-item]')
        if (items.length === 0) return
        gsap.from(items, {
          y: 36,
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-parallax]').forEach(node => {
        const depth = Number(node.dataset.parallax ?? 10)
        gsap.fromTo(
          node,
          { yPercent: depth },
          {
            yPercent: -depth,
            ease: 'none',
            scrollTrigger: {
              trigger: node.parentElement ?? node,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      })

      el.querySelectorAll<HTMLElement>('[data-step]').forEach(step => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 80%',
          end: 'bottom 45%',
          onToggle: self => {
            step.dataset.active = self.isActive ? 'true' : 'false'
          },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-progress-line]').forEach(line => {
        const horizontal = line.dataset.progressLine === 'x'
        gsap.fromTo(
          line,
          horizontal ? { scaleX: 0 } : { scaleY: 0 },
          {
            ...(horizontal ? { scaleX: 1 } : { scaleY: 1 }),
            ease: 'none',
            scrollTrigger: {
              trigger: line.parentElement ?? line,
              start: 'top 75%',
              end: 'bottom 55%',
              scrub: true,
            },
          },
        )
      })
    }, el)

    return () => ctx.revert()
  }, [root, enabled])
}
