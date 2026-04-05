import "dotenv/config";

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCsv(value) {
  return normalizeString(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isConfigured(value) {
  const normalized = normalizeString(value);
  if (!normalized) return false;

  // Treat common placeholder words as "not configured yet" so readiness stays honest.
  return !/(your_|example|placeholder|changeme|localhost:5432\/ziele)/i.test(
    normalized,
  );
}

export const env = {
  nodeEnv: normalizeString(process.env.NODE_ENV, "development"),
  port: parseNumber(process.env.PORT, 3001),
  corsOrigins: parseCsv(process.env.CORS_ORIGIN),
  clerk: {
    secretKey: normalizeString(process.env.CLERK_SECRET_KEY),
    publishableKey: normalizeString(process.env.VITE_CLERK_PUBLISHABLE_KEY),
    webhookSecret: normalizeString(process.env.CLERK_WEBHOOK_SIGNING_SECRET),
  },
  database: {
    url: normalizeString(process.env.DATABASE_URL),
  },
  redis: {
    url: normalizeString(process.env.REDIS_URL),
    rateLimitPrefix: normalizeString(
      process.env.REDIS_RATE_LIMIT_PREFIX,
      "ziele:ratelimit",
    ),
  },
  cloudinary: {
    cloudName: normalizeString(process.env.CLOUDINARY_CLOUD_NAME),
    apiKey: normalizeString(process.env.CLOUDINARY_API_KEY),
    apiSecret: normalizeString(process.env.CLOUDINARY_API_SECRET),
  },
  resend: {
    apiKey: normalizeString(process.env.RESEND_API_KEY),
    fromEmail: normalizeString(process.env.RESEND_FROM_EMAIL),
  },
  gemini: {
    apiKey: normalizeString(process.env.GEMINI_API_KEY),
  },
  libreTranslate: {
    apiUrl: normalizeString(
      process.env.LIBRETRANSLATE_API_URL,
      "https://libretranslate.com",
    ),
    apiKey: normalizeString(process.env.LIBRETRANSLATE_API_KEY),
  },
  cron: {
    sharedSecret: normalizeString(process.env.CRON_SHARED_SECRET),
  },
};

export function getServiceReadinessSnapshot() {
  return {
    clerk: {
      configured:
        isConfigured(env.clerk.secretKey) &&
        isConfigured(env.clerk.webhookSecret),
      message:
        "Requires a Clerk secret key and webhook signing secret for protected routes and sync.",
    },
    database: {
      configured: isConfigured(env.database.url),
      message: "Requires a PostgreSQL DATABASE_URL for Prisma.",
    },
    redis: {
      configured: isConfigured(env.redis.url),
      message: "Requires a REDIS_URL for cache, pub/sub, and rate limiting.",
    },
    cloudinary: {
      configured:
        isConfigured(env.cloudinary.cloudName) &&
        isConfigured(env.cloudinary.apiKey) &&
        isConfigured(env.cloudinary.apiSecret),
      message: "Requires Cloudinary cloud name, API key, and API secret.",
    },
    resend: {
      configured:
        isConfigured(env.resend.apiKey) && isConfigured(env.resend.fromEmail),
      message: "Requires a Resend API key and a sender email.",
    },
    gemini: {
      configured: isConfigured(env.gemini.apiKey),
      message: "Requires a Gemini API key.",
    },
    libreTranslate: {
      configured: Boolean(env.libreTranslate.apiUrl),
      message:
        "Requires a LibreTranslate base URL. API key is optional unless your host enforces one.",
    },
    cron: {
      configured: isConfigured(env.cron.sharedSecret),
      message:
        "Optional shared secret for cron or serverless reminder trigger routes.",
    },
  };
}
