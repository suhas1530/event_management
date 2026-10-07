import { EventType, Prisma } from '@prisma/client';
import { config } from '../config';
import prisma from '../utils/database';
import { AppError, NotFoundError, AuthorizationError } from '../middleware/errorHandler';
import type { AIEventDesignInput, RefineDesignInput, AIEstimateInput, AIChatInput } from '../validators/ai';

// ─── Response schema for structured AI output ──────────────────
interface AIDesignResponse {
  eventType: string;
  theme: string;
  mood: string;
  colors: string[];
  guestCount: number;
  budget: number;
  location: string;
  date: string | null;
  services: string[];
  decor: string[];
  food: string[];
  entertainment: string[];
  photography: { style: string; hours: number; deliverables: string[] };
  cake: string[];
  invitationStyle: string[];
  returnGifts: string[];
  estimatedCost: number;
  budgetBreakdown: Record<string, number>;
  designPrompt: string;
  recommendations: string[];
  visualReferences: Array<{ category: string; description: string; imageKeywords: string[] }>;
  venueRecommendation: { type: string; capacity: number; style: string; features: string[] };
  colorPalette: Array<{ name: string; hex: string; usage: string }>;
  timelineRecommendation: Array<{ time: string; activity: string }>;
}

// ─── Fallback design generator (no API key required) ──────────
function generateFallbackDesign(input: AIEventDesignInput): AIDesignResponse {
  const eventType = input.eventType ?? 'BIRTHDAY';
  const guestCount = input.guestCount ?? 50;
  const budget = input.budget ?? 100000;
  const location = input.location ?? 'India';
  const promptLower = (input.prompt ?? '').toLowerCase();

  // Parse colors from prompt
  const colorMap: Record<string, string[]> = {
    pink: ['#F9A8D4', '#EC4899', '#FDF2F8'],
    purple: ['#C084FC', '#9333EA', '#F5F3FF'],
    gold: ['#F59E0B', '#D97706', '#FFFBEB'],
    black: ['#0F0F0F', '#1F1F1F', '#2D2D2D'],
    white: ['#FFFFFF', '#F9FAFB', '#F3F4F6'],
    blue: ['#60A5FA', '#3B82F6', '#EFF6FF'],
    red: ['#F87171', '#EF4444', '#FEF2F2'],
    green: ['#4ADE80', '#22C55E', '#F0FDF4'],
    peach: ['#FDA29B', '#F98080', '#FFF5F5'],
    pastel: ['#FBCFE8', '#E9D5FF', '#BAE6FD'],
  };

  let colors: string[] = input.colors?.length ? input.colors : [];
  if (!colors.length) {
    for (const [colorName, hex] of Object.entries(colorMap)) {
      if (promptLower.includes(colorName)) {
        colors = hex;
        break;
      }
    }
    if (!colors.length) colors = ['#D4A574', '#F4E9D8', '#8B6914'];
  }

  const isWedding = eventType === 'WEDDING' || promptLower.includes('wedding');
  const isBirthday = eventType === 'BIRTHDAY' || promptLower.includes('birthday');
  const isCorporate = eventType === 'CORPORATE' || promptLower.includes('corporate');
  const isKids = eventType === 'KIDS_PARTY' || promptLower.includes('kids') || promptLower.includes('child');
  const isLuxury = promptLower.includes('luxury') || promptLower.includes('premium') || budget > 200000;

  // Build budget breakdown
  const decorPercent = isWedding ? 0.30 : 0.25;
  const venuePercent = 0.25;
  const foodPercent = isCorporate ? 0.35 : 0.20;
  const photoPercent = 0.15;
  const cakePercent = isBirthday ? 0.05 : 0.02;
  const entertainmentPercent = isWedding ? 0.15 : 0.10;
  const miscPercent = 0.03;

  const budgetBreakdown: Record<string, number> = {
    'Decoration & Flowers': Math.round(budget * decorPercent),
    'Venue': Math.round(budget * venuePercent),
    'Food & Beverages': Math.round(budget * foodPercent),
    'Photography & Videography': Math.round(budget * photoPercent),
    'Cake': Math.round(budget * cakePercent),
    'Entertainment': Math.round(budget * entertainmentPercent),
    'Miscellaneous': Math.round(budget * miscPercent),
  };

  const estimatedCost = Object.values(budgetBreakdown).reduce((a, b) => a + b, 0);

  // Build services list
  const services: string[] = ['Decoration', 'Photography'];
  if (!isCorporate) services.push('Cake');
  if (guestCount > 30) services.push('Catering');
  if (isWedding) services.push('Mehendi', 'Makeup', 'Flowers', 'Stage Decoration');
  if (!isKids && budget > 80000) services.push('DJ', 'Lighting');
  if (promptLower.includes('photography') || promptLower.includes('videography')) services.push('Videography');

  const themes: Record<string, string[]> = {
    WEDDING: ['Royal Garden', 'Rustic Romance', 'Modern Luxe', 'Floral Fantasy'],
    BIRTHDAY: ['Glamour Noir', 'Garden Party', 'Tropical Fiesta', 'Vintage Charm'],
    CORPORATE: ['Modern Minimal', 'Executive Elegance', 'Tech Forward', 'Classic Professional'],
    KIDS_PARTY: ['Fairy Tale', 'Superhero', 'Under the Sea', 'Jungle Adventure'],
    ANNIVERSARY: ['Golden Romance', 'Silver Glow', 'Timeless Elegance'],
  };

  const themeList = themes[eventType] ?? ['Elegant Classic', 'Modern Luxe', 'Garden Gala'];
  const theme = input.theme ?? themeList[Math.floor(Math.random() * themeList.length)];

  const moods: Record<string, string> = {
    WEDDING: 'Romantic, Timeless, and Grand',
    BIRTHDAY: isLuxury ? 'Opulent and Celebratory' : 'Joyful and Vibrant',
    CORPORATE: 'Professional, Inspiring, and Polished',
    KIDS_PARTY: 'Playful, Magical, and Exciting',
    ANNIVERSARY: 'Intimate, Romantic, and Nostalgic',
  };

  return {
    eventType,
    theme,
    mood: moods[eventType] ?? 'Celebratory and Memorable',
    colors,
    guestCount,
    budget,
    location,
    date: input.eventDate ?? null,
    services,
    decor: [
      `${theme} backdrop with custom signage`,
      `${colors[0]} floral centerpieces`,
      isLuxury ? 'Premium draping with fairy lights' : 'Balloon arches and pillars',
      'Welcome signage and photo wall',
      guestCount > 100 ? 'Specialty lighting rigs' : 'String lights and lanterns',
    ],
    food: isCorporate
      ? ['Continental finger foods', 'Tea/coffee station', 'Mini desserts']
      : guestCount > 50
      ? ['Welcome drinks station', 'Multi-cuisine live stations', 'Dessert counter', 'Wedding cake cutting ceremony']
      : ['Welcome mocktails', 'Curated 3-course meal', 'Dessert table'],
    entertainment: isKids
      ? ['Magician', 'Clown', 'Bouncy castle', 'Face painting']
      : isWedding
      ? ['Live band', 'DJ', 'Sangeet performances', 'Fireworks finale']
      : isCorporate
      ? ['Keynote stage', 'AV setup', 'Background music']
      : ['DJ', 'Dance floor', 'Interactive games', 'Photo booth'],
    photography: {
      style: isLuxury ? 'Cinematic fine-art with drone shots' : 'Candid + traditional',
      hours: isWedding ? 12 : guestCount > 100 ? 8 : 5,
      deliverables: [
        `${isWedding ? 500 : 200}+ edited photos`,
        isWedding ? '5-minute highlight film' : '2-minute reel',
        'Same-day preview gallery',
        'Online photo album',
      ],
    },
    cake: isBirthday
      ? [
          `${Math.ceil(guestCount / 20)}-tier custom cake`,
          `${theme} themed design`,
          'Edible floral accents',
          'Personalised cake topper',
        ]
      : ['Celebration dessert table', 'Cupcake tower'],
    invitationStyle: [
      isLuxury ? 'Luxury box invite with wax seal' : 'Digital e-invite',
      'WhatsApp event card',
      'Personalised message',
    ],
    returnGifts: isKids
      ? ['Goody bags', 'Activity books', 'Personalised name tags']
      : isWedding
      ? ['Personalised photo frames', 'Luxury candles', 'Traditional mithai boxes']
      : ['Premium chocolates', 'Thank-you cards', 'Personalised keepsakes'],
    estimatedCost,
    budgetBreakdown,
    designPrompt: input.prompt,
    recommendations: [
      `Book at least ${isWedding ? '3-6 months' : guestCount > 100 ? '2-3 months' : '4-6 weeks'} in advance`,
      'Confirm guest dietary preferences for catering',
      isLuxury ? 'Consider premium vendors for a seamless experience' : 'Request vendor portfolios before finalising',
      `${location} is well-suited for ${isLuxury ? 'luxury outdoor' : 'banquet hall'} setups`,
      guestCount > 100 ? 'Assign a dedicated coordinator on the day' : 'Create a detailed day-of timeline',
    ],
    visualReferences: [
      {
        category: 'Decor',
        description: `${theme} floral and lighting setup`,
        imageKeywords: [theme.toLowerCase(), 'event decor', colors[0]],
      },
      {
        category: 'Stage',
        description: `Backdrop with personalised ${eventType.toLowerCase()} signage`,
        imageKeywords: ['stage backdrop', eventType.toLowerCase()],
      },
      {
        category: 'Tablescape',
        description: 'Elegant table settings with floral centerpieces',
        imageKeywords: ['table decor', 'centerpieces', colors[0]],
      },
    ],
    venueRecommendation: {
      type: promptLower.includes('outdoor') ? 'Outdoor Garden' : 'Banquet Hall',
      capacity: Math.ceil(guestCount * 1.2),
      style: isLuxury ? 'Grand pillarless hall with high ceilings' : 'Well-lit multipurpose hall',
      features: [
        'Air-conditioned',
        'In-house parking',
        'Bridal suite',
        `${guestCount > 200 ? 'Multiple' : 'Dedicated'} washrooms`,
        'Power backup',
      ],
    },
    colorPalette: colors.map((hex, i) => ({
      hex,
      name: ['Primary', 'Secondary', 'Accent'][i] ?? `Color ${i + 1}`,
      usage: ['Main decor and backdrop', 'Floral arrangements', 'Accent pieces'][i] ?? 'Accent',
    })),
    timelineRecommendation: isWedding
      ? [
          { time: '10:00 AM', activity: 'Vendor setup begins' },
          { time: '02:00 PM', activity: 'Bridal preparations' },
          { time: '05:00 PM', activity: 'Guests arrive — cocktail hour' },
          { time: '06:30 PM', activity: 'Ceremony' },
          { time: '07:30 PM', activity: 'Dinner & entertainment' },
          { time: '10:00 PM', activity: 'Cake cutting & first dance' },
          { time: '11:30 PM', activity: 'Event closes' },
        ]
      : [
          { time: '02:00 PM', activity: 'Venue & decor setup' },
          { time: '05:00 PM', activity: 'Guests arrive' },
          { time: '06:00 PM', activity: 'Welcome & introductions' },
          { time: '07:00 PM', activity: 'Dinner & entertainment' },
          { time: '08:30 PM', activity: 'Cake cutting ceremony' },
          { time: '09:30 PM', activity: 'Event closes' },
        ],
  };
}

