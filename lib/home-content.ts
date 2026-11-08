/**
 * Content model for the Heptome homepage.
 *
 * Photography, copy and links live here so the page components stay presentational.
 * Every photograph is a licensed Unsplash/Pexels asset stored locally in
 * `public/images`, so the experience never depends on a third-party CDN at
 * runtime. Category values used for hand-off (`type`) match the plan-event
 * wizard; home categories come straight from `lib/catalog.ts`, so a card can
 * never advertise a service the booking flow does not offer.
 *
 * No prices, ratings or job counts live here: every number a customer sees is
 * either read from the API or labelled as unverified ("pricing on request").
 */

export interface HeroSlide {
  id: string
  /** Short accessible description used by the slide controls. */
  label: string
  image: string
  alt: string
  /** Focal point so tall photography crops gracefully on wide screens. */
  focus: string
}

/**
 * Hero photography — eight licensed frames covering both verticals.
 *
 * The hero copy stays fixed while these images cross-fade, so the visitor can
 * read the promise without chasing a moving headline.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'weddings',
    label: 'Luxury Indian weddings',
    image: '/images/hero/indian-wedding.webp',
    alt: 'An Indian bride and groom in traditional red and ivory wedding attire',
    focus: 'center 32%',
  },
  {
    id: 'corporate',
    label: 'Corporate conferences',
    image: '/images/hero/corporate-conference.webp',
    alt: 'A speaker on stage before a conference audience',
    focus: 'center',
  },
  {
    id: 'birthdays',
    label: 'Birthdays & celebrations',
    image: '/images/hero/birthday-celebration.webp',
    alt: 'A cloud of brightly coloured balloons at a birthday celebration',
    focus: 'center 40%',
  },
  {
    id: 'venues',
    label: 'Premium banquet halls',
    image: '/images/hero/banquet-hall.webp',
    alt: 'A banquet hall dressed with round tables, gold chairs and chandeliers',
    focus: 'center 55%',
  },
  {
    id: 'interiors',
    label: 'Modern home interiors',
    image: '/images/hero/modern-interior.webp',
    alt: 'A calm modern living room with warm timber and soft daylight',
    focus: 'center 58%',
  },
  {
    id: 'home-services',
    label: 'Professional home cleaning',
    image: '/images/hero/home-cleaning.webp',
    alt: 'A professional cleaner caring for the windows of a bright home',
    focus: 'center 35%',
  },
  {
    id: 'engagement',
    label: 'Engagement ceremonies',
    image: '/images/hero/engagement-ceremony.webp',
    alt: 'An engaged couple in traditional attire sharing a quiet moment',
    focus: 'center 28%',
  },
  {
    id: 'outdoor',
    label: 'Outdoor luxury celebrations',
    image: '/images/hero/outdoor-celebration.webp',
    alt: 'Friends gathered around a long outdoor table beneath festoon lights',
    focus: 'center 50%',
  },
]

export interface HomeCategory {
  name: string
  /** Event type used to filter the events catalogue. */
  type: string
  img: string
  blurb: string
}

/** Event categories — each links to the live catalogue filtered by type. */
export const HOME_CATEGORIES: HomeCategory[] = [
  {
    name: 'Weddings & engagements',
    type: 'WEDDING',
    img: '/images/categories/weddings.webp',
    blurb: 'Ceremony to reception, flawlessly orchestrated',
  },
  {
    name: 'Corporate events',
    type: 'CORPORATE',
    img: '/images/categories/corporate.webp',
    blurb: 'Summits, offsites, launches and award nights',
  },
  {
    name: 'Birthdays & private parties',
    type: 'BIRTHDAY',
    img: '/images/categories/birthdays.webp',
    blurb: 'Milestones turned into memories',
  },
  {
    name: 'Concerts & live events',
    type: 'OTHER',
    img: '/images/categories/concerts.webp',
    blurb: 'Stages, sound and unforgettable nights',
  },
  {
    name: 'Florals & styling',
    type: 'HOUSEWARMING',
    img: '/images/categories/florals.webp',
    blurb: 'Flowers, tables and details that set the tone',
  },
  {
    name: 'Venues & interiors',
    type: 'CONFERENCE',
    img: '/images/categories/venues.webp',
    blurb: 'Halls, resorts and outdoor spaces, matched to your guest list',
  },
]

/** Photography for the featured home-service cards (catalogue ids). */
export const HOME_SERVICE_IMAGES: Record<string, { src: string; alt: string }> = {
  cleaning: {
    src: '/images/services/cleaning.webp',
    alt: 'A professional cleaning crew with vacuums in a bright living room',
  },
  'ac-service': {
    src: '/images/services/ac-service.webp',
    alt: 'A technician servicing a home appliance',
  },
  electrical: {
    src: '/images/services/electrical.webp',
    alt: 'An electrician beside a wall-mounted electrical panel',
  },
  plumbing: {
    src: '/images/services/plumbing.webp',
    alt: 'Chrome bathroom taps and a shower fitting',
  },
  carpentry: {
    src: '/images/services/carpentry.webp',
    alt: 'A hammer and nails on a wooden workbench',
  },
  painting: {
    src: '/images/services/painting.webp',
    alt: 'A paint roller applying soft blue paint to a wall',
  },
}

