/**
 * Secure cookie management utilities
 * Implements best practices for cookie security
 */

interface CookieOptions {
  maxAge?: number; // in seconds
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a secure cookie with proper security flags
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 30,
  options: CookieOptions = {}
): void {
  if (typeof document === 'undefined') return;

  const defaultOptions: CookieOptions = {
    path: '/',
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
    ...options,
  };

  // Calculate expiry
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  defaultOptions.expires = date;

  // Build cookie string
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (defaultOptions.expires) {
    cookieString += `; expires=${defaultOptions.expires.toUTCString()}`;
  }

  if (defaultOptions.maxAge !== undefined) {
    cookieString += `; max-age=${defaultOptions.maxAge}`;
  }

  if (defaultOptions.path) {
    cookieString += `; path=${defaultOptions.path}`;
  }

  if (defaultOptions.domain) {
    cookieString += `; domain=${defaultOptions.domain}`;
  }

  if (defaultOptions.secure) {
    cookieString += '; secure';
  }

  if (defaultOptions.httpOnly) {
    // Note: httpOnly cannot be set from JavaScript
    console.warn('httpOnly flag cannot be set from client-side JavaScript');
  }

  if (defaultOptions.sameSite) {
    cookieString += `; samesite=${defaultOptions.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;

  // Set cookie with expired date to delete it
  setCookie(name, '', -1, { path });
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const testKey = '__cookie_test__';
    setCookie(testKey, 'test', 1);
    const enabled = getCookie(testKey) === 'test';
    deleteCookie(testKey);
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Parse all cookies into an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Clear all cookies for the current domain
 * Note: This can only clear cookies set by JavaScript
 */
export function clearAllCookies(): void {
  if (typeof document === 'undefined') return;

  const cookies = getAllCookies();
  const paths = ['/', window.location.pathname];

  for (const name of Object.keys(cookies)) {
    for (const path of paths) {
      deleteCookie(name, path);
    }
  }
}

/**
 * Secure session storage wrapper
 */
export const secureStorage = {
  set(key: string, value: unknown, encrypt: boolean = false): void {
    try {
      const data = JSON.stringify(value);

      if (encrypt && window.crypto && window.crypto.subtle) {
        // In production, implement proper encryption
        console.warn('Encryption not implemented - storing as plain text');
      }

      sessionStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  },

  get<T>(key: string, decrypt: boolean = false): T | null {
    try {
      const data = sessionStorage.getItem(key);
      if (!data) return null;

      if (decrypt && window.crypto && window.crypto.subtle) {
        // In production, implement proper decryption
        console.warn('Decryption not implemented - reading as plain text');
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  },

  remove(key: string): void {
    sessionStorage.removeItem(key);
  },

  clear(): void {
    sessionStorage.clear();
  },
};

/**
 * Cookie consent utilities
 */
export const cookieConsent = {
  CONSENT_KEY: 'cookie_consent',

  hasConsent(): boolean {
    return getCookie(this.CONSENT_KEY) === 'accepted';
  },

  setConsent(accepted: boolean): void {
    if (accepted) {
      setCookie(this.CONSENT_KEY, 'accepted', 365, {
        sameSite: 'lax', // Allow for OAuth flows
      });
    } else {
      // Clear non-essential cookies
      this.clearNonEssentialCookies();
      setCookie(this.CONSENT_KEY, 'rejected', 365);
    }
  },

  clearNonEssentialCookies(): void {
    // Define essential cookies that should not be cleared
    const essentialCookies = ['dankdeals_age_verified', 'cookie_consent', 'csrf_token'];

    const allCookies = getAllCookies();
    for (const cookieName of Object.keys(allCookies)) {
      if (!essentialCookies.includes(cookieName)) {
        deleteCookie(cookieName);
      }
    }
  },
};

/**
 * CSRF token management
 */
export const csrf = {
  TOKEN_KEY: 'csrf_token',

  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  },

  setToken(): string {
    const token = this.generateToken();
    setCookie(this.TOKEN_KEY, token, 1, {
      sameSite: 'strict',
      secure: true,
    });
    return token;
  },

  getToken(): string | null {
    return getCookie(this.TOKEN_KEY);
  },

  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  },
};
