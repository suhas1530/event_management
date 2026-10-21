# Heptome — Events & Home Services Platform

Heptome is one product with two verticals: **celebrations** (weddings, corporate events, birthdays, concerts) and **home services** (cleaning, repairs, salon, installation). *Celebrate every moment. Care for every corner.*

A full-stack platform combining **home-service booking** (slot-based, like Urban Company) and **event planning** (inquiry → quote) with AI design, tracking, and a complete admin operations panel.

> **Rebrand & verification:** the platform was renamed from its previous brand to Heptome, and the home page now uses a two-zone 3D "living world" (celebration hall + modern home). What changed, what was tested and what is still blocked is recorded in [`docs/heptome-migration.md`](docs/heptome-migration.md). Test evidence at the time of writing (21 Oct 2026): `npm run build` ✅, `npx tsc --noEmit` ✅, `npm test` 59/59 ✅, Playwright `E2E_CHANNEL=chrome` 62/62 ✅, production theme sweep 64/64 ✅.

---

## ✅ What's Been Built (Complete & Working)

### Core Products

| Product | Status | Features |
|---------|--------|----------|
| **Technician Booking** | ✅ Complete | 9-step booking flow, 11 service categories, real-time status tracking, admin assignment, customer dashboard |
| **Event Planning** | ✅ Complete | Event marketplace, AI-powered design, quote system, admin management |

### Frontend Pages (All Built)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Complete | Living-world hero + two discovery paths, live events/venues, home-services showcase |
| `/services` | ✅ Complete | All services directory (home + event), searchable |
| `/book/technician` | ✅ Complete | 9-step booking flow with validation & auth |
| `/events` | ✅ Complete | Event marketplace with filters |
| `/events/[slug]` | ✅ Complete | Event detail with booking panel |
| `/ai-event-designer` | ✅ Complete | AI design studio with refinement |
| `/login` | ✅ Complete | Multi-role login with smart redirect |
| `/register` | ✅ Complete | Full validation & password strength |
| `/dashboard` | ✅ Complete | Customer dashboard — My Events / My Home Services tabs |
| `/dashboard/booking/[id]` | ✅ Complete | Tech booking detail with timeline & review |
| `/bookings/[id]` | ✅ Complete | Event booking detail with quotes/messages |
| **Admin Portal** | ✅ Complete | Full featured admin panel |
| `/admin/login` | ✅ Complete | Admin authentication |
| `/admin/dashboard` | ✅ Complete | KPIs, revenue charts, quick stats |
| `/admin/bookings` | ✅ Complete | Event bookings management |
| `/admin/bookings/[id]` | ✅ Complete | Event booking detail + quote creation |
| `/admin/technicians` | ✅ Complete | Tech bookings list + stats |
| `/admin/technicians/[id]` | ✅ Complete | Tech booking detail + assign + status |
| `/admin/customers` | ✅ Complete | Customer management |

### Backend APIs (All Built & Type-Safe)

| Module | Status | Features |
|--------|--------|----------|
| **Authentication** | ✅ Complete | JWT tokens, role-based auth, admin auth |
| **Events** | ✅ Complete | CRUD, categories, venues, services, packages |
| **Event Bookings** | ✅ Complete | Full lifecycle, quotes, timeline, messages |
| **Technicians** | ✅ Complete | Profiles, services, booking management |
| **Tech Bookings** | ✅ Complete | Complete workflow, status tracking, admin ops |
| **AI Designer** | ✅ Complete | Event design generation, refinement, estimation |
| **Admin Panel** | ✅ Complete | Dashboard stats, booking management, customers |
| **Notifications** | ✅ Complete | Multi-channel, bulk send |
| **Reviews & Favorites** | ✅ Complete | Customer feedback system |

### Database Schema (Complete)

