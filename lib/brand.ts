/**
 * Heptome brand content.
 *
 * Single source for every marketing string that must stay identical wherever
 * it appears (hero, metadata, social cards, partner pages). Copy lives here so
 * the two business verticals can never drift apart between pages.
 */

export const brand = {
  name: 'Heptome',
  /** Used where a separator mark follows the wordmark ("Heptome."). */
  wordmark: 'Heptome',
  tagline: 'Everything for your moments and your home.',
  promise: 'Everything for your moments and your home.',
  headline: 'Celebrate Every Moment. Care for Every Corner.',
  heroSupport:
    'From unforgettable celebrations to reliable home services, discover everything you need with Heptome.',
  description:
    'Plan unforgettable events and book trusted home services, all in one place. From weddings and celebrations to everyday home care, Heptome makes it simple to discover, plan, and book.',
  primaryCta: 'Plan an Event',
  secondaryCta: 'Book a Home Service',
} as const

/** The two verticals, described once so nav, footer and cards stay consistent. */
export const verticals = {
  events: {
    id: 'events',
    label: 'Events',
    heading: 'Make Every Occasion Extraordinary',
    description:
      'Find venues, creative professionals, and event services to bring your celebration to life.',
    cta: 'Explore Event Services',
    href: '/events',
    planHref: '/plan-event',
    ctaLabel: brand.primaryCta,
  },
  home: {
    id: 'home-services',
    label: 'Home Services',
    heading: 'Expert Help at Your Doorstep',
    description:
      'Book trusted professionals for everyday home care, maintenance, and personal services.',
    cta: 'Explore Home Services',
    href: '/home-services',
    planHref: '/book/technician',
    ctaLabel: brand.secondaryCta,
  },
} as const

export type VerticalId = keyof typeof verticals
