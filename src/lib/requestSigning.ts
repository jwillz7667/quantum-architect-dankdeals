// Request signing and validation for API security
import { logger } from './logger';

interface SignedRequestHeaders {
  'X-Timestamp': string;
  'X-Nonce': string;
  'X-Signature': string;
  'X-Client-Version': string;
  'X-Request-ID': string;
}

interface RequestSignatureData {
  timestamp: number;
  nonce: string;
  signature: string;
  requestId: string;
}

class RequestSigner {
  private readonly clientVersion: string;
  private readonly secretKey: string;
  private readonly algorithm: string = 'SHA-256';
  private readonly timestampTolerance: number = 300000; // 5 minutes

  constructor(secretKey?: string) {
    this.clientVersion = (import.meta.env['VITE_APP_VERSION'] as string) || '1.0.0';
    this.secretKey =
      secretKey || (import.meta.env['VITE_API_SECRET'] as string) || 'default-secret';
  }

  /**
   * Generate a cryptographically secure nonce
   */
  private generateNonce(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without crypto API
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create HMAC signature using Web Crypto API
   */
  private async createSignature(
    method: string,
    url: string,
    timestamp: string,
    nonce: string,
    body?: string
  ): Promise<string> {
    const payload = [method.toUpperCase(), url, timestamp, nonce, body || ''].join('\n');

    try {
      // Use Web Crypto API if available
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(this.secretKey),
          { name: 'HMAC', hash: this.algorithm },
          false,
          ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));

        return Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (error) {
      logger.warn('Web Crypto API not available, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Fallback: Simple hash function (not cryptographically secure)
    return this.simpleHash(payload + this.secretKey);
  }

  /**
   * Simple hash function fallback (not cryptographically secure)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Sign a request and return headers
   */
  async signRequest(method: string, url: string, body?: string): Promise<SignedRequestHeaders> {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    const requestId = this.generateRequestId();

    try {
      const signature = await this.createSignature(method, url, timestamp, nonce, body);

      return {
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
        'X-Client-Version': this.clientVersion,
        'X-Request-ID': requestId,
      };
    } catch (error) {
      logger.error('Failed to sign request', error as Error, {
        method,
        url: url.split('?')[0], // Don't log query params
      });
      throw new Error('Failed to sign request');
    }
  }

  /**
   * Validate request signature (for received requests)
   */
  async validateRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<boolean> {
    const timestamp = headers['X-Timestamp'] || headers['x-timestamp'];
    const nonce = headers['X-Nonce'] || headers['x-nonce'];
    const signature = headers['X-Signature'] || headers['x-signature'];

    if (!timestamp || !nonce || !signature) {
      logger.warn('Missing required signature headers');
      return false;
    }

    // Check timestamp to prevent replay attacks
    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();

    if (Math.abs(now - requestTime) > this.timestampTolerance) {
      logger.warn('Request timestamp outside tolerance', {
        requestTime,
        now,
        difference: Math.abs(now - requestTime),
        tolerance: this.timestampTolerance,
      });
      return false;
    }

    try {
      const expectedSignature = await this.createSignature(method, url, timestamp, nonce, body);
      const isValid = signature === expectedSignature;

      if (!isValid) {
        logger.warn('Invalid request signature', {
          method,
          url: url.split('?')[0],
          provided: signature.substring(0, 8) + '...',
          expected: expectedSignature.substring(0, 8) + '...',
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Error validating request signature', error as Error);
      return false;
    }
  }

  /**
   * Extract signature data from headers
   */
  extractSignatureData(headers: Record<string, string>): RequestSignatureData | null {
    const timestamp = headers['X-Timestamp'] || headers['x-timestamp'];
    const nonce = headers['X-Nonce'] || headers['x-nonce'];
    const signature = headers['X-Signature'] || headers['x-signature'];
    const requestId = headers['X-Request-ID'] || headers['x-request-id'];

    if (!timestamp || !nonce || !signature) {
      return null;
    }

    return {
      timestamp: parseInt(timestamp, 10),
      nonce,
      signature,
      requestId: requestId || 'unknown',
    };
  }
}

// Create default instance
export const requestSigner = new RequestSigner();

// Middleware for fetch requests
export async function signedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method || 'GET';
  const body = options.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  try {
    const signatureHeaders = await requestSigner.signRequest(method, url, body);

    const headers = new Headers(options.headers);
    Object.entries(signatureHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });

    return fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    logger.error('Failed to create signed request', error as Error, { url: url.split('?')[0] });
    throw error;
  }
}

// Wrapper for Supabase client requests
export function withRequestSigning<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  urlExtractor?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // For now, just add request ID for tracking
    // Full signing can be implemented when needed
    const requestId = requestSigner['generateRequestId']();

    logger.debug('Starting signed request', {
      requestId,
      function: fn.name,
      url: urlExtractor ? urlExtractor(...args) : 'supabase-call',
    });

    try {
      const result = await fn(...args);

      logger.debug('Signed request completed', {
        requestId,
        success: true,
      });

      return result as ReturnType<T>;
    } catch (error) {
      logger.error('Signed request failed', error as Error, {
        requestId,
        function: fn.name,
      });
      throw error;
    }
  }) as T;
}

export { RequestSigner };
export type { SignedRequestHeaders, RequestSignatureData };
