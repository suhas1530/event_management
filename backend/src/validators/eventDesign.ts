import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex colour');

export const designStyles = [
  'elegant',
  'luxury',
  'modern',
  'traditional',
  'minimalist',
  'floral',
  'colourful',
  'playful',
  'royal',
] as const;

export const eventDesignRequirementsSchema = z.object({
  eventType: z.string().trim().min(1, 'Choose an event type').max(80),
  eventDate: z.string().datetime().optional().nullable(),
  city: z.string().trim().max(120).optional(),
  guestCount: z.number().int().min(1).max(5000).optional().nullable(),
  budget: z.number().min(1000).max(100_000_000).optional().nullable(),
  style: z.enum(designStyles).optional(),
  colors: z.array(hexColor).max(6).optional(),
  venueType: z.enum(['indoor', 'outdoor', 'banquet_hall', 'home', 'garden', 'other']).optional(),
  services: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
  eventId: objectId.optional(),
});

export const eventDesignGenerateSchema = eventDesignRequirementsSchema;

export const eventDesignRegenerateSchema = eventDesignRequirementsSchema.extend({
  variation: z.number().int().min(0).max(20).optional(),
});

export const eventDesignCustomizeSchema = z.object({
  requirements: eventDesignRequirementsSchema,
  change: z.string().trim().min(3, 'Describe the change you want').max(300),
  baseId: z.string().max(100).optional(),
  variation: z.number().int().min(0).max(20).optional(),
});

/**
 * The browser may send its current recommendation back for saving. Only the
 * creative text is accepted; service ids are re-resolved against the database,
 * prices are rebuilt from the catalog, and image URLs are ignored.
 */
export const eventDesignSaveSchema = z.object({
  requirements: eventDesignRequirementsSchema,
  recommendation: z
    .object({
      id: z.string().max(100).optional(),
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().min(1).max(800),
      style: z.string().trim().min(1).max(80),
      mood: z.string().trim().max(200).optional(),
      colors: z.array(hexColor).max(8).optional(),
      elements: z.array(z.string().trim().max(160)).max(12).optional(),
      stageConcept: z.string().trim().max(500).optional(),
      lighting: z.string().trim().max(300).optional(),
      whyItFits: z.string().trim().max(500).optional(),
      venueType: z.string().trim().max(80).optional(),
      serviceIds: z.array(objectId).max(20).optional(),
      upgrades: z.array(z.string().trim().max(160)).max(10).optional(),
    }),
});

export type EventDesignRequirementsInput = z.infer<typeof eventDesignRequirementsSchema>;
export type EventDesignRegenerateInput = z.infer<typeof eventDesignRegenerateSchema>;
export type EventDesignCustomizeInput = z.infer<typeof eventDesignCustomizeSchema>;
export type EventDesignSaveInput = z.infer<typeof eventDesignSaveSchema>;