export interface VenueStyle {
  id: string
  name: string
  blurb: string
  image: string
  alt: string
  href: string
}

/**
 * Venue discovery by style.
 *
 * These are categories, not listings: no capacity, rating or price is invented.
 * The live catalogue at /venues owns the real inventory.
 */
export const VENUE_STYLES: VenueStyle[] = [
  {
    id: 'banquet-halls',
    name: 'Banquet halls',
    blurb: 'Ballrooms and banquet floors for receptions, sangeets and award nights.',
    image: '/images/venues/banquet-hall.webp',
    alt: 'A chandelier-lit banquet hall prepared for a reception',
    href: '/venues?type=BANQUET_HALL',
  },
  {
    id: 'lawns',
    name: 'Garden lawns',
    blurb: 'Open-air ceremonies, lawn receptions and golden-hour portraits.',
    image: '/images/venues/garden-lawn.webp',
    alt: 'Two chairs set on a wide green lawn for an outdoor ceremony',
    href: '/venues?type=OUTDOOR',
  },
  {
    id: 'resorts',
    name: 'Resorts & retreats',
    blurb: 'Weekend weddings and corporate retreats with rooms on site.',
    image: '/images/venues/resort.webp',
    alt: 'A resort pool framed by palms and loungers',
    href: '/venues?type=RESORT',
  },
]

export interface HomeStep {
  step: string
  title: string
  description: string
}

/** Event planning journey (inquiry-first: no forced instant booking). */
export const EVENT_STEPS: HomeStep[] = [
  { step: '01', title: 'Tell us the occasion', description: 'Event type, date and guest count — a minute of your time.' },
  { step: '02', title: 'Explore venues and services', description: 'Compare real venues, catering, décor and production options.' },
  { step: '03', title: 'Review your proposal', description: 'Approve the plan and pricing, or ask for changes.' },
  { step: '04', title: 'Celebrate, we handle the day', description: 'Track every milestone from your dashboard.' },
]

/** Doorstep service journey (slot-based, priced from the live catalog). */
export const HOME_STEPS: HomeStep[] = [
  { step: '01', title: 'Choose the service', description: 'Cleaning, repair, appliance or personal care.' },
  { step: '02', title: 'Share your address', description: 'We confirm coverage for your pincode before you book.' },
  { step: '03', title: 'Pick a slot', description: 'Choose a date and a two-hour window that suits you.' },
  { step: '04', title: 'Verified professional arrives', description: 'Track the job and pay after the work is done.' },
]

export interface FeaturedFallback {
  id: string
  title: string
  img: string
  date: string
  location: string
  /** Deliberately null: a showcase card must never invent a price. */
  price: null
}

/**
 * Curated showcase used only when the live featured-events API returns nothing
 * (e.g. a fresh database) or the API is unreachable. Cards carry no price, so
 * the section can never advertise a number the catalogue does not support.
 */
export const FEATURED_FALLBACK: FeaturedFallback[] = [
  { id: 'wedding', title: 'Wedding production', img: '/images/featured/production-wedding.webp', date: 'Available year-round', location: 'Udaipur · Jaipur · Goa', price: null },
  { id: 'corporate', title: 'Annual summit & awards', img: '/images/featured/annual-summit.webp', date: 'Weekday packages', location: 'Bengaluru · Mumbai', price: null },
  { id: 'birthday', title: 'Birthday soirée', img: '/images/featured/birthday-soiree.webp', date: 'Weekends', location: 'Your city', price: null },
  { id: 'concert', title: 'Live music night', img: '/images/featured/live-music.webp', date: 'Seasonal', location: 'Pan-India', price: null },
  { id: 'launch', title: 'Product reveal experience', img: '/images/featured/product-launch.webp', date: 'By schedule', location: 'Hyderabad · Pune', price: null },
  { id: 'floral', title: 'Floral & tablescape studio', img: '/images/featured/floral-studio.webp', date: 'Year-round', location: 'Bengaluru', price: null },
]

export interface HomeEventTypeOption {
  value: string
  label: string
}

/** Options shown in the hero booking panel (values are plan-event types). */
export const HOME_EVENT_TYPES: HomeEventTypeOption[] = [
  { value: 'WEDDING', label: 'Wedding' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'CORPORATE', label: 'Corporate event' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'BIRTHDAY', label: 'Birthday' },
  { value: 'ANNIVERSARY', label: 'Anniversary' },
  { value: 'PRODUCT_LAUNCH', label: 'Product launch' },
  { value: 'COLLEGE_EVENT', label: 'College festival' },
  { value: 'OTHER', label: 'Something else' },
]
