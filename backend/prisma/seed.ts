/**
 * avān. — Database seed
 * Run: cd backend && npx tsx prisma/seed.ts
 *
 * Creates:
 *  - 1 super admin + 1 admin + 1 event manager
 *  - 1 demo customer + 1 demo vendor
 *  - 12 event categories
 *  - 18 services
 *  - 5 venues
 *  - 20 events (across categories)
 *  - 10 packages
 *  - 5 sample bookings for the demo customer
 *  - 10 testimonial reviews
 */

import { PrismaClient, Role, EventType, ServiceCategory, PricingType, BookingStatus, PaymentStatus } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function hashPw(password: string) {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const UNSPLASH_EVENTS = [
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
]

function randImg() { return UNSPLASH_EVENTS[Math.floor(Math.random() * UNSPLASH_EVENTS.length)] }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding avān. database…')

  // ── Admins ──────────────────────────────────────────────────────────────────
  const superAdminHash = await hashPw('SuperAdmin@123')
  const adminHash = await hashPw('Admin@12345')
  const managerHash = await hashPw('Manager@123')

  const superAdmin = await prisma.admin.upsert({
    where: { email: 'super@avan.events' },
    update: {},
    create: { email: 'super@avan.events', passwordHash: superAdminHash, name: 'Super Admin', role: Role.SUPER_ADMIN },
  })

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@avan.events' },
    update: {},
    create: { email: 'admin@avan.events', passwordHash: adminHash, name: 'Priya Sharma', role: Role.ADMIN },
  })

  const manager = await prisma.admin.upsert({
    where: { email: 'manager@avan.events' },
    update: {},
    create: { email: 'manager@avan.events', passwordHash: managerHash, name: 'Arjun Mehta', role: Role.EVENT_MANAGER },
  })

  console.log('✅ Admins created')

  // ── Users ───────────────────────────────────────────────────────────────────
  const customerHash = await hashPw('Customer@123')
  const vendorHash = await hashPw('Vendor@1234')

  const customer = await prisma.user.upsert({
    where: { email: 'demo@avan.events' },
    update: {},
    create: {
      email: 'demo@avan.events',
      passwordHash: customerHash,
      name: 'Suhas Reddy',
      phone: '+919876543210',
      role: Role.CUSTOMER,
      isActive: true,
      isEmailVerified: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'vendor@avan.events' },
    update: {},
    create: {
      email: 'vendor@avan.events',
      passwordHash: vendorHash,
      name: 'Kiran Events Co.',
      role: Role.VENDOR,
      isActive: true,
    },
  })

  console.log('✅ Users created')

  // ── Event Categories ─────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Weddings', icon: '💍', description: 'Celebrate love with a perfect wedding ceremony and reception', image: UNSPLASH_EVENTS[0] },
    { name: 'Birthdays', icon: '🎂', description: 'Make every birthday unforgettable', image: UNSPLASH_EVENTS[2] },
    { name: 'Engagements', icon: '💎', description: 'Mark the beginning of forever', image: UNSPLASH_EVENTS[3] },
    { name: 'Baby Showers', icon: '👶', description: 'Welcome the newest family member in style', image: UNSPLASH_EVENTS[6] },
    { name: 'Anniversaries', icon: '❤️', description: 'Celebrate years of love and togetherness', image: UNSPLASH_EVENTS[4] },
    { name: 'Corporate Events', icon: '🏢', description: 'Professional events that inspire and engage', image: UNSPLASH_EVENTS[7] },
    { name: 'Kids\' Parties', icon: '🎈', description: 'Magical celebrations for the little ones', image: UNSPLASH_EVENTS[2] },
    { name: 'Naming Ceremonies', icon: '🕊️', description: 'Welcome a new life with traditional warmth', image: UNSPLASH_EVENTS[6] },
    { name: 'Graduations', icon: '🎓', description: 'Celebrate academic achievements in grand style', image: UNSPLASH_EVENTS[9] },
    { name: 'Conferences', icon: '🎤', description: 'Professional conferences and summits', image: UNSPLASH_EVENTS[7] },
    { name: 'Housewarming', icon: '🏠', description: 'Welcome friends and family to your new home', image: UNSPLASH_EVENTS[4] },
    { name: 'Theme Parties', icon: '🎭', description: 'Immersive themed celebrations for all ages', image: UNSPLASH_EVENTS[5] },
  ]

  const categories: Record<string, { id: string }> = {}
  for (let i = 0; i < categoryData.length; i++) {
    const cat = categoryData[i]
    const record = await prisma.eventCategory.upsert({
      where: { slug: slug(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slug(cat.name),
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        displayOrder: i,
        isActive: true,
      },
    })
    categories[cat.name] = record
  }

  console.log('✅ Event categories created')

  // ── Venues ───────────────────────────────────────────────────────────────────
  const venueData = [
    {
      name: 'The Grand Pavilion',
      slug: 'the-grand-pavilion',
      description: 'A stunning ballroom with 30-foot ceilings, crystal chandeliers, and panoramic garden views. Perfect for grand weddings and corporate galas.',
      address: '42 Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra',
      capacity: 800, minCapacity: 100, pricePerDay: 450000,
      images: [UNSPLASH_EVENTS[0], UNSPLASH_EVENTS[1]],
      amenities: ['Valet Parking', 'Bridal Suite', 'Full AV Setup', 'In-house Catering', 'Air Conditioning', 'Power Backup', 'Helipad Access'],
    },
    {
      name: 'Rosewood Garden Estate',
      slug: 'rosewood-garden-estate',
      description: 'A sprawling 5-acre heritage estate with manicured gardens, a colonial bungalow, and natural water features. Ideal for outdoor weddings.',
      address: '18 Mehrauli Road', city: 'Delhi', state: 'Delhi NCR',
      capacity: 500, minCapacity: 50, pricePerDay: 350000,
      images: [UNSPLASH_EVENTS[3], UNSPLASH_EVENTS[4]],
      amenities: ['Outdoor Lawns', 'Gazebo', 'Pool', 'Colonial Bungalow', 'Tent Option', 'Generator Backup'],
    },
    {
      name: 'Skyline Rooftop Lounge',
      slug: 'skyline-rooftop-lounge',
      description: 'Breathtaking 360-degree city views from this premium rooftop venue. Perfect for intimate celebrations and cocktail events.',
      address: '78 MG Road', city: 'Bangalore', state: 'Karnataka',
      capacity: 200, minCapacity: 30, pricePerDay: 175000,
      images: [UNSPLASH_EVENTS[8], UNSPLASH_EVENTS[5]],
      amenities: ['City Views', 'Open Bar Setup', 'DJ Console', 'LED Walls', 'Lounge Seating'],
    },
    {
      name: 'The Lakeside Retreat',
      slug: 'the-lakeside-retreat',
      description: 'Nestled beside a serene lake with mountain backdrops. A destination venue that creates cinematic memories.',
      address: '5 Lake District Road', city: 'Udaipur', state: 'Rajasthan',
      capacity: 300, minCapacity: 40, pricePerDay: 280000,
      images: [UNSPLASH_EVENTS[0], UNSPLASH_EVENTS[9]],
      amenities: ['Lake View', 'Boat Rides', 'Heritage Architecture', 'Outdoor Terrace', 'Photography Points'],
    },
    {
      name: 'Metro Convention Centre',
      slug: 'metro-convention-centre',
      description: 'State-of-the-art convention centre with modular spaces for conferences, exhibitions, and large-scale corporate events.',
      address: '100 OMR Tech Park', city: 'Chennai', state: 'Tamil Nadu',
      capacity: 2000, minCapacity: 200, pricePerDay: 600000,
      images: [UNSPLASH_EVENTS[7], UNSPLASH_EVENTS[9]],
      amenities: ['4K Projection', 'Simultaneous Translation Booths', 'Exhibition Halls', '20 Breakout Rooms', 'Dedicated IT Support'],
    },
  ]

  const venues: Record<string, { id: string }> = {}
  for (const v of venueData) {
    const record = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: {},
      create: v,
    })
    venues[v.name] = record
  }

  console.log('✅ Venues created')

  // ── Services ─────────────────────────────────────────────────────────────────
  const serviceData = [
    { name: 'Floral Decoration', category: ServiceCategory.DECORATION, basePrice: 35000, pricingType: PricingType.FIXED, description: 'Premium floral arrangements, arches, and centrepieces using seasonal and exotic blooms.', isPopular: true, tags: ['flowers', 'decor', 'floral'] },
    { name: 'Theme Decoration', category: ServiceCategory.DECORATION, basePrice: 55000, pricingType: PricingType.FIXED, description: 'Complete themed décor setups including backdrops, props, lighting, and custom signage.', isPopular: true, tags: ['theme', 'decor', 'props'] },
    { name: 'Stage & Mandap Setup', category: ServiceCategory.STAGE_DECORATION, basePrice: 75000, pricingType: PricingType.FIXED, description: 'Traditional and contemporary stage and mandap designs with premium fabrics and lighting.', isPopular: false, tags: ['wedding', 'stage', 'mandap'] },
    { name: 'Candid Photography', category: ServiceCategory.PHOTOGRAPHY, basePrice: 25000, pricingType: PricingType.FIXED, description: 'Award-winning candid and portrait photography. Minimum 500 edited images, delivered within 10 days.', isPopular: true, tags: ['photography', 'candid', 'portrait'] },
    { name: 'Cinematic Videography', category: ServiceCategory.VIDEOGRAPHY, basePrice: 35000, pricingType: PricingType.FIXED, description: 'Cinematic highlight films, full ceremony coverage, and a 5-minute wedding film.', isPopular: true, tags: ['videography', 'film', 'cinematic'] },
    { name: 'Photo Booth', category: ServiceCategory.PHOTOGRAPHY, basePrice: 12000, pricingType: PricingType.FIXED, description: 'Premium photo booth with props, instant prints, and digital sharing.', isPopular: false, tags: ['photo booth', 'fun'] },
    { name: 'Multi-Cuisine Catering', category: ServiceCategory.CATERING, basePrice: 850, pricingType: PricingType.PER_GUEST, pricePerGuest: 850, description: 'Elaborate multi-cuisine spread including live cooking stations, starters, mains, and desserts.', isPopular: true, tags: ['food', 'catering', 'cuisine'] },
    { name: 'Continental Catering', category: ServiceCategory.CATERING, basePrice: 1200, pricingType: PricingType.PER_GUEST, pricePerGuest: 1200, description: 'Premium continental menu with wine pairing suggestions.', isPopular: false, tags: ['continental', 'gourmet'] },
    { name: 'Designer Cake', category: ServiceCategory.CAKE, basePrice: 4500, pricingType: PricingType.FIXED, description: 'Custom 3-tier fondant cakes crafted to match your event theme. Tasting session included.', isPopular: true, tags: ['cake', 'dessert', 'custom'] },
    { name: 'DJ & Sound System', category: ServiceCategory.DJ, basePrice: 18000, pricingType: PricingType.FIXED, description: 'Professional DJ with top-of-the-line sound system, perfect for events up to 500 guests.', isPopular: true, tags: ['dj', 'music', 'sound'] },
    { name: 'Live Band', category: ServiceCategory.MUSIC, basePrice: 45000, pricingType: PricingType.FIXED, description: '5-piece live band performing Bollywood, classical fusion, and contemporary hits.', isPopular: false, tags: ['band', 'live music'] },
    { name: 'Bridal Makeup & Hair', category: ServiceCategory.MAKEUP, basePrice: 15000, pricingType: PricingType.FIXED, description: 'Celebrity bridal makeup and hairstyling using premium international products.', isPopular: true, tags: ['bridal', 'makeup', 'hair'] },
    { name: 'Mehendi Artist', category: ServiceCategory.MEHENDI, basePrice: 8000, pricingType: PricingType.FIXED, description: 'Expert mehendi artists creating intricate bridal and guest designs.', isPopular: true, tags: ['mehendi', 'henna', 'bridal'] },
    { name: 'Personalized Invitations', category: ServiceCategory.INVITATIONS, basePrice: 5000, pricingType: PricingType.FIXED, description: 'Luxury box invitations with handcrafted cards, wax seals, and personalized messages.', isPopular: false, tags: ['invitations', 'stationery'] },
    { name: 'Premium Lighting', category: ServiceCategory.LIGHTING, basePrice: 28000, pricingType: PricingType.FIXED, description: 'LED wash lights, fairy lights, uplighting, and intelligent moving heads for dramatic effects.', isPopular: true, tags: ['lighting', 'led', 'ambience'] },
    { name: 'Return Gift Curation', category: ServiceCategory.RETURN_GIFTS, basePrice: 250, pricingType: PricingType.PER_GUEST, pricePerGuest: 250, description: 'Curated premium return gift hampers personalised for your guests.', isPopular: false, tags: ['gifts', 'return gifts', 'hampers'] },
    { name: 'Luxury Transportation', category: ServiceCategory.TRANSPORTATION, basePrice: 12000, pricingType: PricingType.FIXED, description: 'Vintage car, limousine, and luxury SUV fleet for bridal and guest transport.', isPopular: false, tags: ['transport', 'car', 'limousine'] },
    { name: 'Entertainment & Games', category: ServiceCategory.ENTERTAINMENT, basePrice: 22000, pricingType: PricingType.FIXED, description: 'Interactive entertainment including magicians, caricature artists, and game setups.', isPopular: false, tags: ['entertainment', 'games', 'fun'] },
  ]

  const services: Record<string, { id: string }> = {}
  for (const s of serviceData) {
    const serviceSlug = slug(s.name)
    const record = await prisma.service.upsert({
      where: { slug: serviceSlug },
      update: {},
      create: { ...s, slug: serviceSlug, images: [randImg()], location: 'Pan India', city: 'Mumbai' },
    })
    services[s.name] = record
  }

  console.log('✅ Services created')

  // ── Events ────────────────────────────────────────────────────────────────────
  const eventData = [
    {
      title: 'The Royal Garden Wedding',
      type: EventType.WEDDING,
      category: 'Weddings',
      venue: 'The Grand Pavilion',
      theme: 'Royal Garden',
      colorPalette: ['#D4A574', '#F4E9D8', '#8B6914', '#FFFFFF'],
      heroImages: [UNSPLASH_EVENTS[0], UNSPLASH_EVENTS[1], UNSPLASH_EVENTS[3]],
      startingPrice: 450000,
      minGuests: 100, maxGuests: 800,
      location: 'The Grand Pavilion, BKC', city: 'Mumbai', state: 'Maharashtra',
      isLuxury: true, isFeatured: true, isIndoor: true,
      description: 'Experience the grandeur of a royal wedding with our signature Royal Garden concept. Every detail — from the hand-curated floral arrangements to the bespoke mehendi designs — is crafted to create a day you will remember forever.',
      shortDescription: 'A grand royal wedding experience with bespoke décor, gourmet dining, and world-class entertainment.',
      services: ['Floral Decoration', 'Stage & Mandap Setup', 'Candid Photography', 'Cinematic Videography', 'Multi-Cuisine Catering', 'DJ & Sound System', 'Bridal Makeup & Hair', 'Mehendi Artist', 'Premium Lighting'],
    },
    {
      title: 'Midnight in Marrakesh Birthday',
      type: EventType.BIRTHDAY,
      category: 'Birthdays',
      venue: 'Skyline Rooftop Lounge',
      theme: 'Midnight Marrakesh',
      colorPalette: ['#1A0A2E', '#D4AF37', '#8B0000', '#F5DEB3'],
      heroImages: [UNSPLASH_EVENTS[2], UNSPLASH_EVENTS[5]],
      startingPrice: 125000,
      minGuests: 30, maxGuests: 200,
      location: 'Skyline Rooftop Lounge, MG Road', city: 'Bangalore', state: 'Karnataka',
      isLuxury: true, isFeatured: true, isOutdoor: true,
      description: 'Transport your guests to the exotic world of Marrakesh. Moroccan lanterns, luxurious drapes, and a bespoke mezze feast create an unforgettable birthday night under the stars.',
      shortDescription: 'An exotic Moroccan-themed birthday celebration under the Bangalore skyline.',
      services: ['Theme Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'DJ & Sound System', 'Designer Cake', 'Premium Lighting'],
    },
    {
      title: 'An Evening in Bloom Engagement',
      type: EventType.ENGAGEMENT,
      category: 'Engagements',
      venue: 'Rosewood Garden Estate',
      theme: 'Botanical Bloom',
      colorPalette: ['#C8B8A2', '#E8D5C4', '#8FBC8F', '#F0E6D3'],
      heroImages: [UNSPLASH_EVENTS[3], UNSPLASH_EVENTS[4]],
      startingPrice: 240000,
      minGuests: 50, maxGuests: 300,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: true, isFeatured: true, isOutdoor: true,
      description: 'A botanical garden engagement ceremony framed by thousands of fresh blooms. Intimate and enchanting, this design focuses on natural elegance and heartfelt moments.',
      shortDescription: 'A botanical garden engagement celebration with organic floral design and romantic ambience.',
      services: ['Floral Decoration', 'Candid Photography', 'Continental Catering', 'Live Band', 'Premium Lighting', 'Personalized Invitations'],
    },
    {
      title: 'Pink Cloud Baby Shower',
      type: EventType.BABY_SHOWER,
      category: 'Baby Showers',
      venue: 'Rosewood Garden Estate',
      theme: 'Pink Cloud',
      colorPalette: ['#FFB6C1', '#FFC0CB', '#FFD700', '#FFFFFF'],
      heroImages: [UNSPLASH_EVENTS[6], UNSPLASH_EVENTS[2]],
      startingPrice: 55000,
      minGuests: 20, maxGuests: 80,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: true, isOutdoor: true,
      description: 'A dreamy pink-and-gold baby shower filled with love and laughter. Interactive games, a custom dessert table, and a photo gallery wall make this the perfect celebration for the mother-to-be.',
      shortDescription: 'A dreamy pink-themed baby shower with games, desserts, and a gorgeous photo wall.',
      services: ['Theme Decoration', 'Candid Photography', 'Designer Cake', 'Multi-Cuisine Catering', 'Entertainment & Games'],
    },
    {
      title: 'Galaxy Theme Birthday Party',
      type: EventType.KIDS_PARTY,
      category: "Kids' Parties",
      venue: 'Skyline Rooftop Lounge',
      theme: 'Galaxy Adventure',
      colorPalette: ['#0D0D2B', '#4B0082', '#9400D3', '#FFD700'],
      heroImages: [UNSPLASH_EVENTS[5], UNSPLASH_EVENTS[8]],
      startingPrice: 35000,
      minGuests: 15, maxGuests: 60,
      location: 'Skyline Rooftop Lounge, MG Road', city: 'Bangalore', state: 'Karnataka',
      isLuxury: false, isFeatured: false, isIndoor: true,
      description: 'Blast off into a galaxy adventure! Space-themed décor, astronaut props, a rocket cake, and science experiments make this the most exciting birthday on the planet.',
      shortDescription: "A cosmic adventure birthday party for kids with space-themed décor and interactive activities.",
      services: ['Theme Decoration', 'Candid Photography', 'Designer Cake', 'Entertainment & Games'],
    },
    {
      title: 'Lakeside Anniversary Dinner',
      type: EventType.ANNIVERSARY,
      category: 'Anniversaries',
      venue: 'The Lakeside Retreat',
      theme: 'Golden Romance',
      colorPalette: ['#FFD700', '#FFF8DC', '#B8860B', '#FFFFFF'],
      heroImages: [UNSPLASH_EVENTS[4], UNSPLASH_EVENTS[0]],
      startingPrice: 180000,
      minGuests: 20, maxGuests: 120,
      location: 'The Lakeside Retreat, Lake District', city: 'Udaipur', state: 'Rajasthan',
      isLuxury: true, isFeatured: true, isOutdoor: true,
      description: 'Celebrate your golden years with an intimate lakeside dinner under the Rajasthan sky. Private dining, live serenade, and a curated memory journey through your years together.',
      shortDescription: 'An intimate lakeside anniversary celebration with live music, private dining, and golden décor.',
      services: ['Floral Decoration', 'Candid Photography', 'Continental Catering', 'Live Band', 'Premium Lighting'],
    },
    {
      title: 'TechSummit Conference 2026',
      type: EventType.CONFERENCE,
      category: 'Conferences',
      venue: 'Metro Convention Centre',
      theme: 'Modern Professional',
      colorPalette: ['#1E3A5F', '#FFFFFF', '#00A8E8', '#F0F0F0'],
      heroImages: [UNSPLASH_EVENTS[7], UNSPLASH_EVENTS[9]],
      startingPrice: 500000,
      minGuests: 200, maxGuests: 2000,
      location: 'Metro Convention Centre, OMR', city: 'Chennai', state: 'Tamil Nadu',
      isLuxury: false, isFeatured: false, isIndoor: true,
      description: 'A world-class conference setup with simultaneous translation, live streaming, dedicated speaker lounges, and curated networking sessions.',
      shortDescription: 'Professional conference setup with AV, translation, networking zones, and gala dinner.',
      services: ['Theme Decoration', 'Cinematic Videography', 'Continental Catering', 'DJ & Sound System', 'Premium Lighting'],
    },
    {
      title: 'Sapphire Corporate Gala',
      type: EventType.CORPORATE,
      category: 'Corporate Events',
      venue: 'The Grand Pavilion',
      theme: 'Sapphire Gala',
      colorPalette: ['#0F52BA', '#FFFFFF', '#C0C0C0', '#1C1C1E'],
      heroImages: [UNSPLASH_EVENTS[7], UNSPLASH_EVENTS[8]],
      startingPrice: 350000,
      minGuests: 100, maxGuests: 600,
      location: 'The Grand Pavilion, BKC', city: 'Mumbai', state: 'Maharashtra',
      isLuxury: true, isFeatured: false, isIndoor: true,
      description: 'A premium corporate gala evening for employee recognition, product launches, and annual award nights. Fine dining, live entertainment, and bespoke event branding.',
      shortDescription: 'Premium corporate gala with awards, fine dining, and live entertainment for up to 600 guests.',
      services: ['Theme Decoration', 'Candid Photography', 'Cinematic Videography', 'Multi-Cuisine Catering', 'DJ & Sound System', 'Premium Lighting'],
    },
    {
      title: 'Pastel Dream Engagement',
      type: EventType.ENGAGEMENT,
      category: 'Engagements',
      venue: 'Rosewood Garden Estate',
      theme: 'Pastel Dream',
      colorPalette: ['#FFD1DC', '#C9EBF5', '#FFF0BA', '#D4EAD0'],
      heroImages: [UNSPLASH_EVENTS[3], UNSPLASH_EVENTS[1]],
      startingPrice: 120000,
      minGuests: 30, maxGuests: 150,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: false, isOutdoor: true,
      description: 'A soft, romantic pastel-themed engagement surrounded by fresh blossoms and warm candlelight. Ideal for intimate family celebrations.',
      shortDescription: 'Soft pastel engagement ceremony with floral décor and candlelit dinner.',
      services: ['Floral Decoration', 'Candid Photography', 'Continental Catering', 'Designer Cake', 'Premium Lighting'],
    },
    {
      title: 'Graduation Garden Party',
      type: EventType.GRADUATION,
      category: 'Graduations',
      venue: 'Rosewood Garden Estate',
      theme: 'Garden Celebration',
      colorPalette: ['#2E8B57', '#FFD700', '#FFFFFF', '#F0E68C'],
      heroImages: [UNSPLASH_EVENTS[9], UNSPLASH_EVENTS[6]],
      startingPrice: 45000,
      minGuests: 20, maxGuests: 100,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: false, isOutdoor: true,
      description: 'Celebrate academic achievement with a sophisticated garden party. Photo wall, personalised trophy display, and a celebratory dinner make this graduation truly memorable.',
      shortDescription: 'Garden graduation party with photo wall, trophy display, and celebratory dinner.',
      services: ['Theme Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'Designer Cake'],
    },
    {
      title: 'Proposal Under the Stars',
      type: EventType.PROPOSAL,
      category: 'Weddings',
      venue: 'The Lakeside Retreat',
      theme: 'Starlit Romance',
      colorPalette: ['#1C1C2E', '#E0C9A6', '#FF6B9D', '#FFFFFF'],
      heroImages: [UNSPLASH_EVENTS[0], UNSPLASH_EVENTS[4]],
      startingPrice: 75000,
      minGuests: 2, maxGuests: 20,
      location: 'The Lakeside Retreat, Lake District', city: 'Udaipur', state: 'Rajasthan',
      isLuxury: true, isFeatured: false, isOutdoor: true,
      description: 'Create the most magical proposal moment with a private lakeside setup. Rose petal pathway, floating candles, a live violinist, and a surprise dessert await.',
      shortDescription: 'A private lakeside proposal setup with rose petals, candles, and live music.',
      services: ['Floral Decoration', 'Candid Photography', 'Continental Catering', 'Live Band'],
    },
    {
      title: 'Golden Housewarming Ceremony',
      type: EventType.HOUSEWARMING,
      category: 'Housewarming',
      venue: 'Rosewood Garden Estate',
      theme: 'Golden Puja',
      colorPalette: ['#FFD700', '#FF8C00', '#8B0000', '#FFFFF0'],
      heroImages: [UNSPLASH_EVENTS[6], UNSPLASH_EVENTS[2]],
      startingPrice: 65000,
      minGuests: 30, maxGuests: 200,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: false, isIndoor: true,
      description: 'Bless your new home with a traditional Griha Pravesh ceremony followed by a warm celebration with family and friends. We handle the puja arrangements, catering, and décor.',
      shortDescription: 'Traditional Griha Pravesh ceremony with puja arrangements and celebratory feast.',
      services: ['Floral Decoration', 'Candid Photography', 'Multi-Cuisine Catering'],
    },
    {
      title: 'Bollywood Theme Night',
      type: EventType.THEME_PARTY,
      category: 'Theme Parties',
      venue: 'Skyline Rooftop Lounge',
      theme: 'Bollywood Glamour',
      colorPalette: ['#FF0000', '#FFD700', '#FF69B4', '#1C1C1E'],
      heroImages: [UNSPLASH_EVENTS[5], UNSPLASH_EVENTS[2]],
      startingPrice: 85000,
      minGuests: 40, maxGuests: 200,
      location: 'Skyline Rooftop Lounge, MG Road', city: 'Bangalore', state: 'Karnataka',
      isLuxury: false, isFeatured: false, isIndoor: true,
      description: 'A night straight out of a blockbuster! Bollywood props, film poster personalization, a DJ spinning iconic songs, and a nacho-meets-butter-chicken menu.',
      shortDescription: 'A glam Bollywood-themed party night with DJ, props, photo booth, and filmy food.',
      services: ['Theme Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'DJ & Sound System', 'Entertainment & Games'],
    },
    {
      title: 'Luxury Product Launch',
      type: EventType.PRODUCT_LAUNCH,
      category: 'Corporate Events',
      venue: 'Metro Convention Centre',
      theme: 'Premium Launch',
      colorPalette: ['#000000', '#FFFFFF', '#C0C0C0', '#FFD700'],
      heroImages: [UNSPLASH_EVENTS[9], UNSPLASH_EVENTS[7]],
      startingPrice: 275000,
      minGuests: 100, maxGuests: 500,
      location: 'Metro Convention Centre, OMR', city: 'Chennai', state: 'Tamil Nadu',
      isLuxury: true, isFeatured: false, isIndoor: true,
      description: 'A high-impact product launch experience with dramatic reveal lighting, media wall, influencer zones, and premium networking. Make your brand launch truly unforgettable.',
      shortDescription: 'High-impact product launch with reveal lighting, media wall, and influencer zones.',
      services: ['Theme Decoration', 'Cinematic Videography', 'Continental Catering', 'Premium Lighting', 'DJ & Sound System'],
    },
    {
      title: 'Farewell Gala Evening',
      type: EventType.FAREWELL,
      category: 'Corporate Events',
      venue: 'The Grand Pavilion',
      theme: 'Golden Chapter',
      colorPalette: ['#B8860B', '#FFFFF0', '#2F4F4F', '#FFD700'],
      heroImages: [UNSPLASH_EVENTS[8], UNSPLASH_EVENTS[4]],
      startingPrice: 95000,
      minGuests: 40, maxGuests: 300,
      location: 'The Grand Pavilion, BKC', city: 'Mumbai', state: 'Maharashtra',
      isLuxury: false, isFeatured: false, isIndoor: true,
      description: 'Send off a valued colleague or friend with an elegant farewell gala — personalised tributes, memory video, award ceremony, and a fine dining experience.',
      shortDescription: 'Elegant farewell gala with memory video, tribute ceremony, and fine dining.',
      services: ['Theme Decoration', 'Candid Photography', 'Cinematic Videography', 'Multi-Cuisine Catering', 'DJ & Sound System'],
    },
    {
      title: 'Festival of Lights Celebration',
      type: EventType.FESTIVAL,
      category: 'Theme Parties',
      venue: 'Rosewood Garden Estate',
      theme: 'Festival of Lights',
      colorPalette: ['#FF8C00', '#FFD700', '#DC143C', '#FFFFF0'],
      heroImages: [UNSPLASH_EVENTS[5], UNSPLASH_EVENTS[3]],
      startingPrice: 70000,
      minGuests: 50, maxGuests: 400,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: false, isOutdoor: true,
      description: 'A magical Diwali or festival celebration with thousands of diyas, vibrant rangoli, traditional music, and an elaborate mithai and snack spread.',
      shortDescription: 'Vibrant festival celebration with diyas, rangoli, traditional music, and festive feast.',
      services: ['Floral Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'Live Band', 'Premium Lighting'],
    },
    {
      title: 'Intimate Private Celebration',
      type: EventType.PRIVATE_CELEBRATION,
      category: 'Theme Parties',
      venue: 'Skyline Rooftop Lounge',
      theme: 'Bespoke Intimate',
      colorPalette: ['#2C2C2C', '#D4A574', '#F4EDD8', '#FFFFFF'],
      heroImages: [UNSPLASH_EVENTS[8], UNSPLASH_EVENTS[1]],
      startingPrice: 55000,
      minGuests: 10, maxGuests: 50,
      location: 'Skyline Rooftop Lounge, MG Road', city: 'Bangalore', state: 'Karnataka',
      isLuxury: true, isFeatured: false, isOutdoor: true,
      description: 'A fully bespoke private celebration for life\'s intimate milestones. We design every detail around you — from the playlist to the plating.',
      shortDescription: 'Fully bespoke private celebration for intimate milestones, curated just for you.',
      services: ['Theme Decoration', 'Candid Photography', 'Continental Catering', 'Live Band', 'Premium Lighting'],
    },
    {
      title: 'Enchanted Forest Birthday',
      type: EventType.BIRTHDAY,
      category: 'Birthdays',
      venue: 'Rosewood Garden Estate',
      theme: 'Enchanted Forest',
      colorPalette: ['#228B22', '#8B4513', '#FFD700', '#F5F5DC'],
      heroImages: [UNSPLASH_EVENTS[3], UNSPLASH_EVENTS[6]],
      startingPrice: 95000,
      minGuests: 25, maxGuests: 150,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: false, isOutdoor: true,
      description: 'Step into a magical enchanted forest for an unforgettable birthday. Twinkling fairy lights, moss installations, woodland creatures, and a mystical cake await.',
      shortDescription: 'Magical woodland birthday with fairy lights, moss décor, and an enchanted cake.',
      services: ['Theme Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'Designer Cake', 'Entertainment & Games', 'Premium Lighting'],
    },
    {
      title: 'Silver Anniversary Soirée',
      type: EventType.ANNIVERSARY,
      category: 'Anniversaries',
      venue: 'The Grand Pavilion',
      theme: 'Silver Elegance',
      colorPalette: ['#C0C0C0', '#FFFFFF', '#808080', '#F5F5F5'],
      heroImages: [UNSPLASH_EVENTS[0], UNSPLASH_EVENTS[4]],
      startingPrice: 220000,
      minGuests: 60, maxGuests: 400,
      location: 'The Grand Pavilion, BKC', city: 'Mumbai', state: 'Maharashtra',
      isLuxury: true, isFeatured: false, isIndoor: true,
      description: 'Mark 25 years of love with a silver-white gala. Re-enact your first dance, host a family video tribute, and celebrate with a 3-tier silver cake.',
      shortDescription: '25th anniversary silver gala with tribute video, first dance re-enactment, and silver cake.',
      services: ['Floral Decoration', 'Stage & Mandap Setup', 'Candid Photography', 'Cinematic Videography', 'Continental Catering', 'Live Band', 'Premium Lighting'],
    },
    {
      title: 'Rainbow Kids Party',
      type: EventType.KIDS_PARTY,
      category: "Kids' Parties",
      venue: 'Rosewood Garden Estate',
      theme: 'Rainbow & Unicorn',
      colorPalette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
      heroImages: [UNSPLASH_EVENTS[2], UNSPLASH_EVENTS[6]],
      startingPrice: 28000,
      minGuests: 15, maxGuests: 50,
      location: 'Rosewood Garden Estate, Mehrauli', city: 'Delhi', state: 'Delhi NCR',
      isLuxury: false, isFeatured: false, isOutdoor: true,
      description: 'A rainbow-and-unicorn birthday party bursting with colour, magic, and joy. Balloon garlands, a unicorn cake, face painting, and return gift hampers for every child.',
      shortDescription: 'Colourful unicorn party with balloon garlands, face painting, and a magical cake.',
      services: ['Theme Decoration', 'Candid Photography', 'Designer Cake', 'Entertainment & Games', 'Return Gift Curation'],
    },
  ]

  const events: Record<string, { id: string }> = {}
  for (let i = 0; i < eventData.length; i++) {
    const e = eventData[i]
    const eventSlug = slug(e.title)
    const catId = categories[e.category]?.id
    const venueId = venues[e.venue]?.id
    if (!catId) { console.warn(`⚠️  Category not found: ${e.category}`); continue }

    const record = await prisma.event.upsert({
      where: { slug: eventSlug },
      update: {},
      create: {
        title: e.title,
        slug: eventSlug,
        description: e.description,
        shortDescription: e.shortDescription,
        categoryId: catId,
        type: e.type,
        theme: e.theme,
        colorPalette: e.colorPalette,
        heroImages: e.heroImages,
        galleryImages: e.heroImages,
        venueId: venueId ?? null,
        minGuests: e.minGuests,
        maxGuests: e.maxGuests,
        startingPrice: e.startingPrice,
        location: e.location,
        city: e.city,
        state: e.state,
        country: 'IN',
        isIndoor: e.isIndoor ?? false,
        isOutdoor: e.isOutdoor ?? false,
        isLuxury: e.isLuxury,
        isActive: true,
        isFeatured: e.isFeatured,
        averageRating: parseFloat((4 + Math.random()).toFixed(1)),
        totalReviews: Math.floor(Math.random() * 48 + 2),
      },
    })
    events[e.title] = record

    // Link services to event
    for (const svcName of e.services) {
      const svc = services[svcName]
      if (svc) {
        await prisma.event.update({
          where: { id: record.id },
          data: { eventServices: { connect: { id: svc.id } } },
        }).catch(() => {})
      }
    }
  }

  console.log('✅ Events created')

  // ── Packages ──────────────────────────────────────────────────────────────────
  const weddingEventId = events['The Royal Garden Wedding']?.id
  const bdayEventId = events['Midnight in Marrakesh Birthday']?.id

  if (weddingEventId) {
    const packageDefs = [
      {
        name: 'Silver Package',
        slug: 'royal-garden-wedding-silver',
        description: 'A beautifully curated wedding package for 100-200 guests. Includes essential services for a perfect day.',
        price: 475000,
        originalPrice: 550000,
        guestLimit: 200,
        highlights: ['Floral décor', 'Candid photography (6hr)', 'Catering ₹850/guest', 'DJ', 'Basic lighting'],
        includes: ['Floral Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'DJ & Sound System', 'Premium Lighting'],
        excludes: ['Videography', 'Bridal Makeup', 'Stage Setup', 'Transportation'],
        isPopular: false,
      },
      {
        name: 'Gold Package',
        slug: 'royal-garden-wedding-gold',
        description: 'Our most popular wedding package. Complete coverage for 200-400 guests with premium photography and entertainment.',
        price: 875000,
        originalPrice: 1050000,
        guestLimit: 400,
        highlights: ['Complete floral setup', 'Photo + video (full day)', 'Stage & Mandap', 'Catering ₹1000/guest', 'Bridal makeup'],
        includes: ['Floral Decoration', 'Stage & Mandap Setup', 'Candid Photography', 'Cinematic Videography', 'Multi-Cuisine Catering', 'Bridal Makeup & Hair', 'Mehendi Artist', 'DJ & Sound System', 'Premium Lighting'],
        excludes: ['Transportation', 'Return Gifts'],
        isPopular: true,
      },
      {
        name: 'Royal Package',
        slug: 'royal-garden-wedding-royal',
        description: 'The ultimate luxury wedding experience. Bespoke everything, for the wedding that deserves no compromises.',
        price: 1750000,
        originalPrice: 2200000,
        guestLimit: 800,
        highlights: ['Bespoke luxury décor', 'Drone + cinematic coverage', 'Continental gourmet dining', 'Live band + DJ', 'Full bridal services', 'Luxury transport'],
        includes: ['Floral Decoration', 'Stage & Mandap Setup', 'Candid Photography', 'Cinematic Videography', 'Continental Catering', 'Bridal Makeup & Hair', 'Mehendi Artist', 'Live Band', 'DJ & Sound System', 'Premium Lighting', 'Luxury Transportation', 'Personalized Invitations', 'Return Gift Curation'],
        excludes: [],
        isPopular: false,
      },
    ]

    for (let i = 0; i < packageDefs.length; i++) {
      const pkg = packageDefs[i]
      await prisma.package.upsert({
        where: { slug: pkg.slug },
        update: {},
        create: {
          ...pkg,
          eventId: weddingEventId,
          images: [randImg()],
          isActive: true,
          displayOrder: i,
        },
      })
    }
  }

  if (bdayEventId) {
    const bdayPackages = [
      {
        name: 'Celebration Package',
        slug: 'marrakesh-birthday-celebration',
        description: 'Perfect for intimate birthday gatherings of 30-60 guests.',
        price: 125000,
        originalPrice: 145000,
        guestLimit: 60,
        highlights: ['Moroccan décor', 'Photography 4hr', 'Dinner for guests', 'DJ', 'Custom cake'],
        includes: ['Theme Decoration', 'Candid Photography', 'Multi-Cuisine Catering', 'DJ & Sound System', 'Designer Cake'],
        excludes: ['Videography', 'Lighting Rig'],
        isPopular: true,
      },
      {
        name: 'Luxury Night Package',
        slug: 'marrakesh-birthday-luxury',
        description: 'The full Midnight Marrakesh experience for up to 150 guests.',
        price: 250000,
        originalPrice: 310000,
        guestLimit: 150,
        highlights: ['Full Moroccan setup', 'Photo + video', 'Gourmet dinner', 'DJ + lighting', 'Custom 3-tier cake', 'Photo booth'],
        includes: ['Theme Decoration', 'Candid Photography', 'Cinematic Videography', 'Continental Catering', 'DJ & Sound System', 'Designer Cake', 'Photo Booth', 'Premium Lighting'],
        excludes: [],
        isPopular: false,
      },
    ]

    for (let i = 0; i < bdayPackages.length; i++) {
      const pkg = bdayPackages[i]
      await prisma.package.upsert({
        where: { slug: pkg.slug },
        update: {},
        create: {
          ...pkg,
          eventId: bdayEventId,
          images: [randImg()],
          isActive: true,
          displayOrder: i,
        },
      })
    }
  }

  console.log('✅ Packages created')

  // ── Demo Bookings ──────────────────────────────────────────────────────────────
  const weddingId = events['The Royal Garden Wedding']?.id
  const bdayId = events['Midnight in Marrakesh Birthday']?.id
  const engagementId = events['An Evening in Bloom Engagement']?.id

  if (weddingId) {
    const bn1 = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`
    const existing = await prisma.booking.findUnique({ where: { bookingNumber: bn1 } }).catch(() => null)
    if (!existing) {
      const b1 = await prisma.booking.create({
        data: {
          bookingNumber: bn1,
          userId: customer.id,
          eventId: weddingId,
          venueId: venues['The Grand Pavilion']?.id,
          assignedAdminId: admin.id,
          status: BookingStatus.CONFIRMED,
          eventDate: new Date('2026-12-15'),
          guestCount: 250,
          budget: 900000,
          notes: 'We would love rose gold as the primary accent colour. Also need a kids\' corner.',
          subtotal: 875000,
          taxAmount: 157500,
          discountAmount: 50000,
          totalAmount: 982500,
          paidAmount: 491250,
          balanceAmount: 491250,
          paymentStatus: PaymentStatus.PARTIAL,
          confirmedAt: new Date(),
        },
      })

      await prisma.bookingTimeline.createMany({
        data: [
          { bookingId: b1.id, status: BookingStatus.REQUESTED, title: 'Booking Requested', description: 'Booking received. Our team will review shortly.', createdAt: new Date('2026-10-01') },
          { bookingId: b1.id, status: BookingStatus.PENDING_REVIEW, title: 'Planner Reviewing', description: 'Arjun Mehta has been assigned to your booking.', createdAt: new Date('2026-10-02') },
          { bookingId: b1.id, status: BookingStatus.QUOTED, title: 'Quote Prepared', description: 'Gold Package quote of ₹9,82,500 prepared.', createdAt: new Date('2026-10-04') },
          { bookingId: b1.id, status: BookingStatus.PAYMENT_PENDING, title: 'Quote Approved', description: 'You approved the quote. 50% advance payment received.', createdAt: new Date('2026-10-06') },
          { bookingId: b1.id, status: BookingStatus.CONFIRMED, title: 'Booking Confirmed', description: 'Your wedding is confirmed! We are excited to celebrate with you.', createdAt: new Date('2026-10-07') },
        ],
      })

      await prisma.message.createMany({
        data: [
          { bookingId: b1.id, senderId: customer.id, content: 'Hi! So excited about our wedding. Can we discuss the rose gold colour scheme?', createdAt: new Date('2026-10-08') },
          { bookingId: b1.id, senderId: customer.id, content: 'Also, we need a kids\' corner for 15 children aged 4-10.', createdAt: new Date('2026-10-08') },
        ],
      })
    }
  }

  if (bdayId) {
    const bn2 = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`
    const existing = await prisma.booking.findFirst({ where: { userId: customer.id, eventId: bdayId } })
    if (!existing) {
      const b2 = await prisma.booking.create({
        data: {
          bookingNumber: bn2,
          userId: customer.id,
          eventId: bdayId,
          venueId: venues['Skyline Rooftop Lounge']?.id,
          status: BookingStatus.QUOTED,
          eventDate: new Date('2026-11-20'),
          guestCount: 60,
          budget: 130000,
          subtotal: 125000,
          taxAmount: 22500,
          discountAmount: 5000,
          totalAmount: 142500,
          paidAmount: 0,
          balanceAmount: 142500,
          paymentStatus: PaymentStatus.PENDING,
        },
      })

      await prisma.bookingTimeline.createMany({
        data: [
          { bookingId: b2.id, status: BookingStatus.REQUESTED, title: 'Booking Requested', description: 'Birthday party request received.', createdAt: new Date('2026-10-15') },
          { bookingId: b2.id, status: BookingStatus.QUOTED, title: 'Quote Prepared', description: 'Quote for ₹1,42,500 is ready for your review.', createdAt: new Date('2026-10-17') },
        ],
      })

      await prisma.quote.create({
        data: {
          bookingId: b2.id,
          version: 1,
          items: [
            { serviceId: services['Theme Decoration']?.id, name: 'Theme Decoration', quantity: 1, unitPrice: 55000, totalPrice: 55000 },
            { serviceId: services['Candid Photography']?.id, name: 'Candid Photography (6hr)', quantity: 1, unitPrice: 25000, totalPrice: 25000 },
            { serviceId: services['Multi-Cuisine Catering']?.id, name: 'Multi-Cuisine Catering (60 guests)', quantity: 60, unitPrice: 850, totalPrice: 51000 },
            { serviceId: services['DJ & Sound System']?.id, name: 'DJ & Sound System', quantity: 1, unitPrice: 18000, totalPrice: 18000 },
            { serviceId: services['Designer Cake']?.id, name: '3-Tier Custom Cake', quantity: 1, unitPrice: 8000, totalPrice: 8000 },
          ],
          subtotal: 157000,
          taxAmount: 28260,
          discountAmount: 15000,
          totalAmount: 170260,
          validUntil: new Date('2026-11-01'),
          notes: 'Includes setup and takedown. 50% advance required to confirm.',
          status: 'SENT',
          createdBy: admin.id,
        },
      })
    }
  }

  if (engagementId) {
    const bn3 = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`
    const existing = await prisma.booking.findFirst({ where: { userId: customer.id, eventId: engagementId } })
    if (!existing) {
      await prisma.booking.create({
        data: {
          bookingNumber: bn3,
          userId: customer.id,
          eventId: engagementId,
          status: BookingStatus.REQUESTED,
          eventDate: new Date('2027-02-14'),
          guestCount: 80,
          budget: 250000,
          notes: 'Valentine\'s Day engagement. Want it very romantic and floral.',
          subtotal: 0, taxAmount: 0, discountAmount: 0,
          totalAmount: 0, paidAmount: 0, balanceAmount: 0,
          paymentStatus: PaymentStatus.PENDING,
        },
      })
    }
  }

  console.log('✅ Demo bookings created')

  // ── Reviews ────────────────────────────────────────────────────────────────────
  const reviewEvents = Object.values(events).slice(0, 8)
  const reviewNames = [
    ['Priya Kapoor', 'priya.k@gmail.com'], ['Rahul Verma', 'rahul.v@gmail.com'],
    ['Anjali Singh', 'anjali.s@gmail.com'], ['Vikram Nair', 'vikram.n@gmail.com'],
    ['Meera Pillai', 'meera.p@gmail.com'], ['Aryan Sharma', 'aryan.s@gmail.com'],
    ['Kavya Reddy', 'kavya.r@gmail.com'], ['Suresh Kumar', 'suresh.k@gmail.com'],
  ]
  const reviewTexts = [
    { title: 'Absolutely magical!', comment: 'Every detail was perfect. The team went beyond our expectations. Our guests are still talking about how beautiful everything looked.' },
    { title: 'Worth every rupee', comment: 'We were initially worried about the budget but avān. delivered incredible value. The décor was stunning and the photography was cinematic.' },
    { title: 'Seamless experience', comment: 'From the first call to the last dance, the coordination was impeccable. Priya from the team was exceptional.' },
    { title: 'Our dream come true', comment: 'I had a very specific vision and they nailed it. The floral work especially was beyond anything I\'d seen.' },
    { title: 'Highly recommended!', comment: 'Professional, creative, and genuinely passionate about making your day special. Will definitely use avān. again.' },
    { title: 'Made our celebration unforgettable', comment: 'The AI design tool helped us visualise everything upfront. The execution matched the design perfectly.' },
    { title: 'Five star service', comment: 'Not a single hiccup on the day. The catering was excellent and the DJ kept everyone on the dance floor all night.' },
    { title: 'Exceeded all expectations', comment: 'When I say they thought of everything, I mean EVERYTHING. Even the kids had their own space with activities.' },
  ]

  for (let i = 0; i < reviewEvents.length; i++) {
    const evtId = reviewEvents[i]?.id
    if (!evtId) continue
    const [name, email] = reviewNames[i]
    const { title: rtitle, comment } = reviewTexts[i]

    // Create a user for the reviewer (or reuse)
    const reviewer = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, passwordHash: await hashPw('Review@123'), role: Role.CUSTOMER, isActive: true, isEmailVerified: true },
    })

    await prisma.review.upsert({
      where: { userId_eventId: { userId: reviewer.id, eventId: evtId } },
      update: {},
      create: {
        userId: reviewer.id,
        eventId: evtId,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
        title: rtitle,
        comment,
        isVerified: true,
        isVisible: true,
      },
    })
  }

  console.log('✅ Reviews created')

  console.log('\n🎉 Seed complete!\n')
  console.log('Demo accounts:')
  console.log('  Customer : demo@avan.events       / Customer@123')
  console.log('  Admin    : admin@avan.events       / Admin@12345')
  console.log('  Super    : super@avan.events       / SuperAdmin@123')
  console.log('  Manager  : manager@avan.events     / Manager@123')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
