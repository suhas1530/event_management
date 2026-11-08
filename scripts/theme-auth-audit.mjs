import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

/**
 * Authenticated theme audit.
 *
 * The public-site audit cannot reach dashboards without a backend. This script
 * boots a real browser against the running Next.js server, signs in with a fake
 * JWT (the client only decodes the admin token; the API is stubbed below), and
 * intercepts every backend call with deterministic fixtures. That gives us real
 * rendering, real CSS and real responsive layout for the customer, technician
 * and admin screens in both themes.
 */

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3000'
const OUT = 'test-results/theme-auth-audit'
await fs.mkdir(OUT, { recursive: true })

const now = Date.now()
const day = 86_400_000
const future = days => new Date(now + days * day).toISOString()
const past = days => new Date(now - days * day).toISOString()

function jwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.audit`
}

const exp = Math.floor(now / 1000) + 86_400
const customerToken = jwt({
  id: 'customer-1',
  email: 'priya.sharma@example.com',
  name: 'Priya Sharma',
  role: 'CUSTOMER',
  exp,
})
const adminToken = jwt({
  id: 'admin-1',
  email: 'ananya.rao@heptome.test',
  name: 'Ananya Rao',
  role: 'SUPER_ADMIN',
  exp,
})

const customer = {
  id: 'customer-1',
  email: 'priya.sharma@example.com',
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  role: 'CUSTOMER',
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: past(0),
  createdAt: past(420),
}

const venue = {
  id: 'venue-1',
  name: 'The Tamarind Courtyard',
  slug: 'tamarind-courtyard',
  address: '12, Sankey Road, Sadashivanagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  capacity: 320,
  images: ['/brand/event-hero.webp'],
  amenities: ['Valet parking', 'In-house catering', 'Bridal suite'],
}

const event = (id, title, slug) => ({
  id,
  title,
  slug,
  description: 'A warm, richly layered celebration shaped around the people in the room.',
  shortDescription: 'A warm, richly layered celebration.',
  type: 'WEDDING',
  theme: 'Garden',
  colorPalette: ['#283b32', '#b99b69', '#f8f6f2'],
  heroImages: ['/brand/event-hero.webp'],
  galleryImages: ['/brand/event-hero.webp'],
  minGuests: 50,
  maxGuests: 500,
  startingPrice: 250_000,
  currency: 'INR',
  location: 'Bengaluru',
  city: 'Bengaluru',
  state: 'Karnataka',
  isIndoor: true,
  isOutdoor: true,
  isLuxury: true,
  isActive: true,
  isFeatured: true,
  averageRating: 4.9,
  totalReviews: 128,
  viewCount: 2_400,
  createdAt: past(90),
})

const gardenWedding = event('event-1', 'The Garden Wedding', 'the-garden-wedding')
const courtyardReception = event('event-2', 'Courtyard Reception', 'courtyard-reception')
const anniversary = event('event-3', 'Silver Anniversary', 'silver-anniversary')

const booking = (overrides) => ({
  id: 'booking-1',
  bookingNumber: 'HPT-EV-2026-1042',
  userId: customer.id,
  user: customer,
  eventId: gardenWedding.id,
  event: gardenWedding,
  venue,
  status: 'CONFIRMED',
  eventDate: future(24),
  guestCount: 180,
  budget: 500_000,
  notes: 'Please keep the mandap facing east. The family arrives the previous evening.',
  specialRequests: 'Wheelchair access near the lawn entrance.',
  subtotal: 420_000,
  taxAmount: 65_000,
  discountAmount: 0,
  totalAmount: 485_000,
  paidAmount: 145_500,
  balanceAmount: 339_500,
  paymentStatus: 'PARTIAL',
  createdAt: past(12),
  ...overrides,
})

const bookings = [
  booking({}),
  booking({
    id: 'booking-2',
    bookingNumber: 'HPT-EV-2026-1058',
    eventId: courtyardReception.id,
    event: courtyardReception,
    status: 'QUOTED',
    eventDate: future(58),
    guestCount: 120,
    totalAmount: 0,
    subtotal: 0,
    taxAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    paymentStatus: 'PENDING',
    createdAt: past(5),
  }),
  booking({
    id: 'booking-3',
    bookingNumber: 'HPT-EV-2025-0917',
    eventId: anniversary.id,
    event: anniversary,
    status: 'COMPLETED',
    eventDate: past(20),
    guestCount: 90,
    totalAmount: 375_000,
    subtotal: 325_000,
    taxAmount: 50_000,
    paidAmount: 375_000,
    balanceAmount: 0,
    paymentStatus: 'COMPLETED',
    createdAt: past(80),
  }),
  booking({
    id: 'booking-4',
    bookingNumber: 'HPT-EV-2026-1021',
    eventId: courtyardReception.id,
    event: courtyardReception,
    status: 'CANCELLED',
    eventDate: past(3),
    guestCount: 60,
    totalAmount: 220_000,
    subtotal: 190_000,
    taxAmount: 30_000,
    paidAmount: 0,
    balanceAmount: 0,
    paymentStatus: 'CANCELLED',
    createdAt: past(30),
  }),
]

const quote = {
  id: 'quote-1',
  bookingId: 'booking-1',
  version: 2,
  items: [
    { serviceId: 'svc-1', name: 'Garden design & florals', quantity: 1, unitPrice: 185_000, totalPrice: 185_000 },
    { serviceId: 'svc-2', name: 'Photography & film', quantity: 1, unitPrice: 95_000, totalPrice: 95_000 },
    { serviceId: 'svc-3', name: 'Catering (per guest)', quantity: 180, unitPrice: 1_250, totalPrice: 225_000 },
  ],
  subtotal: 505_000,
  taxAmount: 90_900,
  discountAmount: 20_000,
  totalAmount: 575_900,
  validUntil: future(7),
  notes: 'Includes setup and dismantling. Alcohol and venue hire are billed separately.',
  status: 'SENT',
  createdAt: past(2),
}

const timeline = [
  { id: 'tl-1', bookingId: 'booking-1', status: 'REQUESTED', title: 'Booking requested', description: 'Your requirements reached the planning desk.', createdAt: past(12) },
  { id: 'tl-2', bookingId: 'booking-1', status: 'QUOTED', title: 'Proposal prepared', description: 'A tailored proposal was shared for review.', createdAt: past(8) },
  { id: 'tl-3', bookingId: 'booking-1', status: 'PAYMENT_PENDING', title: 'Advance payment received', description: 'The date was held while the advance cleared.', createdAt: past(6) },
  { id: 'tl-4', bookingId: 'booking-1', status: 'CONFIRMED', title: 'Booking confirmed', description: 'The planning team is now working on your event.', createdAt: past(5) },
]

const messages = [
  { id: 'msg-1', bookingId: 'booking-1', senderId: 'admin-1', sender: { id: 'admin-1', name: 'Ananya Rao', role: 'EVENT_MANAGER' }, content: 'We have held the Tamarind Courtyard for your date. The florist will share mood boards tomorrow.', type: 'TEXT', attachments: [], isRead: true, createdAt: past(4) },
  { id: 'msg-2', bookingId: 'booking-1', senderId: customer.id, sender: { id: customer.id, name: customer.name, role: 'CUSTOMER' }, content: 'That sounds perfect. Could the mood board include more marigold and less white?', type: 'TEXT', attachments: [], isRead: true, createdAt: past(3) },
  { id: 'msg-3', bookingId: 'booking-1', senderId: 'admin-1', sender: { id: 'admin-1', name: 'Ananya Rao', role: 'EVENT_MANAGER' }, content: 'Absolutely. We will keep the palette warm and send two options by Friday.', type: 'TEXT', attachments: [], isRead: false, createdAt: past(1) },
]

const technician = {
  id: 'technician-1',
  userId: 'tech-user-1',
  name: 'Rohan Mehta',
  phone: '+91 98860 11223',
  email: 'rohan.mehta@heptome.test',
  category: 'AC_SERVICE',
  experience: 8,
  rating: 4.8,
  totalReviews: 214,
  completedJobs: 640,
  isVerified: true,
  isActive: true,
  isAvailable: true,
  serviceAreas: ['Indiranagar', 'Koramangala', 'HSR Layout'],
  skills: ['Split AC service', 'Deep cleaning', 'Gas refill'],
  createdAt: past(500),
}

const techBooking = (overrides) => ({
  id: 'tech-1',
  bookingNumber: 'HPT-HS-2026-3124',
  customerId: customer.id,
  customer,
  technicianId: technician.id,
  technician,
  serviceId: 'tech-service-1',
  service: {
    id: 'tech-service-1',
    technicianId: technician.id,
    name: 'AC Deep Cleaning — Split',
    slug: 'ac-deep-cleaning-split',
    description: 'Two-unit deep clean with coil wash and drain flush.',
    category: 'AC_SERVICE',
    basePrice: 2_499,
    pricingType: 'FIXED',
    images: [],
    isActive: true,
    isPopular: true,
    tags: ['AC', 'Cleaning'],
  },
  category: 'AC_SERVICE',
  serviceDescription: 'Two split units in the living room and main bedroom.',
  requestType: 'SCHEDULED',
  addressLine1: '402, Palm Grove Apartments',
  addressLine2: '12th Main, Indiranagar',
  addressCity: 'Bengaluru',
  addressState: 'Karnataka',
  addressPincode: '560038',
  addressLabel: 'Home',
  scheduledDate: future(1),
  timeSlotStart: '09:00',
  timeSlotEnd: '11:00',
  estimatedPrice: 2_499,
  finalPrice: 2_499,
  visitCharge: 199,
  materialCost: 0,
  taxAmount: 450,
  discountAmount: 0,
  totalAmount: 2_499,
  paidAmount: 0,
  balanceAmount: 2_499,
  paymentStatus: 'PENDING',
  status: 'TECHNICIAN_ON_THE_WAY',
  customerNotes: 'Please call when you reach the gate. The intercom is not working.',
  attachments: [],
  createdAt: past(2),
  timeline,
  ...overrides,
})

const techBookings = [
  techBooking({}),
  techBooking({
    id: 'tech-2',
    bookingNumber: 'HPT-HS-2026-3138',
    category: 'PLUMBING',
    service: { id: 'tech-service-2', name: 'Leaking tap repair', category: 'PLUMBING', basePrice: 899 },
    serviceDescription: 'Kitchen sink mixer tap is dripping continuously.',
    scheduledDate: future(3),
    timeSlotStart: '14:00',
    timeSlotEnd: '15:30',
    totalAmount: 899,
    balanceAmount: 899,
    status: 'PENDING',
  }),
  techBooking({
    id: 'tech-3',
    bookingNumber: 'HPT-HS-2026-2981',
    category: 'CLEANING',
    service: { id: 'tech-service-3', name: 'Home deep clean', category: 'CLEANING', basePrice: 3_899 },
    serviceDescription: 'Three-bedroom apartment, post-renovation clean.',
    scheduledDate: past(2),
    timeSlotStart: '08:00',
    timeSlotEnd: '13:00',
    totalAmount: 3_899,
    paidAmount: 3_899,
    balanceAmount: 0,
    status: 'SERVICE_COMPLETED',
  }),
]

const notifications = [
  { id: 'n-1', type: 'BOOKING_CONFIRMED', title: 'Your garden wedding is confirmed', message: 'The Tamarind Courtyard has been blocked for 26 November. Your planning team is now on it.', data: { bookingId: 'booking-1' }, isRead: false, createdAt: past(0.1) },
  { id: 'n-2', type: 'PROPOSAL', title: 'A revised proposal is ready', message: 'Version 2 of your quote includes the revised floral plan and photography hours.', data: { requestId: 'request-1' }, isRead: false, createdAt: past(1) },
  { id: 'n-3', type: 'PAYMENT', title: 'Advance payment received', message: 'We have received ₹1,45,500 against booking HPT-EV-2026-1042.', data: { bookingId: 'booking-1' }, isRead: true, createdAt: past(6) },
  { id: 'n-4', type: 'EVENT_REQUEST', title: 'Your planner has a question', message: 'Ananya asked about guest parking for the courtyard reception.', data: { requestId: 'request-1' }, isRead: true, createdAt: past(9) },
]

const favorites = [
  { id: 'fav-1', event: gardenWedding, createdAt: past(20) },
  { id: 'fav-2', event: courtyardReception, createdAt: past(12) },
  { id: 'fav-3', event: anniversary, createdAt: past(4) },
]

const eventRequest = (overrides) => ({
  id: 'request-1',
  requestNumber: 'HPT-REQ-2026-0812',
  customerId: customer.id,
  eventType: 'WEDDING',
  eventDate: future(70),
  guestCount: 220,
  city: 'Bengaluru',
  budgetLabel: '₹8–10 lakh',
  requirements: {
    services: ['Decor & florals', 'Catering', 'Photography', 'Entertainment'],
    venueType: 'Outdoor lawn',
    preferredArea: 'North Bengaluru',
    additionalRequirements: 'A warm, garden-led celebration with a seated dinner. The family would like a traditional ceremony in the morning and a relaxed reception in the evening.',
  },
  referenceImages: ['/brand/event-hero.webp'],
  status: 'PROPOSAL_SENT',
  paymentStatus: 'PENDING',
  assignedManagerId: 'admin-1',
  createdAt: past(18),
  updatedAt: past(2),
  customer,
  ...overrides,
})

const eventRequests = [
  eventRequest({}),
  eventRequest({
    id: 'request-2',
    requestNumber: 'HPT-REQ-2026-0864',
    eventType: 'CORPORATE_GALA',
    eventDate: future(46),
    guestCount: 160,
    budgetLabel: '₹4–6 lakh',
    status: 'REQUIREMENT_SUBMITTED',
    assignedManagerId: null,
    createdAt: past(7),
    updatedAt: past(7),
  }),
  eventRequest({
    id: 'request-3',
    requestNumber: 'HPT-REQ-2026-0881',
    eventType: 'ANNIVERSARY',
    eventDate: future(112),
    guestCount: 60,
    city: 'Mysuru',
    budgetLabel: '₹2–3 lakh',
    status: 'DRAFT',
    assignedManagerId: null,
    createdAt: past(1),
    updatedAt: past(1),
  }),
]

const proposals = [
  {
    id: 'proposal-1',
    requestId: 'request-1',
    version: 2,
    items: [
      { name: 'Garden design and florals', description: 'Seasonal marigold, roses and foliage', quantity: 1, unitPrice: 240_000, totalPrice: 240_000 },
      { name: 'Catering', description: 'Seated dinner for 220 guests', quantity: 220, unitPrice: 1_650, totalPrice: 363_000 },
      { name: 'Photography and film', quantity: 1, unitPrice: 165_000, totalPrice: 165_000 },
    ],
    subtotal: 768_000,
    taxAmount: 138_240,
    discountAmount: 15_000,
    totalAmount: 891_240,
    notes: 'Venue hire and alcohol are billed separately. This proposal is valid for seven days.',
    validUntil: future(7),
    status: 'SENT',
    changeRequests: [],
    createdAt: past(2),
  },
]

const customers = [
  customer,
  { id: 'customer-2', email: 'arjun.menon@example.com', name: 'Arjun Menon', phone: '+91 99870 11223', role: 'CUSTOMER', isActive: true, isEmailVerified: true, lastLoginAt: past(1), createdAt: past(220), _count: { bookings: 4 } },
  { id: 'customer-3', email: 'meera.iyer@example.com', name: 'Meera Iyer', phone: '+91 98450 66221', role: 'CUSTOMER', isActive: true, isEmailVerified: false, lastLoginAt: past(12), createdAt: past(140), _count: { bookings: 1 } },
  { id: 'customer-4', email: 'dev.rao@example.com', name: 'Dev Rao', phone: '+91 97400 21889', role: 'CUSTOMER', isActive: false, isEmailVerified: true, lastLoginAt: past(90), createdAt: past(600), _count: { bookings: 7 } },
]

const dashboardStats = {
  bookings: { total: 248, pending: 18, confirmed: 64, completed: 151, cancelled: 15 },
  revenue: { total: 8_640_000, thisMonth: 1_240_000, lastMonth: 1_065_000, growth: 16.4 },
  customers: { total: 426, newThisMonth: 38 },
  upcomingEvents: 31,
  aiDesigns: 92,
}

const revenue = Array.from({ length: 30 }, (_, index) => ({
  date: future(index - 29),
  amount: 18_000 + Math.round(Math.abs(Math.sin(index * 0.7)) * 110_000) + index * 1_500,
}))

const analytics = {
  byStatus: [
    { status: 'CONFIRMED', count: 64 },
    { status: 'COMPLETED', count: 151 },
    { status: 'QUOTED', count: 18 },
    { status: 'PENDING_REVIEW', count: 9 },
    { status: 'CANCELLED', count: 15 },
  ],
  byEventType: [
    { type: 'WEDDING', count: 96 },
    { type: 'CORPORATE_GALA', count: 54 },
    { type: 'ANNIVERSARY', count: 38 },
    { type: 'BIRTHDAY', count: 31 },
    { type: 'RECEPTION', count: 29 },
  ],
  recentBookings: bookings.slice(0, 3),
}

const pagination = (total, limit = 20) => ({
  page: 1,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
})

const paginated = (data, total = data.length) => ({ data, pagination: pagination(total) })

const empty = { data: [], pagination: pagination(0), unreadCount: 0 }

const document = {
  id: 'doc-1',
  name: 'Tamarind Courtyard — venue agreement.pdf',
  url: '#',
  type: 'application/pdf',
  size: 284_000,
  uploadedBy: 'admin-1',
  createdAt: past(4),
}

/* ── Backend stub ─────────────────────────────────────────────────────────── */

let mockMode = 'normal'
const unmatched = []

const corsHeaders = {
  'access-control-allow-origin': BASE,
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-max-age': '86400',
}

function fulfil(route, status, body, extraHeaders = {}) {
  return route.fulfill({
    status,
    headers: {
      ...corsHeaders,
      'content-type': status === 204 ? 'text/plain' : 'application/json',
      ...extraHeaders,
    },
    body: status === 204 ? '' : JSON.stringify(body),
  })
}

const listEndpoints = new Set([
  '/bookings',
  '/event-requests',
  '/technicians/bookings/my',
  '/technicians/my-jobs',
  '/notifications',
  '/favorites',
  '/admin/bookings',
  '/admin/customers',
  '/admin/event-requests',
  '/technicians/admin/bookings',
  '/technicians',
])

async function handleApi(route) {
  const request = route.request()
  const url = new URL(request.url())
  const path = url.pathname.replace(/^\/api\/v1/, '').replace(/\/$/, '') || '/'
  const method = request.method()

  if (method === 'OPTIONS') return fulfil(route, 204, null)

  if (path === '/auth/profile' && method === 'GET') return fulfil(route, 200, customer)
  if (path === '/auth/logout' && method === 'POST') return fulfil(route, 200, { message: 'Signed out' })
  if (path.startsWith('/auth/admin/refresh') || path === '/auth/refresh') {
    return fulfil(route, 200, { accessToken: customerToken, refreshToken: customerToken })
  }

  if (mockMode === 'error' && [
    '/notifications',
    '/favorites',
    '/admin/dashboard',
    '/admin/analytics/revenue',
    '/admin/analytics/bookings',
    '/technicians/my-jobs',
    '/event-requests',
  ].includes(path)) {
    return fulfil(route, 500, { error: 'We could not load this data right now.' })
  }

  if (mockMode === 'empty' && method === 'GET' && listEndpoints.has(path)) {
    if (path === '/favorites') return fulfil(route, 200, [])
    if (path === '/notifications') return fulfil(route, 200, empty)
    if (path === '/event-requests' || path.startsWith('/admin/event-requests')) return fulfil(route, 200, [])
    if (path === '/technicians') return fulfil(route, 200, paginated([]))
    return fulfil(route, 200, paginated([]))
  }

  if (method === 'GET') {
    if (path === '/bookings') return fulfil(route, 200, paginated(bookings, 4))
    if (path === '/bookings/booking-1') {
      return fulfil(route, 200, { ...bookings[0], quotes: [quote], timeline, messages, documents: [document] })
    }
    if (path === '/bookings/booking-1/quotes') return fulfil(route, 200, [quote])
    if (path === '/bookings/booking-1/timeline') return fulfil(route, 200, timeline)
    if (path === '/bookings/booking-1/messages') return fulfil(route, 200, messages)
    if (path === '/event-requests') return fulfil(route, 200, eventRequests)
    if (path === '/event-requests/request-1') return fulfil(route, 200, eventRequests[0])
    if (path === '/event-requests/request-1/proposals') return fulfil(route, 200, proposals)
    if (path === '/technicians/bookings/my') return fulfil(route, 200, paginated(techBookings, 3))
    if (path === '/technicians/my-jobs') return fulfil(route, 200, paginated(techBookings, 3))
    if (path === '/technicians/bookings/tech-1') return fulfil(route, 200, techBookings[0])
    if (path === '/notifications') {
      return fulfil(route, 200, { data: notifications, unreadCount: 2, pagination: pagination(4) })
    }
    if (path === '/favorites') return fulfil(route, 200, favorites)
    if (path === '/admin/dashboard') return fulfil(route, 200, dashboardStats)
    if (path === '/admin/bookings') return fulfil(route, 200, paginated(bookings, 248))
    if (path === '/admin/bookings/booking-1') {
      return fulfil(route, 200, { ...bookings[0], quotes: [quote], timeline, messages, documents: [document] })
    }
    if (path === '/admin/bookings/booking-1/messages') return fulfil(route, 200, messages)
    if (path === '/admin/customers') return fulfil(route, 200, paginated(customers, 426))
    if (path === '/admin/analytics/revenue') return fulfil(route, 200, revenue)
    if (path === '/admin/analytics/bookings') return fulfil(route, 200, analytics)
    if (path === '/admin/event-requests') return fulfil(route, 200, eventRequests)
    if (path === '/admin/event-requests/request-1') return fulfil(route, 200, eventRequests[0])
    if (path === '/admin/event-requests/request-1/proposals') return fulfil(route, 200, proposals)
    if (path === '/technicians/admin/bookings') return fulfil(route, 200, paginated(techBookings, 48))
    if (path === '/technicians/admin/bookings/tech-1') return fulfil(route, 200, techBookings[0])
    if (path === '/technicians/admin/stats') {
      return fulfil(route, 200, { total: 48, pending: 6, confirmed: 17, completed: 21, cancelled: 4, revenue: 168_400 })
    }
    if (path === '/technicians') return fulfil(route, 200, paginated([technician]))
    if (path.startsWith('/technicians/')) return fulfil(route, 200, technician)
  }

  if (method === 'PATCH') {
    if (path === '/notifications/read-all') return fulfil(route, 200, { message: 'All notifications read' })
    if (path.startsWith('/notifications/')) return fulfil(route, 200, notifications[0])
    if (path.startsWith('/technicians/my-jobs/')) return fulfil(route, 200, techBookings[0])
    if (path.startsWith('/admin/')) return fulfil(route, 200, { success: true })
  }
  if (method === 'POST' && path.startsWith('/admin/')) return fulfil(route, 200, { success: true })
  if (method === 'DELETE' && path.startsWith('/favorites/')) return fulfil(route, 200, { message: 'Removed' })

  unmatched.push(`${method} ${path}`)
  return fulfil(route, 404, { error: `No audit fixture for ${method} ${path}` })
}

/* ── Computed-style contrast probe ────────────────────────────────────────── */

const contrastProbe = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  function parse(color) {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = 'rgba(1, 2, 3, 0.123)'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 }
  }

  function luminance({ r, g, b }) {
    const channel = value => {
      const v = value / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  function blend(fg, bg) {
    return {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    }
  }

  function ratio(a, b) {
    const x = luminance(a)
    const y = luminance(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  function backgroundFor(element) {
    const layers = []
    let node = element
    while (node && layers.length < 14) {
      const style = getComputedStyle(node)
      if (style.backgroundImage && style.backgroundImage !== 'none') return null
      const colour = parse(style.backgroundColor)
      if (colour.a > 0.002) layers.push(colour)
      if (colour.a >= 0.999) break
      node = node.parentElement
    }
    let base = layers.length
      ? layers[layers.length - 1]
      : parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base.a < 0.999) base = { ...base, a: 1 }
    let result = base
    for (let i = layers.length - 2; i >= 0; i -= 1) result = blend(layers[i], result)
    return result
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  }

  function photoBacked(element) {
    const rect = element.getBoundingClientRect()
    let node = element
    for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
      for (const image of node.querySelectorAll('img')) {
        const position = getComputedStyle(image).position
        if (position !== 'absolute' && position !== 'fixed') continue
        if (intersects(rect, image.getBoundingClientRect())) return true
      }
    }
    return false
  }

  function selector(element) {
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const classes =
      typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : ''
    return `${tag}${id}${classes}`
  }

  const failures = []
  const seen = new Set()
  const elements = document.querySelectorAll('body *')

  for (const element of elements) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'PATH'].includes(element.tagName)) continue
    if (element.closest('[aria-hidden="true"], .sr-only')) continue
    const style = getComputedStyle(element)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue
    const rect = element.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) continue
    if (photoBacked(element)) continue

    const text = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) continue

    const background = backgroundFor(element)
    if (!background) continue
    const foreground = parse(style.color)
    if (foreground.a < 0.05) continue
    const composited = blend(foreground, background)
    const contrast = ratio(composited, background)
    const fontSize = Number.parseFloat(style.fontSize)
    const weight = Number.parseInt(style.fontWeight, 10) || 400
    const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700)
    const required = large ? 3 : 4.5

    if (contrast + 0.05 < required) {
      const key = `${selector(element)}|${text.slice(0, 40)}`
      if (seen.has(key)) continue
      seen.add(key)
      failures.push({
        selector: selector(element),
        text: text.slice(0, 90),
        colour: style.color,
        background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
        contrast: Number(contrast.toFixed(2)),
        required,
        fontSize,
        weight,
      })
    }
  }

  for (const input of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    const style = getComputedStyle(input)
    const placeholder = getComputedStyle(input, '::placeholder')
    const rect = input.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1 || photoBacked(input)) continue
    const background = backgroundFor(input)
    if (!background) continue
    const foreground = parse(placeholder.color)
    const contrast = ratio(blend(foreground, background), background)
    if (contrast + 0.05 < 4.5) {
      failures.push({
        selector: `${selector(input)}::placeholder`,
        text: input.getAttribute('placeholder') ?? '',
        colour: placeholder.color,
        background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
        contrast: Number(contrast.toFixed(2)),
        required: 4.5,
        fontSize: Number.parseFloat(style.fontSize),
        weight: 400,
      })
    }
  }

  return {
    failures: failures.slice(0, 80),
    failureCount: failures.length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFg: getComputedStyle(document.body).color,
    theme: document.documentElement.dataset.theme,
    mode: document.documentElement.dataset.themeMode,
  }
}

/* ── Runner ───────────────────────────────────────────────────────────────── */

const ROUTES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'dashboard-events', path: '/dashboard?tab=events' },
  { name: 'dashboard-home', path: '/dashboard?tab=home' },
  { name: 'bookings', path: '/bookings' },
  { name: 'booking-detail', path: '/bookings/booking-1' },
  { name: 'event-requests', path: '/event-requests' },
  { name: 'event-request-detail', path: '/event-requests/request-1' },
  { name: 'notifications', path: '/notifications' },
  { name: 'favorites', path: '/favorites' },
  { name: 'profile', path: '/profile' },
  { name: 'tech-booking-detail', path: '/dashboard/booking/tech-1' },
  { name: 'technician-dashboard', path: '/technician/dashboard' },
  { name: 'admin-dashboard', path: '/admin/dashboard' },
  { name: 'admin-bookings', path: '/admin/bookings' },
  { name: 'admin-booking-detail', path: '/admin/bookings/booking-1' },
  { name: 'admin-customers', path: '/admin/customers' },
  { name: 'admin-technicians', path: '/admin/technicians' },
  { name: 'admin-tech-detail', path: '/admin/technicians/tech-1' },
  { name: 'admin-analytics', path: '/admin/analytics' },
  { name: 'admin-event-requests', path: '/admin/event-requests' },
]

const EMPTY_ROUTES = [
  { name: 'bookings-empty', path: '/bookings' },
  { name: 'event-requests-empty', path: '/event-requests' },
  { name: 'notifications-empty', path: '/notifications' },
  { name: 'favorites-empty', path: '/favorites' },
  { name: 'technician-dashboard-empty', path: '/technician/dashboard' },
  { name: 'admin-bookings-empty', path: '/admin/bookings' },
]

const ERROR_ROUTES = [
  { name: 'notifications-error', path: '/notifications' },
  { name: 'favorites-error', path: '/favorites' },
  { name: 'technician-dashboard-error', path: '/technician/dashboard' },
  { name: 'admin-dashboard-error', path: '/admin/dashboard' },
  { name: 'admin-analytics-error', path: '/admin/analytics' },
]

const RESPONSIVE_ROUTES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'bookings', path: '/bookings' },
  { name: 'admin-dashboard', path: '/admin/dashboard' },
  { name: 'admin-bookings', path: '/admin/bookings' },
  { name: 'admin-event-requests', path: '/admin/event-requests' },
  { name: 'technician-dashboard', path: '/technician/dashboard' },
]

const WIDTHS = [320, 390, 768, 1024, 1440]

const browser = await chromium.launch({ channel: 'chrome' })
const report = {
  base: BASE,
  fixtures: { customer: customer.name, admin: 'Ananya Rao', theme: 'light + dark' },
  routes: [],
  interactions: [],
  empty: [],
  error: [],
  responsive: [],
  console: [],
  unmatched,
}

const slug = value => value.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase()

async function newContext(theme) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  })
  await context.addInitScript(
    ({ accessToken, adminAccessToken, selectedTheme }) => {
      try {
        localStorage.setItem('heptome_access_token', accessToken)
        localStorage.setItem('heptome_refresh_token', accessToken)
        localStorage.setItem('heptome_admin_token', adminAccessToken)
        localStorage.setItem('heptome_admin_refresh_token', adminAccessToken)
        localStorage.setItem('heptome-theme', selectedTheme)
      } catch {
        /* storage may be unavailable during about:blank */
      }
    },
    { accessToken: customerToken, adminAccessToken: adminToken, selectedTheme: theme },
  )
  await context.route('http://localhost:5000/api/v1/**', handleApi)
  await context.route('http://127.0.0.1:5000/api/v1/**', handleApi)
  return context
}

async function attachAuditListeners(page) {
  page.on('console', message => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/Failed to load resource|net::ERR|ERR_CONNECTION|WebSocket|favicon/i.test(text)) return
    report.console.push({ url: page.url(), text })
  })
  page.on('pageerror', error => report.console.push({ url: page.url(), text: `pageerror: ${error.message}` }))
}

async function visit(page, theme, route, prefix = '') {
  const response = await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' }).catch(() => null)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(350)

  const probe = await page.evaluate(contrastProbe)
  const record = {
    theme,
    route: route.path,
    status: response?.status() ?? null,
    url: page.url(),
    ...probe,
  }

  const name = `${theme}-${prefix}${slug(route.name)}.png`
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: true, animations: 'disabled' })
  return record
}

for (const theme of ['light', 'dark']) {
  const context = await newContext(theme)
  const page = await context.newPage()
  await attachAuditListeners(page)

  for (const route of ROUTES) {
    const record = await visit(page, theme, route)
    report.routes.push(record)
    console.log(
      theme.padEnd(5),
      route.name.padEnd(30),
      `contrast:${String(record.failureCount).padStart(2)}`,
      `overflow:${record.overflow}`,
      record.bodyBg,
    )
  }

  /* Admin booking detail tabs are separate screens, not just hidden content. */
  await page.goto(`${BASE}/admin/bookings/booking-1`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(300)
  for (const tab of ['quote', 'messages', 'timeline', 'documents']) {
    const button = page.getByRole('button', { name: tab, exact: true })
    if (await button.count()) {
      await button.first().click()
      await page.waitForTimeout(200)
      const probe = await page.evaluate(contrastProbe)
      report.interactions.push({ theme, screen: `admin-booking-${tab}`, ...probe })
      await page.screenshot({
        path: `${OUT}/${theme}-admin-booking-${tab}.png`,
        fullPage: true,
        animations: 'disabled',
      })
    }
  }

  /* Toast state after a real status-changing action. */
  await page.goto(`${BASE}/notifications`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(300)
  const markAll = page.getByRole('button', { name: /mark all as read/i })
  if (await markAll.count()) {
    await markAll.click()
    await page.waitForTimeout(500)
    const probe = await page.evaluate(contrastProbe)
    report.interactions.push({ theme, screen: 'notifications-toast', ...probe })
    await page.screenshot({
      path: `${OUT}/${theme}-notifications-toast.png`,
      fullPage: false,
      animations: 'disabled',
    })
  }

  /* Empty states. */
  mockMode = 'empty'
  for (const route of EMPTY_ROUTES) {
    const record = await visit(page, theme, route, 'empty-')
    report.empty.push(record)
    console.log(theme.padEnd(5), `empty ${route.name}`.padEnd(30), `contrast:${String(record.failureCount).padStart(2)}`)
  }

  /* Error states. */
  mockMode = 'error'
  for (const route of ERROR_ROUTES) {
    const record = await visit(page, theme, route, 'error-')
    report.error.push(record)
    console.log(theme.padEnd(5), `error ${route.name}`.padEnd(30), `contrast:${String(record.failureCount).padStart(2)}`)
  }
  mockMode = 'normal'

  /* Responsive overflow probe; only the densest screens, where tables live. */
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    for (const route of RESPONSIVE_ROUTES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('networkidle').catch(() => {})
      await page.waitForTimeout(250)
      const metrics = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
        const offenders = overflow > 0
          ? Array.from(document.querySelectorAll('body *'))
              .filter(element => {
                const rect = element.getBoundingClientRect()
                return rect.right > document.documentElement.clientWidth + 1 && rect.width > 2
              })
              .slice(0, 5)
              .map(element => {
                const rect = element.getBoundingClientRect()
                return `${element.tagName.toLowerCase()}.${String(element.className).split(/\s+/).slice(0, 2).join('.')} (${Math.round(rect.width)}px)`
              })
          : []
        return { overflow, offenders }
      })
      report.responsive.push({ theme, width, route: route.path, ...metrics })
      if (metrics.overflow > 0) console.log('OVERFLOW', theme, width, route.name, metrics.overflow, metrics.offenders)
    }
    if (width === 320 || width === 390) {
      await page.screenshot({
        path: `${OUT}/${theme}-responsive-${width}-admin-bookings.png`,
        fullPage: false,
        animations: 'disabled',
      })
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 })

  await context.close()
}

await fs.writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2))

const all = [...report.routes, ...report.interactions, ...report.empty, ...report.error]
const totalFailures = all.reduce((sum, record) => sum + (record.failureCount ?? 0), 0)
const failing = all.filter(record => (record.failureCount ?? 0) > 0)
console.log(`\nContrast failures: ${totalFailures} across ${failing.length}/${all.length} screen-theme runs`)
console.log(`Console/page errors: ${report.console.length}`)
console.log(`Horizontal overflow runs: ${report.responsive.filter(item => item.overflow > 0).length}/${report.responsive.length}`)
console.log(`Unmatched API fixtures: ${unmatched.length ? [...new Set(unmatched)].join(', ') : 'none'}`)
if (report.console.length) console.log(JSON.stringify(report.console.slice(0, 12), null, 2))

await browser.close()
