/**
 * Content model for the immersive homepage.
 *
 * Category `type` values must match the plan-event wizard's EVENT_TYPES so the
 * hero booking panel and category cards can pre-select a valid event type.
 */

export interface HomeCategory {
  name: string
  /** plan-event event type pre-selected from this card. */
  type: string
  img: string
  blurb: string
}

export const HOME_CATEGORIES: HomeCategory[] = [
  {
    name: 'Weddings',
    type: 'WEDDING',
    img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Ceremony to reception, flawlessly orchestrated',
  },
  {
    name: 'Corporate Events',
    type: 'CORPORATE',
    img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Summits, offsites and award nights',
  },
  {
    name: 'Birthdays',
    type: 'BIRTHDAY',
    img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Milestones turned into memories',
  },
  {
    name: 'Concerts',
    type: 'OTHER',
    img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Stages, sound and unforgettable nights',
  },
  {
    name: 'College Festivals',
    type: 'COLLEGE_EVENT',
    img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Campus energy, professionally produced',
  },
  {
    name: 'Product Launches',
    type: 'PRODUCT_LAUNCH',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Reveals that land with impact',
  },
]

export interface HomeService {
  name: string
  description: string
  /** lucide-react icon name, resolved in the component. */
  icon: 'MapPin' | 'Flower2' | 'Utensils' | 'Camera' | 'Lightbulb' | 'Music' | 'Users' | 'Briefcase'
}

export const HOME_SERVICES: HomeService[] = [
  { name: 'Venue Selection', description: 'Handpicked venues matched to your guest list, city and budget.', icon: 'MapPin' },
  { name: 'Stage & Decoration', description: 'Floral, theme and stage design built around your story.', icon: 'Flower2' },
  { name: 'Catering', description: 'Menus from trusted kitchens, across cuisines and diets.', icon: 'Utensils' },
  { name: 'Photography & Videography', description: 'Candid, cinematic coverage that lasts beyond the day.', icon: 'Camera' },
  { name: 'Lighting & Sound', description: 'Ambience, stage lighting and concert-grade audio.', icon: 'Lightbulb' },
  { name: 'Entertainment', description: 'DJs, live bands, performers and hosts who read the room.', icon: 'Music' },
  { name: 'Guest Management', description: 'Invites, RSVPs, seating and on-ground hospitality.', icon: 'Users' },
  { name: 'Corporate Production', description: 'End-to-end delivery for launches, summits and offsites.', icon: 'Briefcase' },
]

export interface HomeStep {
  step: string
  title: string
  description: string
}

export const HOME_STEPS: HomeStep[] = [
  { step: '01', title: 'Discover your event options', description: 'Tell us the occasion, date and guest count. Explore venues and services that fit.' },
  { step: '02', title: 'Customise your event', description: 'Shape the theme, décor, menu and entertainment with your dedicated planner.' },
  { step: '03', title: 'Confirm your booking', description: 'Approve the proposal, review transparent pricing and lock your date.' },
  { step: '04', title: 'Track and enjoy your event', description: 'Follow every milestone from your dashboard while we handle the day.' },
]

export interface FeaturedFallback {
  id: string
  title: string
  img: string
  date: string
  location: string
  price: number
}

/**
 * Curated showcase used only when the live featured-events API returns
 * nothing (e.g. a fresh database) or the API is unreachable.
 */
export const FEATURED_FALLBACK: FeaturedFallback[] = [
  { id: 'wedding', title: 'Royal Wedding Production', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80', date: 'Available year-round', location: 'Udaipur · Jaipur · Goa', price: 450000 },
  { id: 'corporate', title: 'Annual Summit & Awards', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80', date: 'Weekday packages', location: 'Bengaluru · Mumbai', price: 250000 },
  { id: 'birthday', title: 'Luxe Birthday Soirée', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80', date: 'Weekends', location: 'Your city', price: 95000 },
  { id: 'concert', title: 'Live Music Night', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=80', date: 'Seasonal', location: 'Pan-India', price: 350000 },
  { id: 'launch', title: 'Product Reveal Experience', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80', date: 'By schedule', location: 'Hyderabad · Pune', price: 275000 },
  { id: 'college', title: 'Campus Festival Takeover', img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=80', date: 'Fest season', location: 'Campuses nationwide', price: 125000 },
]

export interface HomeEventTypeOption {
  value: string
  label: string
}

/** Options shown in the hero booking panel (values are plan-event types). */
export const HOME_EVENT_TYPES: HomeEventTypeOption[] = [
  { value: 'WEDDING', label: 'Wedding' },
  { value: 'CORPORATE', label: 'Corporate event' },
  { value: 'BIRTHDAY', label: 'Birthday' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'PRODUCT_LAUNCH', label: 'Product launch' },
  { value: 'COLLEGE_EVENT', label: 'College festival' },
  { value: 'ANNIVERSARY', label: 'Anniversary' },
  { value: 'OTHER', label: 'Something else' },
]

/** Slim home-services strip (keeps the technician side one tap away). */
export const HOME_TECH_LINKS = [
  { label: 'Plumber', category: 'PLUMBING' },
  { label: 'Electrician', category: 'ELECTRICAL' },
  { label: 'AC Service', category: 'AC_SERVICE' },
  { label: 'Deep Cleaning', category: 'CLEANING' },
] as const
