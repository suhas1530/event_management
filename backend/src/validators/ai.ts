import { z } from 'zod';

export const aiEventDesignSchema = z.object({
  prompt: z.string().min(10, 'Please describe your event in more detail').max(5000),
  eventType: z.enum([
    'BIRTHDAY', 'BABY_SHOWER', 'WEDDING', 'ENGAGEMENT', 'ANNIVERSARY',
    'NAMING_CEREMONY', 'HOUSEWARMING', 'CORPORATE', 'CONFERENCE',
    'PRODUCT_LAUNCH', 'GRADUATION', 'FAREWELL', 'FESTIVAL',
    'PROPOSAL', 'KIDS_PARTY', 'THEME_PARTY', 'PRIVATE_CELEBRATION', 'CUSTOM'
  ]).optional(),
  theme: z.string().max(100).optional(),
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10).optional(),
  guestCount: z.number().int().min(1).max(5000).optional(),
  budget: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  eventDate: z.string().datetime().optional(),
  services: z.array(z.string()).optional(),
  preferences: z.string().max(2000).optional(),
});

export const refineDesignSchema = z.object({
  designId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  prompt: z.string().min(5, 'Please describe what you want to change').max(2000),
  changes: z.object({
    theme: z.string().optional(),
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
    guestCount: z.number().int().min(1).optional(),
    budget: z.number().min(0).optional(),
    services: z.array(z.string()).optional(),
    addServices: z.array(z.string()).optional(),
    removeServices: z.array(z.string()).optional(),
  }).optional(),
});

export const aiEstimateSchema = z.object({
  eventType: z.enum([
    'BIRTHDAY', 'BABY_SHOWER', 'WEDDING', 'ENGAGEMENT', 'ANNIVERSARY',
    'NAMING_CEREMONY', 'HOUSEWARMING', 'CORPORATE', 'CONFERENCE',
    'PRODUCT_LAUNCH', 'GRADUATION', 'FAREWELL', 'FESTIVAL',
    'PROPOSAL', 'KIDS_PARTY', 'THEME_PARTY', 'PRIVATE_CELEBRATION', 'CUSTOM'
  ]),
  theme: z.string().optional(),
  guestCount: z.number().int().min(1),
  budget: z.number().min(0).optional(),
  location: z.string().optional(),
  services: z.array(z.string()),
  venueType: z.enum(['indoor', 'outdoor', 'any']).optional(),
  luxuryLevel: z.enum(['standard', 'premium', 'luxury']).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    designId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    eventType: z.string().optional(),
    currentStep: z.string().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
});

export const saveDesignSchema = z.object({
  designId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string().min(1).max(100).optional(),
});

export type AIEventDesignInput = z.infer<typeof aiEventDesignSchema>;
export type RefineDesignInput = z.infer<typeof refineDesignSchema>;
export type AIEstimateInput = z.infer<typeof aiEstimateSchema>;
export type AIChatInput = z.infer<typeof aiChatSchema>;
export type SaveDesignInput = z.infer<typeof saveDesignSchema>;