// Security utilities for input sanitization and validation
import DOMPurify from 'dompurify';

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove any HTML tags and encode special characters
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style'],
  }).trim();
}

/**
 * Sanitize HTML content with allowed tags
 */
export function sanitizeHtml(input: string, allowedTags: string[] = []): string {
  if (typeof input !== 'string') return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover'],
  });
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  const sanitized = sanitizeText(email).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize phone numbers - remove all non-digits
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';

  return phone.replace(/\D/g, '');
}

/**
 * Sanitize and validate numeric input
 */
export function sanitizeNumber(input: string, min?: number, max?: number): number | null {
  if (typeof input !== 'string') return null;

  const sanitized = sanitizeText(input);
  const num = parseFloat(sanitized);

  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;

  return num;
}

/**
 * Sanitize ZIP codes - allow only 5 digits
 */
export function sanitizeZipCode(zip: string): string {
  if (typeof zip !== 'string') return '';

  const cleaned = zip.replace(/\D/g, '');
  return cleaned.substring(0, 5);
}

/**
 * Generic input validator that combines length and content checks
 */
export function validateInput(
  input: string,
  maxLength: number = 1000,
  allowHtml: boolean = false
): { isValid: boolean; sanitized: string; error?: string } {
  if (typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Invalid input type' };
  }

  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitized: input.substring(0, maxLength),
      error: `Input too long (max ${maxLength} characters)`,
    };
  }

  const sanitized = allowHtml ? sanitizeHtml(input) : sanitizeText(input);

  // Check for potentially malicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /on\w+\s*=/i,
  ];

  const hasSuspiciousContent = suspiciousPatterns.some((pattern) => pattern.test(input));

  if (hasSuspiciousContent) {
    return {
      isValid: false,
      sanitized,
      error: 'Input contains potentially harmful content',
    };
  }

  return { isValid: true, sanitized };
}
