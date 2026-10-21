import { siteConfig } from '@/lib/site-config'

/**
 * Minimal SoftixTech credit for the authentication screens.
 *
 * The auth pages have no footer, so without this the developer credit would be
 * invisible on the very first screen a new user sees. It is intentionally the
 * quietest possible treatment: muted text, no monogram, no motion — it reads as
 * a fine-print line, not a second brand. The Heptome identity stays dominant.
 */
export default function AuthPoweredBy() {
  const { name, tagline, url } = siteConfig.developer

  return (
    <p className="mt-8 text-center text-[0.6875rem] tracking-wide text-muted-foreground/80">
      Technology by{' '}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
        >
          {name}
        </a>
      ) : (
        // No official URL configured yet — plain text rather than a dead link.
        <span className="text-muted-foreground">{name}</span>
      )}{' '}
      <span className="text-muted-foreground/80">· {tagline}</span>
    </p>
  )
}
