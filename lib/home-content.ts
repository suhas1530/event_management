/**
 * Content model for the Heptome homepage.
 *
 * The homepage tells one story with two halves: event discovery (cinematic,
 * champagne-lit) and home services (clean, ivory, purple). Category values used
 * for hand-off (`type`) must match the plan-event wizard's EVENT_TYPES, and home
 * categories come straight from `lib/catalog.ts` so a card can never advertise a
 * service the booking flow does not offer.
 *
 * No prices, ratings or job counts live here: every number a customer sees is
 * either read from the API or labelled as unverified ("pricing on request").
 */

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
    name: 'Weddings & Engagements',
    type: 'WEDDING',
    img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Ceremony to reception, flawlessly orchestrated',
  },
  {
    name: 'Corporate Events & Conferences',
    type: 'CORPORATE',
    img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Summits, offsites, product launches and award nights',
  },
  {
    name: 'Birthdays & Private Parties',
    type: 'BIRTHDAY',
    img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Milestones turned into memories',
  },
  {
    name: 'Concerts & Live Events',
    type: 'OTHER',
    img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Stages, sound and unforgettable nights',
  },
  {
    name: 'Cultural Celebrations',
    type: 'HOUSEWARMING',
    img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Housewarmings, naming ceremonies and festivals',
  },
  {
    name: 'Venues & Banquet Halls',
    type: 'CONFERENCE',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Halls, resorts and outdoor spaces, matched to your guest list',
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
  { id: 'wedding', title: 'Wedding Production', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80', date: 'Available year-round', location: 'Udaipur · Jaipur · Goa', price: null },
  { id: 'corporate', title: 'Annual Summit & Awards', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80', date: 'Weekday packages', location: 'Bengaluru · Mumbai', price: null },
  { id: 'birthday', title: 'Birthday Soirée', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80', date: 'Weekends', location: 'Your city', price: null },
  { id: 'concert', title: 'Live Music Night', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=80', date: 'Seasonal', location: 'Pan-India', price: null },
  { id: 'launch', title: 'Product Reveal Experience', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80', date: 'By schedule', location: 'Hyderabad · Pune', price: null },
  { id: 'college', title: 'Campus Festival Takeover', img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=80', date: 'Fest season', location: 'Campuses nationwide', price: null },
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