| Model Cluster | Status | Tables |
|---------------|--------|---------|
| **Users & Auth** | ✅ Complete | User, Admin, RefreshToken |
| **Events** | ✅ Complete | Event, EventCategory, Venue, Service, EventService, Package |
| **Event Bookings** | ✅ Complete | Booking, Quote, Payment, BookingTimeline, Message |
| **Technicians** | ✅ Complete | Technician, TechnicianService, TechnicianBooking, TechnicianBookingTimeline, TechnicianPayment, TechnicianReview |
| **AI & Content** | ✅ Complete | AIDesign, Review, Favorite, Notification, AuditLog |

---

## ❌ What's NOT Been Built (Future Implementation)

### Technician-Facing Features
- [ ] `/technician/dashboard` — Technician job management portal
- [ ] `/technician/profile` — Profile management, availability settings
- [ ] `/technician/earnings` — Payment history, earnings analytics
- [ ] Technician mobile app
- [ ] Real-time location tracking during service

### Advanced Customer Features  
- [ ] `/account/profile` — Comprehensive profile management
- [ ] `/account/addresses` — Saved addresses management
- [ ] `/account/payment-methods` — Saved cards/payment methods
- [ ] Customer mobile app
- [ ] Push notifications
- [ ] Live chat during service

### Advanced Admin Features
- [ ] `/admin/technicians/profiles` — Technician profile management
- [ ] `/admin/technicians/onboarding` — Technician verification flow
- [ ] `/admin/events/create` — Event creation interface
- [ ] `/admin/venues` — Venue management
- [ ] `/admin/services/manage` — Service catalog management
- [ ] `/admin/finance/reports` — Advanced financial reporting
- [ ] `/admin/marketing` — Campaign management
- [ ] Inventory management for events
- [ ] Vendor management system

### Payment Integration
- [ ] Razorpay/Stripe integration
- [ ] Split payments (advance + balance)
- [ ] Refund management
- [ ] Invoice generation
- [ ] GST calculations

### Communication Features
- [ ] SMS notifications (Twilio)
- [ ] Email templates (SendGrid)
- [ ] WhatsApp notifications
- [ ] Video call integration for consultations

### Advanced Business Features
- [ ] Multi-city expansion
- [ ] Franchise management
- [ ] Commission tracking
- [ ] Performance analytics
- [ ] Dynamic pricing
- [ ] Loyalty program
- [ ] Referral system

### Technical Infrastructure
- [ ] Redis caching
- [ ] File upload (AWS S3)
- [ ] CDN integration
- [ ] Monitoring & logging
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [x] Automated testing suite — Vitest unit tests + Playwright browser tests

---

## 🎯 Current State: MVP Complete

**What works right now:**
✅ Customers can book technicians through 11-step flow  
✅ Admins can manage all bookings with full visibility  
✅ AI generates complete event designs  
✅ Quote system with customer approval workflow  
✅ Real-time status tracking for all bookings  
✅ Complete user authentication & role management  
✅ Revenue analytics and business metrics  

**Ready for:**
🚀 User testing  
🚀 Beta launch  
🚀 Small-scale production deployment  

**Next priorities for production:**
1. Payment gateway integration
2. SMS/email notifications  
3. Technician dashboard
4. Mobile responsiveness improvements
5. Performance optimization

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB via Prisma ORM 5.22 |
| Auth | JWT (access + refresh), Argon2id |
| AI | OpenAI-compatible API (built-in fallback — no key needed) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm / pnpm

### 1 — Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your MongoDB connection string

npm install
npx prisma generate
npx tsx prisma/seed.ts    # load demo data
npm run dev               # → http://localhost:5000
```

### 2 — Frontend

```bash
# From project root
cp .env.example .env.local
# NEXT_PUBLIC_API_URL is already set to http://localhost:5000/api/v1

npm install
npm run dev               # → http://localhost:3000
```

---

## Testing

```bash
# Unit tests (Vitest)
npm test
npx tsc --noEmit

# Browser tests (Playwright) — backend and frontend must be running
# The bundled Chromium download may be unavailable; use the installed Chrome.
E2E_CHANNEL=chrome npx playwright test

