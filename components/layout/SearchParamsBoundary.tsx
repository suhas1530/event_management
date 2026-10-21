'use client'

import { Suspense, type ReactNode } from 'react'

interface SearchParamsBoundaryProps {
  children: ReactNode
  /**
   * Shown while the client bundle boots and the query string is read.
   * Should match the shape of the real content so the page does not jump.
   */
  fallback?: ReactNode
}

/**
 * Suspense boundary for pages that read the query string.
 *
 * `useSearchParams()` opts a component out of static prerendering, and Next
 * requires such a component to sit inside a Suspense boundary. Mount this
 * *inside* `SiteShell` so the navbar and footer still server-render — only the
 * results region waits, which keeps the first paint meaningful.
 */
export default function SearchParamsBoundary({ children, fallback }: SearchParamsBoundaryProps) {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-10" role="status">
            <span className="sr-only">Loading…</span>
            <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
            <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-muted/60" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl border border-border-subtle bg-muted/50" />
              ))}
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}
