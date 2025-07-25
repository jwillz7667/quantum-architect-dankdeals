// Client-side rate limiting for API calls
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulGET?: boolean;
  onLimitReached?: (key: string) => void;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry || now >= entry.resetTime) {
      // First request or window expired
      this.storage.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      if (this.config.onLimitReached) {
        this.config.onLimitReached(key);
      }
      
      logger.warn('Rate limit exceeded', {
        key,
        count: entry.count,
        limit: this.config.maxRequests,
        windowMs: this.config.windowMs,
        timeRemaining: entry.resetTime - now,
      });
      
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const entry = this.storage.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number {
    const entry = this.storage.get(key);
    return entry?.resetTime || Date.now();
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now >= entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }
}

// Rate limiter instances for different API categories
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulGET: true,
});

export const orderRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
});

export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  onLimitReached: (key) => {
    logger.security('Authentication rate limit exceeded', { key });
  },
});

export const searchRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Wrapper for fetch with rate limiting
 */
export async function rateLimitedFetch(
  url: string,
  options: RequestInit = {},
  limiter: RateLimiter = apiRateLimiter
): Promise<Response> {
  const key = `${options.method || 'GET'}:${url}`;

  if (!limiter.isAllowed(key)) {
    const resetTime = limiter.getResetTime(key);
    const waitTime = Math.ceil((resetTime - Date.now()) / 1000);

    throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
  }

  try {
    const response = await fetch(url, options);

    // Don't count successful GET requests toward limit (if configured)
    if (limiter.config.skipSuccessfulGET && (options.method || 'GET') === 'GET' && response.ok) {
      limiter.reset(key);
    }

    return response;
  } catch (error) {
    // Reset on network errors to avoid penalizing temporary issues
    if (error instanceof TypeError) {
      limiter.reset(key);
    }
    throw error;
  }
}

/**
 * Rate limited wrapper for Supabase calls
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  limiter: RateLimiter = apiRateLimiter,
  keyFn?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : fn.name || 'supabase_call';

    if (!limiter.isAllowed(key)) {
      const resetTime = limiter.getResetTime(key);
      const waitTime = Math.ceil((resetTime - Date.now()) / 1000);

      throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
    }

    return await fn(...args);
  }) as T;
}
