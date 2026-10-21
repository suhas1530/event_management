/**
 * The Heptome service catalog — the single source of truth for both verticals.
 *
 * Everything the marketing pages display about a service (its name, its
 * sub-services, and which booking category it starts) is defined here once and
 * imported by the homepage, the discovery panels, the home-services landing
 * page and the services index. Prices are **never** stored here: the only price
 * Heptome shows is the one the API returns for the selected service, so the
 * marketing pages and the booking flow can never quote two different numbers.
 *
 * `bookingCategory` is the value understood by the booking API
 * (`TechnicianCategory` in lib/api.ts). A card without one is a service line
 * Heptome does not take bookings for yet — those cards open an enquiry form
 * instead of a wizard that could not be completed.
 */

import type { TechnicianCategory } from './api'

export interface CatalogServiceLine {
  name: string
  /** Shown as the card's supporting line on the landing page. */
  note?: string
}

export interface HomeCatalogGroup {
  id: string
  name: string
  /** Compact label for chips, nav rows and card titles in tight layouts. */
  shortName: string
  blurb: string
  /** lucide-react icon name, resolved in the component that renders it. */
  icon: string
  services: CatalogServiceLine[]
  /**
   * Booking category accepted by `POST /technicians/bookings`. Omitted when the
   * service line is not bookable yet (the card falls back to an enquiry).
   */
  bookingCategory?: TechnicianCategory
  /** Which promotional modules this group appears in. */
  tags: Array<'popular' | 'new' | 'cleaning' | 'salon' | 'appliance' | 'repair' | 'improvement' | 'smart'>
}

