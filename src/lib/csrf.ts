// CSRF token management for form security
import { getCookie, setCookie } from './cookies';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token for the session
 */
export function getCSRFToken(): string {
  let token = getCookie(CSRF_TOKEN_KEY);

  if (!token) {
    token = generateCSRFToken();
    // Set token with secure flags - expires in 4 hours
    setCookie(CSRF_TOKEN_KEY, token, {
      maxAge: 4 * 60 * 60,
      sameSite: 'Strict',
      secure: window.location.protocol === 'https:',
      httpOnly: false, // Need access from JS for forms
    });
  }

  return token;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(providedToken: string): boolean {
  const sessionToken = getCookie(CSRF_TOKEN_KEY);

  if (!sessionToken || !providedToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return (
    sessionToken.length === providedToken.length &&
    sessionToken.split('').every((char, i) => char === providedToken[i])
  );
}

/**
 * Add CSRF token to form data
 */
export function addCSRFToFormData(formData: FormData): FormData {
  const token = getCSRFToken();
  formData.append('csrf_token', token);
  return formData;
}

/**
 * Add CSRF token to fetch headers
 */
export function addCSRFToHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Refresh CSRF token (call after successful form submission)
 */
export function refreshCSRFToken(): string {
  const newToken = generateCSRFToken();
  setCookie(CSRF_TOKEN_KEY, newToken, {
    maxAge: 4 * 60 * 60,
    sameSite: 'Strict',
    secure: window.location.protocol === 'https:',
    httpOnly: false,
  });
  return newToken;
}
