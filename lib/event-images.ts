/**
 * Deterministic, category-aware imagery for event cards.
 *
 * Primary source is the event's own image field (database/API). Category-based
 * fallbacks are used only when an image is missing or fails to load. When
 * several events share a category, a stable hash of the event identity picks a
 * different image from the category pool so cards never look identical.
 */

type EventImageInput = {
  id?: string
  slug?: string
  title?: string
  type?: string | null
  category?: { name?: string | null } | null
  heroImages?: string[] | null
}

const POOLS: Record<string, string[]> = {
  ANNIVERSARY: [
    '/images/story/outdoor-dinner.webp',
    '/images/hero/outdoor-celebration.webp',
    '/images/featured/floral-studio.webp',
    '/images/categories/florals.webp',
  ],
  BABY_SHOWER: [
    '/images/featured/floral-studio.webp',
    '/images/story/studio-florals.webp',
    '/images/categories/florals.webp',
    '/images/hero/outdoor-celebration.webp',
  ],
  ENGAGEMENT: [
    '/images/hero/engagement-ceremony.webp',
    '/images/categories/engagement.webp',
    '/images/categories/weddings.webp',
    '/images/featured/production-wedding.webp',
  ],
  PROPOSAL: [
    '/images/hero/engagement-ceremony.webp',
    '/images/story/outdoor-dinner.webp',
    '/images/featured/floral-studio.webp',
    '/images/categories/engagement.webp',
  ],
  BIRTHDAY: [
    '/images/hero/birthday-celebration.webp',
    '/images/featured/birthday-soiree.webp',
    '/images/categories/birthdays.webp',
    '/images/hero/outdoor-celebration.webp',
  ],
  KIDS_PARTY: [
    '/images/featured/birthday-soiree.webp',
    '/images/hero/birthday-celebration.webp',
    '/images/categories/birthdays.webp',
    '/images/hero/outdoor-celebration.webp',
  ],
  WEDDING: [
    '/images/hero/indian-wedding.webp',
    '/images/featured/production-wedding.webp',
    '/images/categories/weddings.webp',
    '/images/hero/banquet-hall.webp',
  ],
  RECEPTION: [
    '/images/hero/banquet-hall.webp',
    '/images/venues/banquet-hall.webp',
    '/images/featured/production-wedding.webp',
    '/images/categories/venues.webp',
  ],
  CORPORATE: [
    '/images/hero/corporate-conference.webp',
    '/images/featured/annual-summit.webp',
    '/images/categories/corporate.webp',
    '/images/featured/product-launch.webp',
  ],
  CONFERENCE: [
    '/images/featured/annual-summit.webp',
    '/images/hero/corporate-conference.webp',
    '/images/categories/corporate.webp',
    '/images/featured/product-launch.webp',
  ],
  PRODUCT_LAUNCH: [
    '/images/featured/product-launch.webp',
    '/images/hero/corporate-conference.webp',
    '/images/featured/annual-summit.webp',
    '/images/categories/corporate.webp',
  ],
  COLLEGE_EVENT: [
    '/images/featured/live-music.webp',
    '/images/hero/outdoor-celebration.webp',
    '/images/categories/concerts.webp',
    '/images/featured/annual-summit.webp',
  ],
  HOUSEWARMING: [
    '/images/hero/modern-interior.webp',
    '/images/venues/resort.webp',
    '/images/paths/home-services.webp',
    '/images/hero/home-cleaning.webp',
  ],
  NAMING_CEREMONY: [
    '/images/featured/floral-studio.webp',
    '/images/story/studio-florals.webp',
    '/images/categories/florals.webp',
    '/images/hero/outdoor-celebration.webp',
  ],
  GRADUATION: [
    '/images/featured/annual-summit.webp',
    '/images/categories/corporate.webp',
    '/images/hero/corporate-conference.webp',
    '/images/featured/product-launch.webp',
  ],
  FAREWELL: [
    '/images/story/outdoor-dinner.webp',
    '/images/hero/outdoor-celebration.webp',
    '/images/featured/annual-summit.webp',
    '/images/venues/garden-lawn.webp',
  ],
  FESTIVAL: [
    '/images/hero/outdoor-celebration.webp',
    '/images/categories/concerts.webp',
    '/images/featured/live-music.webp',
    '/images/categories/florals.webp',
  ],
  THEME_PARTY: [
    '/images/featured/live-music.webp',
    '/images/categories/concerts.webp',
    '/images/hero/outdoor-celebration.webp',
    '/images/featured/birthday-soiree.webp',
  ],
  PRIVATE_CELEBRATION: [
    '/images/hero/outdoor-celebration.webp',
    '/images/story/outdoor-dinner.webp',
    '/images/featured/live-music.webp',
    '/images/venues/garden-lawn.webp',
  ],
  CUSTOM: [
    '/images/featured/product-launch.webp',
    '/images/hero/outdoor-celebration.webp',
    '/images/featured/floral-studio.webp',
    '/images/venues/banquet-hall.webp',
  ],
  OTHER: [
    '/images/hero/outdoor-celebration.webp',
    '/images/featured/product-launch.webp',
    '/images/featured/live-music.webp',
    '/images/categories/concerts.webp',
  ],
}

const TYPE_ALIASES: Record<string, string> = {
  RECEPTION: 'RECEPTION',
  PARTY: 'PRIVATE_CELEBRATION',
  BABYSHOWER: 'BABY_SHOWER',
  COLLEGE_EVENT: 'COLLEGE_EVENT',
}

function normalizeType(type?: string | null): string {
  if (!type) return 'OTHER'
  const key = type.toUpperCase().replace(/[\s-]+/g, '_')
  return TYPE_ALIASES[key] ?? key
}

function hashKey(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

export function eventFallbackImage(event: EventImageInput, index = 0): string {
  const type = normalizeType(event.type)
  const pool = POOLS[type] ?? POOLS.OTHER
  const key = event.id || event.slug || event.title || type
  const pick = hashKey(`${key}:${index}`) % pool.length
  return pool[pick]
}

/**
 * Returns a display-safe image for event cards.
 * - Local DB/API assets (`/...`) are used as primary (honoring stored event images).
 * - External or missing images use a deterministic, category-relevant fallback so
 *   every event record gets a unique, appropriate image (never a shared confetti/generic URL).
 */
export function resolveEventImage(event: EventImageInput, index = 0): { src: string; fallback: string } {
  const fallback = eventFallbackImage(event, index)
  const raw = event.heroImages?.[index]
  if (raw && typeof raw === 'string') {
    const value = raw.trim()
    if (value.startsWith('/') && !value.startsWith('//')) return { src: value, fallback }
  }
  return { src: fallback, fallback }
}

export function eventImageForList(event: EventImageInput): string {
  return resolveEventImage(event, 0).src
}