# Production build
npm run build
```

E2E talks to the live API at `http://localhost:5000`; start the backend with a
test-only raised rate limit so the data-dependent cases are exercised instead
of skipped: `RATE_LIMIT_MAX=10000 npm run dev` (PowerShell:
`$env:RATE_LIMIT_MAX='10000'; npm run dev`). The suite covers auth, discovery,
both booking wizards, brand regression, theme persistence and the admin sign-in
flow. See [`docs/heptome-migration.md`](docs/heptome-migration.md) for the
current evidence and the gaps that require seed data.

---

## Demo Accounts

These accounts are seeded by the backend and still use the legacy `@avan.events` domain, which the frontend rebrand intentionally left unchanged (see the migration report).

| Role | Email | Password | Redirects to |
|------|-------|----------|-------------|
| Customer | `demo@avan.events` | `Customer@123` | `/dashboard` |
| Admin | `admin@avan.events` | `Admin@12345` | `/admin/dashboard` |
| Super Admin | `super@avan.events` | `SuperAdmin@123` | `/admin/dashboard` |
| Event Manager | `manager@avan.events` | `Manager@123` | `/admin/dashboard` |

---

## Complete Journey Tests

### Test 1 — Customer requests a home service
```
/ → Book a Home Service
→ Select category: Cleaning & Pest Control
→ Select a service from the live catalogue
→ Address + pincode in Bengaluru (560034 is covered; other cities are refused)
→ Select: Today, 2:00–4:00 PM slot
→ Any technician
→ Describe problem: "Tap is dripping"
→ Review pricing (₹99 visit charge + the service's live estimate + 18% GST)
→ Select: Cash on Service → Submit
→ Status: "Slot requested — awaiting confirmation" until an admin confirms
```

> **Live database caveat:** the seed script creates no `TechnicianService` rows, so
> every bookable category currently shows "no bookable services listed yet — ask the
> team" and a real booking cannot be completed. Prices are never hard-coded on the
> client; they are read from that catalogue. See the migration report.

### Test 2 — Admin assigns + advances technician booking
```
/admin/login → admin@avan.events / Admin@12345
→ Admin dashboard
→ Tech Bookings (sidebar)
→ Find the TECH booking
→ Open it
→ Assign a technician (if not auto-assigned)
→ Click "Mark: Confirmed" → "Mark: Tech Assigned" → etc.
→ Timeline updates on customer dashboard automatically
```

### Test 3 — Customer books an event
```
/ → Explore Events → Pick a wedding
→ Select date / guests / package
→ Request booking → EVT-2026-XXXXXX
```

### Test 4 — Admin creates a quote
```
/admin/bookings → Find EVT booking
→ Open → Quote tab
→ Add line items: "Decoration, 1, 25000" etc.
→ Create & Send Quote
→ Customer sees "Action required" banner on /dashboard
→ Customer approves → Status → PAYMENT_PENDING
```

---

## Booking Number Formats

| Type | Format | Example |
|------|--------|---------|
| Event booking | `EVT-YYYY-XXXXXX` | `EVT-2026-483920` |
| Technician booking | `TECH-YYYY-XXXXXX` | `TECH-2026-192847` |

---

## Technician Booking Status Flow

```
PENDING
  → CONFIRMED          (admin confirms)
  → TECHNICIAN_ASSIGNED (admin assigns tech)
  → TECHNICIAN_CONFIRMED (tech confirms)
  → TECHNICIAN_ON_THE_WAY
  → TECHNICIAN_ARRIVED
  → SERVICE_STARTED
  → SERVICE_COMPLETED
  → PAYMENT_COMPLETED
  → REVIEW_SUBMITTED
  (or CANCELLED / REJECTED at any point)
```

## Event Booking Status Flow

```
DRAFT → REQUESTED → PENDING_REVIEW → QUOTED → CUSTOMER_APPROVAL
  → PAYMENT_PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
  (or CANCELLED / REJECTED)
```

---

## AI Event Designer

Works with no API key — intelligent built-in fallback generates:
- Theme, mood, colour palette
- Décor, food, entertainment, photography plans
- Budget breakdown
- Day-of timeline
- Venue recommendations

