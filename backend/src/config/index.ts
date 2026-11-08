import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: '/api/v1',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    /**
     * Requests allowed per window and IP. Kept at 100 in production; the value
     * is env-overridable so automated suites (which load dozens of pages from
     * one IP) can raise it instead of failing on 429s.
     */
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    uploadPath: './uploads',
  },

  // Email (configure for production)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@avan.events',
  },

  // WhatsApp (ready architecture)
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || '',
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  },

  // SMS (ready architecture)
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },

  // AI Service (abstraction)
  //
  // Text and image generation are separate capabilities on purpose: a provider
  // may support one but not the other. Text is optional; the design assistant
  // has a catalog-based fallback when it is not configured. Image generation is
  // never required — catalog reference images are used first.
  ai: {
    enabled: (process.env.AI_FEATURE_ENABLED || 'true').toLowerCase() !== 'false',
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '20000', 10),
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '2500', 10),
    imageProvider: (process.env.AI_IMAGE_PROVIDER || 'catalog').toLowerCase(),
    imageApiKey: process.env.AI_IMAGE_API_KEY || '',
    imageModel: process.env.AI_IMAGE_MODEL || '',
  },

  // Payment (provider-isolated; only server-side credentials live here)
  payment: {
    provider: (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase(),
    mode: (process.env.PAYMENT_MODE || 'test').toLowerCase(),
    currency: (process.env.PAYMENT_CURRENCY || 'INR').toUpperCase(),
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },

  // Public backend origin used when documenting webhook URLs
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT || '5000', 10)}`,

  // Frontend URL (for email links, etc.)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Support / contact channels (single source of truth for the contact page)
  supportEmail: process.env.SUPPORT_EMAIL || 'hello@avan.events',
  supportPhone: process.env.SUPPORT_PHONE || '+91 80501 71547',
  supportHours: process.env.SUPPORT_HOURS || 'Mon – Sat · 9:00 AM – 8:00 PM IST',
};

export interface PaymentConfigStatus {
  provider: string;
  mode: string;
  configured: boolean;
  webhookConfigured: boolean;
}

/**
 * Validates payment configuration at startup without ever printing a secret.
 *
 * Development is allowed to run without gateway credentials so the rest of the
 * app remains usable; payment endpoints then return 503. Production fails fast
 * because silently accepting bookings without a working payment gateway is
 * worse than refusing to boot.
 */
export function validatePaymentConfig(): PaymentConfigStatus {
  const { provider, mode, razorpay } = config.payment;
  const configured = Boolean(razorpay.keyId && razorpay.keySecret);
  const webhookConfigured = Boolean(razorpay.webhookSecret);
  const problems: string[] = [];

  if (!['razorpay', 'disabled'].includes(provider)) {
    problems.push(`Unsupported PAYMENT_PROVIDER "${provider}". Use "razorpay" or "disabled".`);
  }
  if (!['test', 'live'].includes(mode)) {
    problems.push(`PAYMENT_MODE must be "test" or "live", received "${mode}".`);
  }

  if (provider === 'razorpay') {
    if (!configured) {
      problems.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required when PAYMENT_PROVIDER=razorpay.');
    } else if (mode === 'live' && !razorpay.keyId.startsWith('rzp_live_')) {
      problems.push('PAYMENT_MODE=live requires a live Razorpay key (rzp_live_...).');
    } else if (mode === 'test' && !razorpay.keyId.startsWith('rzp_test_')) {
      problems.push('PAYMENT_MODE=test requires a test Razorpay key (rzp_test_...).');
    }
    if (!webhookConfigured) {
      problems.push('RAZORPAY_WEBHOOK_SECRET is required to verify Razorpay webhooks.');
    }
  }

  if (problems.length > 0) {
    const message = `Payment configuration error:\n- ${problems.join('\n- ')}`;
    if (config.env === 'production') throw new Error(message);
    console.warn(`⚠️  ${message}\n   Payment endpoints will return 503 until this is fixed.`);
  } else if (provider === 'razorpay') {
    console.log(`✅ Razorpay configured in ${mode} mode (webhooks verified)`);
  } else {
    console.log('ℹ️  Online payments are disabled (PAYMENT_PROVIDER=disabled)');
  }

  return { provider, mode, configured, webhookConfigured };
}