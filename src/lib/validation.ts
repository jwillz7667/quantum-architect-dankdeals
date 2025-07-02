import { z } from 'zod';

// Email validation with proper regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password strength requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// Auth validation schemas
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address').regex(emailRegex, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Please enter a valid email address').regex(emailRegex, 'Invalid email format'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000); // Limit length to prevent DoS
};

// CSRF token generation
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

// Rate limiting storage
interface RateLimit {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const rateLimitStorage = new Map<string, RateLimit>();

export const checkRateLimit = (identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
} => {
  const now = Date.now();
  const key = identifier.toLowerCase();
  
  let rateLimit = rateLimitStorage.get(key);
  
  if (!rateLimit) {
    rateLimit = { attempts: 0, lastAttempt: now };
    rateLimitStorage.set(key, rateLimit);
  }
  
  // Check if currently locked
  if (rateLimit.lockedUntil && now < rateLimit.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: rateLimit.lockedUntil
    };
  }
  
  // Reset if window has passed
  if (now - rateLimit.lastAttempt > windowMs) {
    rateLimit.attempts = 0;
    rateLimit.lockedUntil = undefined;
  }
  
  const remainingAttempts = maxAttempts - rateLimit.attempts;
  
  if (remainingAttempts <= 0) {
    // Lock for 15 minutes after max attempts
    rateLimit.lockedUntil = now + (15 * 60 * 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: rateLimit.lockedUntil
    };
  }
  
  return {
    allowed: true,
    remainingAttempts,
  };
};

export const recordFailedAttempt = (identifier: string): void => {
  const key = identifier.toLowerCase();
  const now = Date.now();
  
  let rateLimit = rateLimitStorage.get(key);
  if (!rateLimit) {
    rateLimit = { attempts: 0, lastAttempt: now };
  }
  
  rateLimit.attempts += 1;
  rateLimit.lastAttempt = now;
  rateLimitStorage.set(key, rateLimit);
};

export const resetRateLimit = (identifier: string): void => {
  rateLimitStorage.delete(identifier.toLowerCase());
};

export type SignInForm = z.infer<typeof signInSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;