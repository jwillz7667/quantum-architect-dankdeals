// src/lib/api/security.ts
import { createHmac, randomBytes } from 'crypto';

// Security configuration interface
interface SecurityConfig {
  secretKey: string;
  algorithm: string;
  timestampWindow: number; // seconds
  nonceLength: number;
}

// Request signature interface
interface RequestSignature {
  timestamp: string;
  nonce: string;
  signature: string;
}

// Rate limiting interface
interface RateLimit {
  requests: number;
  windowMs: number;
  remaining: number;
  resetTime: number;
}

/**
 * Security utility class for API requests
 */
export class APISecurity {
  private static config: SecurityConfig = {
    secretKey: (import.meta.env['VITE_API_SECRET'] as string) || 'default-secret',
    algorithm: 'sha256',
    timestampWindow: 300, // 5 minutes
    nonceLength: 16,
  };

  /**
   * Generate a cryptographically secure nonce
   */
  static generateNonce(): string {
    try {
      return randomBytes(this.config.nonceLength).toString('hex');
    } catch {
      // Fallback for environments without crypto
      return (
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      );
    }
  }

  /**
   * Create HMAC signature for request
   */
  static createSignature(
    method: string,
    url: string,
    timestamp: string,
    nonce: string,
    body?: string
  ): string {
    const payload = [method.toUpperCase(), url, timestamp, nonce, body || ''].join('\n');

    return createHmac(this.config.algorithm, this.config.secretKey).update(payload).digest('hex');
  }

  /**
   * Verify request signature
   */
  static verifySignature(
    signature: string,
    method: string,
    url: string,
    timestamp: string,
    nonce: string,
    body?: string
  ): boolean {
    try {
      const expectedSignature = this.createSignature(method, url, timestamp, nonce, body);
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  /**
   * Validate timestamp to prevent replay attacks
   */
  static isTimestampValid(timestamp: string): boolean {
    try {
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const diff = Math.abs(currentTime - requestTime);

      return diff <= this.config.timestampWindow;
    } catch {
      return false;
    }
  }

  /**
   * Generate request signature data
   */
  static generateRequestSignature(method: string, url: string, body?: string): RequestSignature {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateNonce();
    const signature = this.createSignature(method, url, timestamp, nonce, body);

    return { timestamp, nonce, signature };
  }

  /**
   * Generate security headers for API requests
   */
  static generateSecurityHeaders(
    method: string,
    url: string,
    body?: string
  ): Record<string, string> {
    const { timestamp, nonce, signature } = this.generateRequestSignature(method, url, body);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Client-Version': (import.meta.env['VITE_APP_VERSION'] as string) || '1.0.0',
      'X-Request-ID': crypto.randomUUID(),
    };

    headers['X-Signature'] = signature;

    return headers;
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitizeInput(input: unknown): string {
    if (typeof input !== 'string') {
      if (input === null || input === undefined) {
        return '';
      }
      if (typeof input === 'object') {
        return '[object Object]';
      }
      // For non-object primitives (number, boolean, symbol, bigint)
      if (
        typeof input === 'number' ||
        typeof input === 'boolean' ||
        typeof input === 'symbol' ||
        typeof input === 'bigint'
      ) {
        return String(input);
      }
      // Fallback for any other case
      return '';
    }

    return input.replace(/[<>'"&]/g, (char) => {
      const entityMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entityMap[char] || char;
    });
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeURL(url: string): string {
    try {
      const parsedURL = new URL(url);
      // Only allow https in production
      if (import.meta.env.PROD && parsedURL.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed in production');
      }
      return parsedURL.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Rate limiting implementation
   */
  static checkRateLimit(identifier: string, maxRequests: number, windowMs: number): RateLimit {
    const key = `rate_limit_${identifier}`;
    const now = Date.now();

    // Get stored rate limit data (in a real app, this would use Redis or similar)
    const stored = localStorage.getItem(key);
    let rateLimitData: { requests: number; resetTime: number } = {
      requests: 0,
      resetTime: now + windowMs,
    };

    if (stored) {
      try {
        rateLimitData = JSON.parse(stored) as { requests: number; resetTime: number };
      } catch {
        // Invalid data, reset
        rateLimitData = { requests: 0, resetTime: now + windowMs };
      }
    }

    // Reset if window has expired
    if (now >= rateLimitData.resetTime) {
      rateLimitData = {
        requests: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    rateLimitData.requests++;

    // Store updated data
    localStorage.setItem(key, JSON.stringify(rateLimitData));

    return {
      requests: rateLimitData.requests,
      windowMs,
      remaining: Math.max(0, maxRequests - rateLimitData.requests),
      resetTime: rateLimitData.resetTime,
    };
  }

  /**
   * Content Security Policy headers
   */
  static getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }
}
