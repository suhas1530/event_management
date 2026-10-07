/**
 * Central site configuration.
 *
 * Every brand string, navigation target and third-party URL used across the
 * marketing site lives here so nothing is hard-coded in a component.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIGURE ME
 * ─────────────────────────────────────────────────────────────────────────────
 * `social`      → add the real profile URLs. Entries left as `''` render as
 *                 plain (non-navigating) labels so we never ship dead links or
 *                 invent URLs that do not exist yet.
 * `developer.url` → the official SoftixTech website. Empty by default: the
 *                 credit renders as plain text until a URL is provided.
 */

export const siteConfig = {
  /** Product brand — must stay the dominant identity of the product. */
  name: 'avān.',
  legalName: 'avān.',
  tagline: 'Your moment, perfectly designed.',
  description:
    'Book verified professionals for your home, or let our event experts design your next celebration — from everyday repairs to unforgettable events.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://avan.events',
  locale: 'en_IN',

  contact: {
    email: 'hello@avan.events',
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
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Services', href: '/services' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Technician Services', href: '/book/technician' },
      { label: 'Event Management', href: '/plan-event' },
      { label: 'Event Design Studio', href: '/ai-event-designer' },
      { label: 'All Services', href: '/services' },
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

export const navLinks: FooterLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Technicians', href: '/book/technician' },
  { label: 'Events', href: '/plan-event' },
  { label: 'How It Works', href: '/#how' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

/** Footer bottom-bar links. */
export const legalLinks: FooterLink[] = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Help', href: '/help' },
]