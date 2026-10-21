/**
 * Redirect handling for post-login / post-registration navigation.
 *
 * Booking wizards push customers to `/login?redirect=<the wizard url>` when
 * they try to submit while signed out, so signing in must return them to the
 * exact step they left (the wizard keeps its own draft in sessionStorage).
 *
 * Only same-origin relative paths are honoured: `//evil.example` and absolute
 * URLs are rejected, so a crafted link cannot turn the login page into an open
 * redirect.
 */

export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value.startsWith('/\\')) return null
  return value
}

/** Read `?redirect=` (preferred) or `?next=` from a query string. */
export function readRedirectParam(search: string): string | null {
  const params = new URLSearchParams(search)
  return safeRedirect(params.get('redirect') ?? params.get('next'))
}