To use OpenAI GPT-4, add to `backend/.env`:
```
AI_API_KEY=sk-your-openai-key
AI_MODEL=gpt-4-turbo-preview
```

---

## Backend API Reference

```
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/admin/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/profile

# Events
GET    /api/v1/events
GET    /api/v1/events/featured
GET    /api/v1/events/slug/:slug
GET    /api/v1/events/categories
GET    /api/v1/events/venues
GET    /api/v1/events/services
GET    /api/v1/events/packages

# Event Bookings
POST   /api/v1/bookings
GET    /api/v1/bookings
GET    /api/v1/bookings/:id
GET    /api/v1/bookings/:id/quotes
POST   /api/v1/bookings/:id/quotes/:quoteId/approve
GET    /api/v1/bookings/:id/timeline
GET    /api/v1/bookings/:id/messages
POST   /api/v1/bookings/:id/messages

# Technicians
GET    /api/v1/technicians
GET    /api/v1/technicians/available
GET    /api/v1/technicians/services/category/:category
POST   /api/v1/technicians/bookings
GET    /api/v1/technicians/bookings/my
GET    /api/v1/technicians/bookings/:id
DELETE /api/v1/technicians/bookings/:id
POST   /api/v1/technicians/bookings/:id/review
GET    /api/v1/technicians/admin/bookings    (admin token)
PATCH  /api/v1/technicians/admin/bookings/:id/status
POST   /api/v1/technicians/admin/bookings/:id/assign

# AI
POST   /api/v1/ai/event-design
POST   /api/v1/ai/refine-design
POST   /api/v1/ai/estimate
GET    /api/v1/ai/designs

# Admin
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/bookings
PATCH  /api/v1/admin/bookings/:id
POST   /api/v1/admin/bookings/:id/quotes
GET    /api/v1/admin/customers

# Notifications
GET    /api/v1/notifications
PATCH  /api/v1/notifications/read-all

# Reviews & Favorites
POST   /api/v1/reviews
POST   /api/v1/favorites/toggle
```

---

## Project Structure

```
event-management-platform/
├── app/
│   ├── page.tsx                     ← Landing page
│   ├── (auth)/                      ← login, register, forgot-password
│   ├── (customer)/bookings/         ← Event booking pages
│   ├── dashboard/                   ← Customer dashboard (tech + events)
│   ├── dashboard/booking/[id]/      ← Tech booking detail
│   ├── book/technician/             ← 9-step booking flow
│   ├── services/                    ← Services directory
│   ├── events/                      ← Event marketplace
│   ├── ai-event-designer/           ← AI design studio
│   └── admin/                       ← Full admin panel
│       ├── dashboard/
│       ├── bookings/
│       ├── technicians/             ← NEW: tech booking management
│       └── customers/
├── lib/
│   ├── api.ts                       ← Typed API client + all types
│   └── auth-context.tsx             ← Auth hooks
├── components/
│   ├── layout/Navbar, Footer
│   ├── event/EventCard
│   ├── booking/BookingTimeline
│   └── shared/StatusBadge, LoadingSpinner, EmptyState
└── backend/
    ├── prisma/
    │   ├── schema.prisma            ← Full schema with Technician cluster
    │   └── seed.ts                  ← Demo data
    └── src/
        ├── routes/
        │   ├── auth, events, bookings, admin, ai
        │   ├── notifications, favorites, reviews
        │   └── technicians          ← NEW
        ├── services/
        │   ├── auth, event, booking, admin, ai, notification
        │   └── technician           ← NEW
        └── validators/
            ├── auth, event, booking, ai, notification
            └── technician           ← NEW
```

---

## Production Deployment

```bash
# Backend
cd backend
NODE_ENV=production npm run build
node dist/index.js

# Frontend
NODE_ENV=production npm run build
npm start

# Nginx — proxy :3000 (frontend) and :5000 (API)
```

Set all environment variables. Never commit `.env` files.
