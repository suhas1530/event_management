/**
 * Central site configuration.
 *
 * Every brand string, navigation target and third-party URL used across the
 * marketing site lives here so nothing is hard-coded in a component.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIGURE ME
 * ─────────────────────────────────────────────────────────────────────────────
 * `contact.email`  → the mailbox that receives enquiries (set the address that
 *                    the team actually monitors before launch).
 * `social`         → add the real profile URLs. Entries left as `''` render as
 *                    plain (non-navigating) labels so we never ship dead links.
 * `developer.url`  → the official SoftixTech website. Empty by default: the
 *                    credit renders as plain text until a URL is provided.
 */

import { brand, verticals } from './brand'
import { SERVICE_AREA_NAMES, SUPPORTED_CITY } from './service-area'

export const siteConfig = {
  /** Product brand — must stay the dominant identity of the product. */
  name: brand.name,
  legalName: brand.name,
  wordmark: brand.wordmark,
  tagline: brand.tagline,
  description: brand.description,
  headline: brand.headline,
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  locale: 'en_IN',

  contact: {
    email: 'hello@heptome.in',
    phone: '+91 80501 71547',
    phoneHref: 'tel:+918050171547',
    whatsappHref: 'https://wa.me/918050171547',
    /** Support hours shown on the contact page. */
    supportHours: 'Mon – Sat · 9:00 AM – 8:00 PM IST',
  },

  /**
   * Social profiles. Empty string = not configured yet, so we render a
   * non-navigating label instead of a broken `#` link.
   */
  social: {
    instagram: '',
    linkedin: '',
    facebook: '',
    youtube: '',
  },

  /**
   * Technology / development partner. Surfaced subtly in the footer.
   * Set `url` to the official SoftixTech site to make the credit a link.
   */
  developer: {
    name: 'SoftixTech',
    tagline: 'Next Gen IT Company',
    description:
      'Building modern digital experiences, scalable platforms and technology solutions for businesses.',
    url: '',
  },

  /** Coverage headline used by the location selector and coverage messages. */
  coverage: {
    city: SUPPORTED_CITY,
    areas: SERVICE_AREA_NAMES,
  },
} as const

export type SocialKey = keyof typeof siteConfig.social

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
}

export const SOCIAL_ORDER: SocialKey[] = ['instagram', 'linkedin', 'facebook', 'youtube']

/* ------------------------------------------------------------------ */
/* Footer navigation                                                   */
/* ------------------------------------------------------------------ */

export interface FooterLink {
  label: string
  href: string
  /** Marks links that open in a new tab. */
  external?: boolean
}

export const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Events',
    links: [
      { label: 'Explore Events', href: '/events' },
      { label: 'Venues & Banquet Halls', href: '/venues' },
      { label: 'Plan an Event', href: '/plan-event' },
      { label: 'Event Design Studio', href: '/ai-event-designer' },
    ],
  },
  {
    title: 'Home Services',
    links: [
      { label: 'All Home Services', href: '/home-services' },
      { label: 'Book a Service', href: '/book/technician' },
      { label: 'Cleaning & Pest Control', href: '/home-services#cleaning' },
      { label: 'AC & Appliance Repair', href: '/home-services#appliance' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Become a Professional', href: '/become-a-professional' },
      { label: 'Become an Event Partner', href: '/become-an-event-partner' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Support', href: '/contact' },
      { label: 'FAQs', href: '/help#faqs' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Primary navigation                                                  */
/* ------------------------------------------------------------------ */

export interface NavItem extends FooterLink {
  /** Rendered as a dropdown on desktop and a labelled group on mobile. */
  children?: FooterLink[]
  /** Short supporting line used by the mobile drawer. */
  hint?: string
}

/**
 * Header navigation. Deliberately short: the two partner journeys share one
 * "Partners" entry so the bar never becomes a wall of links (master prompt
 * section 2), while both remain one tap away on mobile.
 */
export const navLinks: NavItem[] = [
  { label: 'Events', href: verticals.events.href, hint: 'Venues, décor, catering and planners' },
  { label: 'Home Services', href: verticals.home.href, hint: 'Cleaning, repair and personal care at home' },
  { label: 'Venues', href: '/venues' },
  {
    label: 'Partners',
    href: '/become-a-professional',
    children: [
      { label: 'Become a Professional', href: '/become-a-professional' },
      { label: 'Become an Event Partner', href: '/become-an-event-partner' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

/** Mobile drawer: the two verticals are called out separately, then the rest. */
export const mobileNavLinks: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: verticals.events.href, hint: verticals.events.description },
  { label: 'Home Services', href: verticals.home.href, hint: verticals.home.description },
  { label: 'Venues', href: '/venues' },
  { label: 'Become a Professional', href: '/become-a-professional' },
  { label: 'Become an Event Partner', href: '/become-an-event-partner' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

/** Footer bottom-bar links. */
export const legalLinks: FooterLink[] = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Help', href: '/help' },
]