export const HOME_CATALOG: HomeCatalogGroup[] = [
  {
    id: 'cleaning',
    shortName: 'Deep cleaning',
    name: 'Full Home & Deep Cleaning',
    blurb: 'Whole-home deep cleaning, bathroom and kitchen detailing by trained crews.',
    icon: 'Sparkles',
    bookingCategory: 'CLEANING',
    tags: ['popular', 'cleaning'],
    services: [
      { name: 'Full home deep cleaning' },
      { name: 'Bathroom deep cleaning' },
      { name: 'Kitchen deep cleaning' },
      { name: 'Sofa and carpet shampooing' },
      { name: 'Chimney and refrigerator cleaning' },
    ],
  },
  {
    id: 'pest-control',
    shortName: 'Pest control',
    name: 'Pest Control',
    blurb: 'Cockroach, termite, rodent and bed-bug treatments with follow-up support.',
    icon: 'Bug',
    bookingCategory: 'PEST_CONTROL',
    tags: ['popular', 'cleaning'],
    services: [
      { name: 'General pest control' },
      { name: 'Termite treatment' },
      { name: 'Rodent control' },
      { name: 'Bed bug treatment' },
    ],
  },
  {
    id: 'salon-women',
    shortName: "Women's salon",
    name: "Women's Salon & Spa",
    blurb: 'Salon and spa appointments at home, with the service menu confirmed before the visit.',
    icon: 'Flower2',
    tags: ['salon', 'new'],
    services: [
      { name: 'Salon services at home' },
      { name: 'Spa and wellness therapies' },
      { name: 'Hair treatments and styling' },
    ],
  },
  {
    id: 'salon-men',
    shortName: "Men's grooming",
    name: "Men's Grooming & Massage",
    blurb: 'Grooming, haircut and wellness appointments in your own home.',
    icon: 'Scissors',
    tags: ['salon'],
    services: [
      { name: 'Haircut and beard grooming' },
      { name: 'Massage and wellness' },
      { name: 'Hair colour and care' },
    ],
  },
  {
    id: 'ac-service',
    shortName: 'AC service',
    name: 'AC Service & Repair',
    blurb: 'Servicing, installation, gas refill and repair across major brands.',
    icon: 'Wind',
    bookingCategory: 'AC_SERVICE',
    tags: ['popular', 'appliance'],
    services: [
      { name: 'AC servicing' },
      { name: 'AC installation and uninstall' },
      { name: 'Gas refill and leak repair' },
      { name: 'Deep cleaning and PCB repair' },
    ],
  },
  {
    id: 'appliance-repair',
    shortName: 'Appliance repair',
    name: 'Appliance Repair',
    blurb: 'Washing machine, refrigerator, geyser, microwave and television repairs.',
    icon: 'WashingMachine',
    bookingCategory: 'APPLIANCE_REPAIR',
    tags: ['appliance'],
    services: [
      { name: 'Washing machine repair' },
      { name: 'Refrigerator repair' },
      { name: 'Geyser and water heater service' },
      { name: 'Television check-up' },
    ],
  },
  {
    id: 'electrical',
    shortName: 'Electrical',
    name: 'Electrical Services',
    blurb: 'Switches, sockets, fans, lighting, wiring and panel work by licensed electricians.',
    icon: 'Zap',
    bookingCategory: 'ELECTRICAL',
    tags: ['popular', 'repair'],
    services: [
      { name: 'Switch and socket repair' },
      { name: 'Fan repair and installation' },
      { name: 'Light fitting and wiring' },
      { name: 'MCB and fuse box work' },
    ],
  },
  {
    id: 'plumbing',
    shortName: 'Plumbing',
    name: 'Plumbing',
    blurb: 'Tap repairs, leakages, bathroom fittings, water tanks and new installations.',
    icon: 'Droplets',
    bookingCategory: 'PLUMBING',
    tags: ['popular', 'repair'],
    services: [
      { name: 'Tap and mixer repair' },
      { name: 'Pipe leakage and drainage' },
      { name: 'Bathroom plumbing' },
      { name: 'Water tank and motor work' },
    ],
  },
  {
    id: 'carpentry',
    shortName: 'Carpentry',
    name: 'Carpentry & Furniture',
    blurb: 'Furniture repair, doors, windows, wardrobes, shelves and fittings.',
    icon: 'Hammer',
    bookingCategory: 'CARPENTRY',
    tags: ['repair'],
    services: [
      { name: 'Furniture repair' },
      { name: 'Door and window fixing' },
      { name: 'Shelf and cupboard installation' },
      { name: 'Wardrobe and cabinet assembly' },
    ],
  },
  {
    id: 'painting',
    shortName: 'Painting',
    name: 'Painting & Waterproofing',
    blurb: 'Interior and exterior painting, texture finishes and waterproofing.',
    icon: 'Paintbrush2',
    bookingCategory: 'PAINTING',
    tags: ['improvement'],
    services: [
      { name: 'Interior painting' },
      { name: 'Exterior painting' },
      { name: 'Texture and accent walls' },
      { name: 'Waterproofing' },
    ],
  },
  {
    id: 'security',
    shortName: 'CCTV & security',
    name: 'CCTV & Home Security',
    blurb: 'Camera installation, DVR/NVR setup and maintenance.',
    icon: 'Shield',
    bookingCategory: 'CCTV_INSTALLATION',
    tags: ['smart'],
    services: [
      { name: 'CCTV installation' },
      { name: 'DVR/NVR configuration' },
      { name: 'Remote viewing setup' },
    ],
  },
  {
    id: 'computer',
    shortName: 'Computer repair',
    name: 'Computer & Network Repair',
    blurb: 'Laptop, desktop, printer and Wi-Fi troubleshooting at home.',
    icon: 'Laptop',
    bookingCategory: 'COMPUTER_REPAIR',
    tags: ['repair'],
    services: [
      { name: 'Laptop and desktop repair' },
      { name: 'Printer service' },
      { name: 'Wi-Fi and networking setup' },
    ],
  },
  {
    id: 'wall-panels',
    shortName: 'Wall panels',
    name: 'Wall Panels & Interiors',
    blurb: 'Wall panelling and interior upgrade consultations with an on-site estimate.',
    icon: 'Layers',
    tags: ['improvement', 'new'],
    services: [
      { name: 'Wall panelling' },
      { name: 'Accent walls and cladding' },
      { name: 'Interior improvement consultation' },
    ],
  },
  {
    id: 'water-purifier',
    shortName: 'Purifiers & smart home',
    name: 'Water Purifiers & Smart Home',
    blurb: 'Water purifier service and smart-home installation and maintenance.',
    icon: 'Droplet',
    tags: ['smart', 'new'],
    services: [
      { name: 'Water purifier installation' },
      { name: 'Water purifier service' },
      { name: 'Smart lock installation' },
    ],
  },
]

export type PromoModuleId = HomeCatalogGroup['tags'][number]

export const PROMO_MODULE_LABELS: Record<PromoModuleId, string> = {
  popular: 'Popular home services',
  new: 'New and noteworthy',
  cleaning: 'Cleaning essentials',
  salon: 'Salon and spa at home',
  appliance: 'Appliance repair',
  repair: 'Home repair and installation',
  improvement: 'Painting, waterproofing and interiors',
  smart: 'Smart home and products',
}

