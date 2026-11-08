/**
 * Small, dependency-free browser hooks shared by the marketing surfaces.
 * There is no WebGL capability probe here any more — the site is
 * photography-first and every visual works without a GPU.
 */
'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * True when the visitor asked their OS to reduce motion.
 * Starts as `false` so the server and first client render agree, then syncs.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}

/**
 * Observe an element and report once it has come near the viewport.
 * Used to defer non-critical imagery or mount work until it is needed.
 */
export function useInView<T extends HTMLElement>(
  rootMargin = '240px',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, inView]
}
