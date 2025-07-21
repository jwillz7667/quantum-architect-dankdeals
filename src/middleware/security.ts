import { env } from '@/lib/env';

/**
 * Security headers configuration following OWASP recommendations
 * For use in server-side rendering or API routes
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS filter in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict device features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // Content Security Policy - Production ready
  'Content-Security-Policy': getContentSecurityPolicy(),

  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent DNS prefetching for privacy
  'X-DNS-Prefetch-Control': 'off',

  // Disable browser features we don't need
  'X-Permitted-Cross-Domain-Policies': 'none',

  // Remove powered by header
  'X-Powered-By': '',
};

/**
 * Generate Content Security Policy based on environment
 */
function getContentSecurityPolicy(): string {
  const isDev = env.VITE_ENV === 'development';

  const policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in dev
      isDev ? "'unsafe-eval'" : '', // Only in dev for HMR
      'https://plausible.io',
      'https://vercel.live',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind
    ],
    'img-src': ["'self'", 'data:', 'blob:', 'https://*.supabase.co', 'https://dankdealsmn.com'],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://plausible.io',
      'https://vitals.vercel-insights.com',
      isDev ? 'ws://localhost:*' : '', // WebSocket for HMR in dev
    ].filter(Boolean),
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
  };

  return Object.entries(policies)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * CORS configuration
 */
export const CORS_CONFIG = {
  origin:
    env.VITE_ENV === 'production'
      ? ['https://dankdealsmn.com', 'https://www.dankdealsmn.com']
      : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: Response): Response {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  return response;
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) {
    // Allow requests without origin (e.g., direct navigation)
    return true;
  }

  const allowedOrigins =
    env.VITE_ENV === 'production'
      ? ['https://dankdealsmn.com', 'https://www.dankdealsmn.com']
      : ['http://localhost:5173', 'http://localhost:8080'];

  const requestOrigin = origin || (referer ? new URL(referer).origin : '');
  return allowedOrigins.includes(requestOrigin);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Generate nonce for inline scripts if needed
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Check if request is from a bot/crawler
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /facebookexternalhit/i,
    /whatsapp/i,
    /telegram/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Enhanced security middleware for API routes
 */
export function securityMiddleware(request: Request): Response | null {
  // Check origin for CSRF protection
  if (!validateOrigin(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Check for suspicious user agents
  const userAgent = request.headers.get('user-agent') || '';
  if (isBot(userAgent) && !request.url.includes('/api/public')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Additional security checks can be added here

  return null; // Continue with request
}
