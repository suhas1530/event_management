'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import SiteShell from '@/components/layout/SiteShell'
import ErrorState from '@/components/shared/ErrorState'
import { buttonClass } from '@/lib/button-styles'

/**
 * Route-level error boundary (Part 35).
 *
 * Catches render/runtime failures anywhere below the root layout and shows the
 * product's own error treatment with a working retry, instead of Next's
 * unstyled "Application error" document. `digest` is only logged — never shown.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error.digest ?? '', error.message)
  }, [error])

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-20 lg:py-28">
        <ErrorState
          title="We hit a snag."
          description="Something went wrong on our side while loading this page. Try again — if it keeps happening, let us know."
          onRetry={reset}
          retryLabel="Reload this page"
          className="border-0 bg-transparent px-0"
        />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClass('secondary', 'lg')}>
            Back to home
          </Link>
          <Link href="/help" className={buttonClass('ghost', 'lg')}>
            Visit the help centre
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}