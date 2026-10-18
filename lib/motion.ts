/**
 * Client-environment hooks for the immersive homepage.
 *
 * These are intentionally tiny and dependency-free so the 3D hero can gate on
 * them without pulling any part of Three.js into the initial bundle.
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
 * WebGL capability probe. Returns `null` until mounted (unknown), then
 * `true`/`false` so callers can render the static fallback immediately when
 * WebGL is unavailable instead of mounting a Canvas that can never paint.
 */
export function useWebGLAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl')
      setAvailable(Boolean(gl))
    } catch {
      setAvailable(false)
    }
  }, [])

  return available
}

export type QualityTier = 'high' | 'low'

/**
 * Rendering quality tier for the 3D scene.
 *
 * Starts at 'low' and only upgrades after measurement, so the first painted
 * frame is always the cheap one. Phones, tablets and any coarse-pointer device
 * stay on 'low' — fewer particles, simpler geometry, no cursor parallax.
 */
export function useQualityTier(): QualityTier {
  const [tier, setTier] = useState<QualityTier>('low')

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)')
    const narrow = window.matchMedia('(max-width: 767px)')
    const update = () => setTier(coarse.matches || narrow.matches ? 'low' : 'high')
    update()
    coarse.addEventListener('change', update)
    narrow.addEventListener('change', update)
    return () => {
      coarse.removeEventListener('change', update)
      narrow.removeEventListener('change', update)
    }
  }, [])

  return tier
}

/**
 * Observe an element and report once it has come near the viewport.
 * Used to defer-mount the venue preview canvas until it is actually needed.
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
