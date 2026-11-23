/**
 * Home-services photography registry — one source of truth for every surface.
 *
 * Every photograph is local (`public/images/services/`) and licensed for reuse;
 * provenance is recorded in `docs/PHOTO_CREDITS.md`. Collections are keyed by
 * the stable catalog ids in `lib/catalog.ts`, so a card, its detail gallery, the
 * homepage rail and the services index can never drift apart. The helper
 * fallback is deterministic so a catalog group without its own set still gets
 * a stable, relevant frame instead of a blank tile.
 */

export interface ServicePhoto {
  src: string
  alt: string
}

export interface ServicePhotoSet {
  lead: ServicePhoto
  gallery: ServicePhoto[]
}

const photo = (file: string, alt: string): ServicePhoto => ({
  src: `/images/services/${file}.webp`,
  alt,
})

export const HOME_SERVICE_PHOTOS: Record<string, ServicePhotoSet> = {
  cleaning: {
    lead: photo('cleaning', 'Professional cleaner preparing a bright home for a deep clean'),
    gallery: [
      photo('cleaning-living', 'Bright living room after a professional deep clean'),
      photo('cleaning-kitchen', 'Living room being tidied during a home clean'),
      photo('cleaning-sofa', 'Sofa and upholstery cleaning in a modern home'),
      photo('cleaning-carpet', 'Colourful carpet and rug detail in a home'),
      photo('cleaning-floor', 'Preparing a mop bucket for floor cleaning'),
      photo('cleaning-window', 'Professional window and glass cleaning'),
      photo('cleaning-team', 'Two professional cleaners cleaning a modern living room'),
    ],
  },
  'pest-control': {
    lead: photo('pest-treatment', 'Professional pest control treatment at a residence'),
    gallery: [photo('pest-technician', 'Professionals working together inside a home')],
  },
  'ac-service': {
    lead: photo('ac-service', 'Air conditioner being serviced by a technician'),
    gallery: [
      photo('ac-split', 'White split air conditioner installed in a modern room'),
      photo('ac-outdoor', 'Technician cleaning an outdoor AC condenser coil'),
      photo('ac-filter', 'Technician servicing outdoor air conditioning condenser units'),
      photo('ac-unit', 'Air conditioning unit during a service visit'),
      photo('maintenance-drill', 'Professional using a power tool during a home maintenance visit'),
    ],
  },
  'appliance-repair': {
    lead: photo('appliance-tools', 'Technician repairing an appliance with diagnostic gauges'),
    gallery: [
      photo('appliance-fridge', 'Kitchen counter and appliances in a modern home'),
      photo('appliance-kitchen', 'Sunlit modern living space adjoining a kitchen'),
      photo('maintenance-drill', 'Professional using a power tool during a home maintenance visit'),
    ],
  },
  electrical: {
    lead: photo('electrical', 'Electrician working on residential wiring'),
    gallery: [
      photo('electrical-panel', 'Electrician working inside an open breaker panel'),
      photo('electrical-wiring', 'Gloved hands checking electrical wiring with a voltage tester'),
      photo('electrical-outlets', 'New wires and connectors in a residential outlet box'),
      photo('electrical-lighting', 'Warm layered lighting in a modern living room'),
      photo('electrical-recessed', 'Recessed ceiling lights in a bright living room'),
      photo('electrical-breaker', 'Residential circuit breaker panel with labelled circuits'),
      photo('electrical-tools', 'Multimeter, pliers and cable laid out for electrical testing'),
    ],
  },
  plumbing: {
    lead: photo('plumbing', 'Professional plumber working on bathroom plumbing'),
    gallery: [
      photo('plumbing-sink', 'Plumber loosening a pipe trap beneath a bathroom sink'),
      photo('plumbing-leak', 'Water spraying from a leaking tap during a plumbing repair'),
      photo('plumbing-tools', 'Pipe wrench resting on a towel after a leak repair'),
      photo('plumbing-heater', 'Chrome tap and basin fitting during a plumbing job'),
      photo('plumbing-drain', 'Stainless steel kitchen sink and drain'),
      photo('plumbing-faucet', 'Chrome kitchen faucet over a double sink'),
      photo('plumbing-pipes', 'Pipes, valves and gauges in a residential utility room'),
    ],
  },
  carpentry: {
    lead: photo('carpentry', 'Carpenter working on a wooden fitting'),
    gallery: [
      photo('carpentry-woodwork', 'Carpenter working on a piece of wood'),
      photo('carpentry-cabinet', 'Custom wooden kitchen cabinet and sink installation'),
      photo('carpentry-clamps', 'Woodworking clamps holding a furniture assembly'),
      photo('carpentry-door', 'Solid wooden door fitted in a home'),
      photo('carpentry-tools', 'Professional woodworking tools on a workbench'),
      photo('carpentry-structure', 'Structural carpentry and timber framework'),
    ],
  },
  painting: {
    lead: photo('painting', 'Painter finishing an interior wall'),
    gallery: [
      photo('painting-roller', 'Painter rolling a fresh coat of white paint onto a wall'),
      photo('painting-living', 'Bright living room with freshly painted walls'),
      photo('painting-bedroom', 'Bedroom with pale grey painted walls and a tray ceiling'),
      photo('painting-accent', 'Dark textured feature wall in a modern interior'),
      photo('painting-prep', 'Painter preparing a cabinet edge beside a masked window'),
      photo('painting-exterior', 'Freshly painted exterior house facade with a porch'),
      photo('painting-ladder', 'Painter on a ladder preparing an exterior wall'),
      photo('painting-tools', 'Paint can, brush, tray and roller on a canvas drop cloth'),
    ],
  },
  security: {
    lead: photo('security-camera', 'Technicians carrying out a home security installation'),
    gallery: [
      photo('security-exterior', 'Modern home exterior with security lighting'),
      photo('electrical-tools', 'Multimeter, pliers and cable laid out for electrical testing'),
    ],
  },
  computer: {
    lead: photo('computer-laptop', 'Technician working on a laptop repair'),
    gallery: [photo('computer-repair', 'Laptop opened for hardware repair')],
  },
  'wall-panels': {
    lead: photo('painting-accent', 'Dark textured feature wall in a modern interior'),
    gallery: [
      photo('painting-living', 'Bright living room with freshly painted walls'),
      photo('carpentry-cabinet', 'Custom wooden kitchen cabinet and sink installation'),
    ],
  },
}

