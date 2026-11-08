/**
 * Shared response types for the AI Event Design Assistant.
 *
 * Prices in these objects are copied from the service catalog at request time.
 * They are indicative for the listed services and are never a confirmed quote.
 */

export type DesignStyle =
  | 'elegant'
  | 'luxury'
  | 'modern'
  | 'traditional'
  | 'minimalist'
  | 'floral'
  | 'colourful'
  | 'playful'
  | 'royal';

export interface EventDesignRequirements {
  eventType: string;
  eventDate?: string | null;
  city?: string;
  guestCount?: number | null;
  budget?: number | null;
  style?: DesignStyle;
  colors?: string[];
  venueType?: 'indoor' | 'outdoor' | 'banquet_hall' | 'home' | 'garden' | 'other';
  services?: string[];
  notes?: string;
  eventId?: string;
}

export interface DesignService {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  priceNote: string;
  pricingType: string;
  image: string | null;
}

export interface DesignImage {
  url: string;
  alt: string;
  kind: 'reference_inspiration' | 'catalog_photo';
  source: string;
  credit?: string;
}

export interface DesignBudget {
  type: 'catalog_estimate' | 'quote_required';
  currency: 'INR';
  min: number | null;
  max: number | null;
  catalogSubtotal: number | null;
  withinStatedBudget: boolean | null;
  note: string;
}

export interface EventDesignRecommendation {
  id: string;
  name: string;
  description: string;
  style: string;
  mood: string;
  colors: string[];
  elements: string[];
  stageConcept: string;
  lighting: string;
  whyItFits: string;
  venueType: string;
  budget: DesignBudget;
  images: DesignImage[];
  imageStatus: 'available' | 'unavailable';
  services: DesignService[];
  serviceIds: string[];
  upgrades: string[];
  source: 'ai' | 'fallback';
}

export interface EventDesignResponse {
  recommendations: EventDesignRecommendation[];
  requirements: EventDesignRequirements;
  source: 'ai' | 'fallback';
  notice: string | null;
  imageDisclaimer: string;
  generatedAt: string;
}

export interface SavedDesignSummary {
  id: string;
  name: string;
  style: string;
  colors: string[];
  image: string | null;
  services: DesignService[];
  budget: DesignBudget | null;
  eventType: string;
  eventDate: string | null;
  city: string | null;
  createdAt: string;
}
