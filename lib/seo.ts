/**
 * Structured data helpers.
 *
 * Only facts the product can stand behind are emitted: the organisation's real
 * contact details, the two service lines it actually offers, and coverage it
 * actually serves. There are deliberately no ratings, review counts, price
 * ranges or availability claims — none of those are verified public data.
 */

import { brand } from './brand'
import { SUPPORTED_CITY } from './service-area'
import { siteConfig } from './site-config'

export function absoluteUrl(path = '/'): string {
  const base = siteConfig.url.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organization`,
    name: brand.name,
    url: absoluteUrl('/'),
    description: brand.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      availableLanguage: 'English',
      areaServed: 'IN',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    url: absoluteUrl('/'),
    name: brand.name,
    description: brand.description,
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    inLanguage: 'en-IN',
  }
}

export function serviceJsonLd(input: {
  name: string
  description: string
  path: string
  areaServed?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@id': `${absoluteUrl('/')}#organization` },
    areaServed: {
      '@type': input.areaServed === SUPPORTED_CITY ? 'City' : 'Country',
      name: input.areaServed ?? 'India',
    },
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/** Serialise JSON-LD for a <script> tag without allowing `</script>` breakout. */
export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