export function homeGroupsByTag(tag: PromoModuleId): HomeCatalogGroup[] {
  return HOME_CATALOG.filter(group => group.tags.includes(tag))
}

export function homeGroupById(id: string): HomeCatalogGroup | undefined {
  return HOME_CATALOG.find(group => group.id === id)
}

/** Bookable groups only — used where a card must start a real booking. */
export const BOOKABLE_HOME_GROUPS = HOME_CATALOG.filter(group => Boolean(group.bookingCategory))

/**
 * Service lines Heptome advertises but cannot yet take an instant booking for.
 * Cards for these open an enquiry instead of a bookable wizard, so a customer
 * is never sent down a flow that has no matching backend category.
 */
export const ENQUIRY_HOME_GROUPS = HOME_CATALOG.filter(group => !group.bookingCategory)

/**
 * Event service lines, grouped the way the planning wizard groups them.
 * `wizardGroup` must match a key of the plan-event wizard's SERVICE_GROUPS so a
 * card can pre-select the customer's area of interest in a valid state.
 */
export interface EventServiceCategory {
  id: string
  name: string
  blurb: string
  icon: string
  wizardGroup: string
}

export const EVENT_SERVICE_CATEGORIES: EventServiceCategory[] = [
  { id: 'venue', name: 'Venues & Banquet Halls', blurb: 'Halls, resorts and outdoor venues matched to your guest list.', icon: 'MapPin', wizardGroup: 'Venue' },
  { id: 'catering', name: 'Catering & Food', blurb: 'Menus across cuisines, live counters and dietary requirements.', icon: 'Utensils', wizardGroup: 'Catering' },
  { id: 'decoration', name: 'Decoration & Floral Design', blurb: 'Stage, entrance, table and floral design built around your theme.', icon: 'Flower2', wizardGroup: 'Decoration' },
  { id: 'stage-lighting', name: 'Stage, Lighting & Sound', blurb: 'Stage builds, lighting design and concert-grade audio.', icon: 'Lightbulb', wizardGroup: 'Other' },
  { id: 'photo-video', name: 'Photography & Videography', blurb: 'Candid, traditional, cinematic and drone coverage.', icon: 'Camera', wizardGroup: 'Photography' },
  { id: 'entertainment', name: 'Entertainment', blurb: 'DJs, live bands, anchors, performers and kids entertainment.', icon: 'Music', wizardGroup: 'Entertainment' },
  { id: 'invitations', name: 'Invitations & Guest Management', blurb: 'Digital and printed invitations, RSVPs and guest hospitality.', icon: 'Mail', wizardGroup: 'Invitations' },
  { id: 'styling', name: 'Personal Styling', blurb: 'Bridal and groom makeup, hair styling and look design.', icon: 'Sparkles', wizardGroup: 'Personal styling' },
  { id: 'equipment', name: 'Event Equipment', blurb: 'Sound, LED screens, generators, furniture and event staff.', icon: 'Package', wizardGroup: 'Other' },
]

/** Event types offered on the events landing page, in display order. */
export const EVENT_TYPE_LINKS = [
  { label: 'Weddings', type: 'WEDDING' },
  { label: 'Engagements', type: 'ENGAGEMENT' },
  { label: 'Birthdays', type: 'BIRTHDAY' },
  { label: 'Anniversaries', type: 'ANNIVERSARY' },
  { label: 'Corporate events', type: 'CORPORATE' },
  { label: 'Conferences', type: 'CONFERENCE' },
  { label: 'Concerts & live events', type: 'OTHER' },
  { label: 'Private parties', type: 'PRIVATE_CELEBRATION' },
  { label: 'Cultural celebrations', type: 'HOUSEWARMING' },
] as const

/**
 * The doorstep visit charge the API adds to every technician booking
 * (`backend/src/services/technician.ts`). Duplicated here **only** so the
 * wizard's estimate can match the server's arithmetic; it is not a price list
 * and the server value remains authoritative.
 */
export const VISIT_CHARGE = 99
export const GST_RATE = 0.18

export function estimateHomeServiceTotal(basePrice: number) {
  const subtotal = basePrice + VISIT_CHARGE
  const tax = Math.round(subtotal * GST_RATE)
  return { subtotal, tax, total: subtotal + tax }
}

/**
 * Worked example of the same arithmetic — ₹499 service + ₹99 visit charge, GST
 * rounded once. Used by tests (and any explainer UI) so the numbers are derived,
 * never typed twice.
 */
export const ESTIMATE = { basePrice: 499, ...estimateHomeServiceTotal(499) }