// ─── Real AI call (used when API key is configured) ────────────
async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  if (!config.ai.apiKey) {
    throw new Error('AI_API_KEY not configured');
  }

  const response = await fetch(`${config.ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '{}';
}

export class AIService {
  async generateEventDesign(userId: string, input: AIEventDesignInput) {
    let aiResponse: AIDesignResponse;

    if (config.ai.apiKey) {
      const systemPrompt = `You are an expert luxury event designer. Given a user's description, generate a detailed, structured event design plan. Always respond with valid JSON matching this exact schema:
{
  "eventType": "string (one of: BIRTHDAY|BABY_SHOWER|WEDDING|ENGAGEMENT|ANNIVERSARY|NAMING_CEREMONY|HOUSEWARMING|CORPORATE|CONFERENCE|PRODUCT_LAUNCH|GRADUATION|FAREWELL|FESTIVAL|PROPOSAL|KIDS_PARTY|THEME_PARTY|PRIVATE_CELEBRATION|CUSTOM)",
  "theme": "string",
  "mood": "string",
  "colors": ["hex color strings"],
  "guestCount": number,
  "budget": number (in INR),
  "location": "string",
  "date": "ISO date string or null",
  "services": ["list of services"],
  "decor": ["decor elements"],
  "food": ["food items/stations"],
  "entertainment": ["entertainment options"],
  "photography": { "style": "string", "hours": number, "deliverables": ["array"] },
  "cake": ["cake details"],
  "invitationStyle": ["invitation options"],
  "returnGifts": ["gift ideas"],
  "estimatedCost": number,
  "budgetBreakdown": { "Category": amount },
  "designPrompt": "string (repeat user prompt)",
  "recommendations": ["actionable recommendations"],
  "visualReferences": [{ "category": "string", "description": "string", "imageKeywords": ["strings"] }],
  "venueRecommendation": { "type": "string", "capacity": number, "style": "string", "features": ["strings"] },
  "colorPalette": [{ "name": "string", "hex": "string", "usage": "string" }],
  "timelineRecommendation": [{ "time": "string", "activity": "string" }]
}`;

      try {
        const raw = await callAI(systemPrompt, input.prompt);
        aiResponse = JSON.parse(raw) as AIDesignResponse;
      } catch (err) {
        console.error('[AI] API call failed, using fallback:', err);
        aiResponse = generateFallbackDesign(input);
      }
    } else {
      aiResponse = generateFallbackDesign(input);
    }

    // Save design to database
    const design = await prisma.aIDesign.create({
      data: {
        userId,
        eventType: (aiResponse.eventType as EventType) ?? EventType.CUSTOM,
        theme: aiResponse.theme,
        mood: aiResponse.mood,
        colors: aiResponse.colors,
        guestCount: aiResponse.guestCount,
        budget: aiResponse.budget,
        location: aiResponse.location,
        eventDate: aiResponse.date ? new Date(aiResponse.date) : null,
        services: aiResponse.services,
        decor: aiResponse.decor,
        food: aiResponse.food,
        entertainment: aiResponse.entertainment,
        photography: aiResponse.photography,
        estimatedCost: aiResponse.estimatedCost,
        designPrompt: input.prompt,
        aiResponse: aiResponse as unknown as Prisma.InputJsonValue,
        isSaved: false,
      },
    });

    return { design, aiResponse };
  }

  async refineDesign(userId: string, input: RefineDesignInput) {
    const existing = await prisma.aIDesign.findUnique({ where: { id: input.designId } });
    if (!existing) throw new NotFoundError('Design not found');
    if (existing.userId !== userId) throw new AuthorizationError('Access denied');

    // Apply requested changes on top of existing design
    const currentResponse = existing.aiResponse as unknown as AIDesignResponse;
    const refinementInput: AIEventDesignInput = {
      prompt: input.prompt,
      eventType: input.changes?.theme ? existing.eventType : (existing.eventType as AIEventDesignInput['eventType']),
      theme: input.changes?.theme ?? existing.theme,
      colors: input.changes?.colors ?? existing.colors,
      guestCount: input.changes?.guestCount ?? existing.guestCount,
      budget: input.changes?.budget ?? existing.budget,
      location: existing.location ?? undefined,
      eventDate: existing.eventDate?.toISOString(),
      services: input.changes?.services ??
        (input.changes?.addServices
          ? [...(Array.isArray(currentResponse.services) ? currentResponse.services : []), ...input.changes.addServices]
          : undefined),
    };

    // Remove services if requested
    if (input.changes?.removeServices && refinementInput.services) {
      refinementInput.services = refinementInput.services.filter(
        (s) => !input.changes!.removeServices!.includes(s)
      );
    }

    const { design, aiResponse } = await this.generateEventDesign(userId, refinementInput);

    // Delete the temp new design and update the original
    await prisma.aIDesign.delete({ where: { id: design.id } });

    const updated = await prisma.aIDesign.update({
      where: { id: existing.id },
      data: {
        theme: aiResponse.theme,
        mood: aiResponse.mood,
        colors: aiResponse.colors,
        guestCount: aiResponse.guestCount,
        budget: aiResponse.budget,
        services: aiResponse.services,
        decor: aiResponse.decor,
        food: aiResponse.food,
        entertainment: aiResponse.entertainment,
        photography: aiResponse.photography,
        estimatedCost: aiResponse.estimatedCost,
        aiResponse: aiResponse as unknown as Prisma.InputJsonValue,
      },
    });

    return { design: updated, aiResponse };
  }

  async saveDesign(designId: string, userId: string) {
    const design = await prisma.aIDesign.findUnique({ where: { id: designId } });
    if (!design) throw new NotFoundError('Design not found');
    if (design.userId !== userId) throw new AuthorizationError('Access denied');

    return prisma.aIDesign.update({
      where: { id: designId },
      data: { isSaved: true },
    });
  }

  async getUserDesigns(userId: string) {
    return prisma.aIDesign.findMany({
      where: { userId, isSaved: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDesignById(designId: string, userId: string) {
    const design = await prisma.aIDesign.findUnique({ where: { id: designId } });
    if (!design) throw new NotFoundError('Design not found');
    if (design.userId !== userId) throw new AuthorizationError('Access denied');
    return design;
  }

  async estimateCost(input: AIEstimateInput) {
    const fallbackInput: AIEventDesignInput = {
      prompt: `${input.eventType} for ${input.guestCount} guests with budget ${input.budget}`,
      eventType: input.eventType,
      guestCount: input.guestCount,
      budget: input.budget,
      location: input.location,
      services: input.services,
    };

    const design = generateFallbackDesign(fallbackInput);
    return {
      estimatedCost: design.estimatedCost,
      budgetBreakdown: design.budgetBreakdown,
      recommendations: design.recommendations,
    };
  }

  async chat(input: AIChatInput) {
    // Simple context-aware chat without full API
    const message = input.message.toLowerCase();

    const responses: Array<[RegExp, string]> = [
      [/budget|cost|price|how much/i, 'Event costs vary based on guest count, venue, and services. A typical event for 50 guests starts around ₹75,000-₹1,50,000. Would you like a detailed estimate? Just describe your event.'],
      [/wedding/i, 'Weddings are our specialty! We handle everything from intimate ceremonies of 50 to grand celebrations of 1000+ guests. What kind of wedding are you envisioning?'],
      [/birthday/i, 'We love birthdays! Whether it\'s a milestone 30th or a child\'s first — we create unforgettable celebrations. Tell me more about the birthday person!'],
      [/outdoor|garden/i, 'Outdoor events have a magical quality. We have beautiful garden venues and can handle all weather contingencies. What\'s your ideal outdoor setting?'],
      [/food|catering|menu/i, 'Our catering partners offer everything from intimate plated dinners to elaborate live stations. Do you have any dietary preferences or cuisine preferences?'],
      [/photo|camera|videograph/i, 'Photography is the most precious part of any celebration — those images last forever. We work with award-winning photographers and videographers. What style appeals to you?'],
      [/luxury|premium|grand/i, 'Our luxury collections start from ₹3 Lakhs and include premium venues, bespoke decor, Michelin-inspired catering, and dedicated coordinators. Shall I show you our Royal Collection?'],
    ];

    let reply = "I'd love to help you plan something beautiful! Could you tell me more about the type of event, approximate guest count, and your budget? That'll help me give you the best suggestions.";

    for (const [pattern, response] of responses) {
      if (pattern.test(message)) {
        reply = response;
        break;
      }
    }

    return { reply, suggestions: ['Tell me your budget', 'What\'s the event type?', 'How many guests?'] };
  }
}

export const aiService = new AIService();
