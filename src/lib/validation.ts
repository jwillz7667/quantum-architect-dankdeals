import { z } from 'zod';
import { sanitizeInput } from '@/middleware/security';

// Enhanced validation schemas with security in mind
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email is too long')
  .transform((val) => val.toLowerCase().trim());

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length >= 10, 'Phone number must be at least 10 digits');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
  .transform((val) => sanitizeInput(val.trim()));

export const addressSchema = z.object({
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(100, 'Street address is too long')
    .transform((val) => sanitizeInput(val)),
  apartment: z
    .string()
    .max(20, 'Apartment/Suite is too long')
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : val)),
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City name is too long')
    .regex(/^[a-zA-Z\s-]+$/, 'City contains invalid characters')
    .transform((val) => sanitizeInput(val)),
  state: z.literal('MN', {
    errorMap: () => ({ message: 'Delivery is only available in Minnesota' }),
  }),
  zipCode: z
    .string()
    .regex(/^\d{5}$/, 'ZIP code must be 5 digits')
    .refine((val) => {
      // Minnesota ZIP codes range from 55001 to 56763
      const zip = parseInt(val, 10);
      return zip >= 55001 && zip <= 56763;
    }, 'Invalid Minnesota ZIP code'),
});

export const dobSchema = z
  .string()
  .or(z.date())
  .transform((val) => (typeof val === 'string' ? new Date(val) : val))
  .refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    const monthDiff = new Date().getMonth() - date.getMonth();
    const dayDiff = new Date().getDate() - date.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return age - 1 >= 21;
    }
    return age >= 21;
  }, 'You must be 21 or older to place an order');

export const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Quantity cannot exceed 99'),
});

export const searchQuerySchema = z
  .string()
  .max(100, 'Search query is too long')
  .transform((val) => sanitizeInput(val.trim()))
  .refine((val) => {
    // Block potential SQL injection patterns
    const sqlPatterns =
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)|(-{2})|(\/\*)|(\*\/)/i;
    return !sqlPatterns.test(val);
  }, 'Invalid search query');

export const deliveryInstructionsSchema = z
  .string()
  .max(500, 'Delivery instructions are too long')
  .optional()
  .transform((val) => (val ? sanitizeInput(val) : val));

// Order validation schema
export const createOrderSchema = z.object({
  // Personal information
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: dobSchema,

  // Delivery information
  deliveryAddress: addressSchema,
  deliveryInstructions: deliveryInstructionsSchema,

  // Order items
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),

  // Pricing (validated server-side)
  subtotal: z.number().positive('Invalid subtotal'),
  taxAmount: z.number().nonnegative('Invalid tax amount'),
  deliveryFee: z.number().nonnegative('Invalid delivery fee'),
  totalAmount: z.number().positive('Invalid total amount'),

  // Payment
  paymentMethod: z.literal('cash', {
    errorMap: () => ({ message: 'Only cash payment is accepted' }),
  }),
});

// User profile schema
export const userProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: dobSchema.optional(),
  marketingConsent: z.boolean().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1).max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.enum(['name', 'price', 'created_at', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// File upload validation
export const imageUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024, 'Image must be less than 5MB'),
});

// Utility functions for validation
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const field = err.path.join('.');
        return field ? `${field}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Rate limit validation
export function validateRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // In a real implementation, this would use Redis or similar
  // For now, use in-memory storage
  const attempts = getRateLimitAttempts(key, windowStart);

  if (attempts >= limit) {
    return false;
  }

  recordRateLimitAttempt(key, now);
  return true;
}

// Mock rate limit storage (replace with Redis in production)
const rateLimitStore = new Map<string, number[]>();

function getRateLimitAttempts(key: string, windowStart: number): number {
  const attempts = rateLimitStore.get(key) || [];
  const validAttempts = attempts.filter((time) => time > windowStart);
  rateLimitStore.set(key, validAttempts);
  return validAttempts.length;
}

function recordRateLimitAttempt(key: string, timestamp: number): void {
  const attempts = rateLimitStore.get(key) || [];
  attempts.push(timestamp);
  rateLimitStore.set(key, attempts);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore();
  }
}

function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, attempts] of rateLimitStore.entries()) {
    const validAttempts = attempts.filter((time) => now - time < maxAge);
    if (validAttempts.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validAttempts);
    }
  }
}

// OWASP Top 10 compliance helpers
export const securityHeaders = {
  contentType: 'application/json; charset=utf-8',
  xContentTypeOptions: 'nosniff',
  xFrameOptions: 'DENY',
  xXssProtection: '1; mode=block',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  contentSecurityPolicy: "default-src 'self'",
};
