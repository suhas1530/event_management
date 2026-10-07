import { z } from 'zod';

export const createEventCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateEventCategorySchema = createEventCategorySchema.partial();

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10).max(5000),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  type: z.enum([
    'BIRTHDAY', 'BABY_SHOWER', 'WEDDING', 'ENGAGEMENT', 'ANNIVERSARY',
    'NAMING_CEREMONY', 'HOUSEWARMING', 'CORPORATE', 'CONFERENCE',
    'PRODUCT_LAUNCH', 'GRADUATION', 'FAREWELL', 'FESTIVAL',
    'PROPOSAL', 'KIDS_PARTY', 'THEME_PARTY', 'PRIVATE_CELEBRATION', 'CUSTOM'
  ]),
  theme: z.string().max(100).optional(),
  colorPalette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10).default([]),
  heroImages: z.array(z.string().url()).max(10).default([]),
  galleryImages: z.array(z.string().url()).max(20).default([]),
  videoUrl: z.string().url().optional(),
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  minGuests: z.number().int().min(1).default(1),
  maxGuests: z.number().int().min(1).max(5000).default(500),
  startingPrice: z.number().min(0),
  currency: z.string().length(3).default('INR'),
  location: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default('IN'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isIndoor: z.boolean().default(false),
  isOutdoor: z.boolean().default(false),
  isLuxury: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial();

export const createVenueSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(5000).optional(),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default('IN'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: z.number().int().min(1),
  minCapacity: z.number().int().min(1).default(1),
  pricePerHour: z.number().min(0).optional(),
  pricePerDay: z.number().min(0).optional(),
  images: z.array(z.string().url()).max(20).default([]),
  amenities: z.array(z.string()).max(50).default([]),
  isActive: z.boolean().default(true),
});

export const updateVenueSchema = createVenueSchema.partial();

export const createServiceSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10).max(5000),
  category: z.enum([
    'DECORATION', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'CATERING', 'CAKE',
    'VENUE', 'DJ', 'MUSIC', 'ENTERTAINMENT', 'INVITATIONS',
    'RETURN_GIFTS', 'MAKEUP', 'MEHENDI', 'FLOWERS', 'LIGHTING',
    'STAGE_DECORATION', 'TRANSPORTATION'
  ]),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  images: z.array(z.string().url()).max(10).default([]),
  basePrice: z.number().min(0),
  pricingType: z.enum(['FIXED', 'PER_GUEST', 'PER_HOUR', 'CUSTOM_QUOTE']).default('FIXED'),
  pricePerGuest: z.number().min(0).optional(),
  pricePerHour: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  tags: z.array(z.string()).max(20).default([]),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createPackageSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10).max(5000),
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID'),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  guestLimit: z.number().int().min(1),
  images: z.array(z.string().url()).max(10).default([]),
  highlights: z.array(z.string()).max(20).default([]),
  includes: z.array(z.string()).max(30).default([]),
  excludes: z.array(z.string()).max(30).default([]),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const addPackageServiceSchema = z.object({
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  quantity: z.number().int().min(1).default(1),
  customPrice: z.number().min(0).optional(),
  isIncluded: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minGuests: z.coerce.number().int().min(1).optional(),
  maxGuests: z.coerce.number().int().min(1).optional(),
  isIndoor: z.coerce.boolean().optional(),
  isOutdoor: z.coerce.boolean().optional(),
  isLuxury: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'startingPrice', 'averageRating', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateEventCategoryInput = z.infer<typeof createEventCategorySchema>;
export type UpdateEventCategoryInput = z.infer<typeof updateEventCategorySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type AddPackageServiceInput = z.infer<typeof addPackageServiceSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;