/** Deterministic fallback for groups without a bespoke collection. */
const FALLBACKS: ServicePhoto[] = [
  { src: '/images/paths/home-services.webp', alt: 'Professional home service at a residence' },
  { src: '/images/hero/home-cleaning.webp', alt: 'A professional cleaner caring for a home' },
  { src: '/images/services/cleaning.webp', alt: 'Home cleaning being carried out by a professional' },
]

function hashKey(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

/** The card image for a catalog group — stable across renders and reloads. */
export function homeServicePhoto(id: string, index = 0): ServicePhoto {
  const set = HOME_SERVICE_PHOTOS[id]
  if (!set) return FALLBACKS[hashKey(`${id}:${index}`) % FALLBACKS.length]
  const pool = [set.lead, ...set.gallery]
  return pool[hashKey(`${id}:${index}`) % pool.length]
}

/** All photography for a catalog group's detail gallery. */
export function homeServiceGallery(id: string): ServicePhoto[] {
  const set = HOME_SERVICE_PHOTOS[id]
  if (!set) return FALLBACKS
  return [set.lead, ...set.gallery]
}

export interface HomeServiceSlide {
  id: string
  label: string
  eyebrow: string
  headline: string
  accent: string
  description: string
  image: ServicePhoto
  focus: string
  category: string
}

/** Six-frame home-services hero carousel. Copy stays factual — no invented claims. */
export const HOME_SERVICE_SLIDES: HomeServiceSlide[] = [
  {
    id: 'maintenance',
    label: 'Complete home maintenance',
    eyebrow: 'One dependable team',
    headline: 'Every job at home,',
    accent: 'handled with care.',
    description: 'From a dripping tap to a fresh coat of paint, find trusted professionals and book a visit in a few steps.',
    image: photo('maintenance-drill', 'Professional using a power tool during a home maintenance visit'),
    focus: 'center 42%',
    category: 'cleaning',
  },
  {
    id: 'plumbing',
    label: 'Professional plumbing services',
    eyebrow: 'Plumbing',
    headline: 'Water where it belongs,',
    accent: 'not where it leaks.',
    description: 'Tap repairs, leak detection, bathroom fittings and drainage work by plumbers who explain the fix before they start.',
    image: photo('plumbing-sink', 'Plumber loosening a pipe trap beneath a bathroom sink'),
    focus: 'center 45%',
    category: 'plumbing',
  },
  {
    id: 'electrical',
    label: 'Electrical installation and repair',
    eyebrow: 'Electrical',
    headline: 'Safe wiring,',
    accent: 'thoughtful lighting.',
    description: 'Switches, sockets, fans, lighting and panel work, handled with the care a home electrical system deserves.',
    image: photo('electrical-panel', 'Electrician working inside an open breaker panel'),
    focus: 'center 40%',
    category: 'electrical',
  },
  {
    id: 'cleaning',
    label: 'Premium home cleaning',
    eyebrow: 'Deep cleaning',
    headline: 'A home that feels',
    accent: 'new again.',
    description: 'Trained crews for whole-home deep cleaning, kitchens, bathrooms, upholstery and carpets.',
    image: photo('cleaning-team', 'Two professional cleaners cleaning a modern living room'),
    focus: 'center 48%',
    category: 'cleaning',
  },
  {
    id: 'appliances',
    label: 'AC and appliance repair',
    eyebrow: 'Appliances',
    headline: 'Cooling and appliances,',
    accent: 'back in rhythm.',
    description: 'AC servicing, gas refills and repairs for washing machines, refrigerators, geysers and more.',
    image: photo('appliance-tools', 'Technician repairing an appliance with diagnostic gauges'),
    focus: 'center 50%',
    category: 'ac-service',
  },
  {
    id: 'finishes',
    label: 'Painting and carpentry services',
    eyebrow: 'Home improvement',
    headline: 'Beautiful finishes,',
    accent: 'built to last.',
    description: 'Interior and exterior painting, texture walls, waterproofing and carpentry for the details that make a home yours.',
    image: photo('painting-roller', 'Painter rolling a fresh coat of white paint onto a wall'),
    focus: 'center 45%',
    category: 'painting',
  },
]

export interface HomeGalleryTile {
  id: string
  label: string
  caption: string
  image: ServicePhoto
  category: string
  size: 'large' | 'small'
}

/** Editorial gallery — labels map to real catalog groups only. */
export const HOME_SERVICE_GALLERY: HomeGalleryTile[] = [
  {
    id: 'g-plumbing',
    label: 'Plumbing',
    caption: 'Leaks, taps and fittings',
    image: photo('plumbing-tools', 'Pipe wrench resting on a towel after a leak repair'),
    category: 'plumbing',
    size: 'large',
  },
  {
    id: 'g-electrical',
    label: 'Electrical work',
    caption: 'Wiring, fans and lighting',
    image: photo('electrical-wiring', 'Gloved hands checking electrical wiring with a voltage tester'),
    category: 'electrical',
    size: 'small',
  },
  {
    id: 'g-cleaning',
    label: 'Cleaning',
    caption: 'Deep cleaning crews',
    image: photo('cleaning-living', 'Bright living room after a professional deep clean'),
    category: 'cleaning',
    size: 'small',
  },
  {
    id: 'g-appliance',
    label: 'Appliance repair',
    caption: 'AC, fridge and laundry',
    image: photo('appliance-tools', 'Technician repairing an appliance with diagnostic gauges'),
    category: 'appliance-repair',
    size: 'small',
  },
  {
    id: 'g-painting',
    label: 'Painting',
    caption: 'Interiors and exteriors',
    image: photo('painting-roller', 'Painter rolling a fresh coat of white paint onto a wall'),
    category: 'painting',
    size: 'large',
  },
  {
    id: 'g-carpentry',
    label: 'Carpentry',
    caption: 'Doors, shelves and cabinets',
    image: photo('carpentry-woodwork', 'Carpenter working on a piece of wood'),
    category: 'carpentry',
    size: 'small',
  },
  {
    id: 'g-maintenance',
    label: 'Home maintenance',
    caption: 'The small jobs that matter',
    image: photo('maintenance-drill', 'Professional using a power tool during a home maintenance visit'),
    category: 'electrical',
    size: 'small',
  },
]

/** Link to the detail page of a catalog group (the only truthful detail URL). */
export function serviceDetailHref(id: string): string {
  return `/home-services/${id}`
}
