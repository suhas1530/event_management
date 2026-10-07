import { siteConfig } from '@/lib/site-config'

/**
 * Minimal SoftixTech credit for the authentication screens.
 *
 * The auth pages have no footer, so without this the developer credit would be
 * invisible on the very first screen a new user sees. It is intentionally the
 * quietest possible treatment: muted text, no monogram, no motion — it reads as
 * a fine-print line, not a second brand. The avān. identity stays dominant.
 */
export default function AuthPoweredBy() {
  const { name, tagline, url } = siteConfig.developer

  return (
    <p className="mt-8 text-center text-[0.6875rem] tracking-wide text-white/25">
      Technology by{' '}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded text-white/40 underline-offset-4 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
        >
          {name}
        </a>
      ) : (
        // No official URL configured yet — plain text rather than a dead link.
        <span className="text-white/40">{name}</span>
      )}{' '}
      <span className="text-white/20">· {tagline}</span>
    </p>
  )
}
