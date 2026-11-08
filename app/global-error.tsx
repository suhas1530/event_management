'use client'

/**
 * Last-resort error boundary (Part 35).
 *
 * Replaces the whole document, so it cannot use the app shell, fonts or the
 * error logger — it renders its own minimal, self-contained page. Only fires if
 * the root layout itself throws.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#101613',
          color: '#f4f0e8',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          padding: '2rem',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#d98a63',
              margin: 0,
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.15, margin: '1rem 0 0' }}>
            We couldn’t load Heptome.
          </h1>
          <p style={{ color: 'rgba(244,240,232,0.62)', lineHeight: 1.7, margin: '1rem 0 0' }}>
            The application hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              cursor: 'pointer',
              border: 0,
              borderRadius: '0.5rem',
              background: '#d98a63',
              color: '#1a0f09',
              fontWeight: 600,
              padding: '0.875rem 1.75rem',
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ color: 'rgba(244,240,232,0.4)', fontSize: '0.75rem', marginTop: '2rem' }}>
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}