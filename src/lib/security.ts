import { supabase } from '@/integrations/supabase/client';

// Session security utilities
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

// Track user activity for session management
let lastActivity = Date.now();
let inactivityTimer: NodeJS.Timeout | null = null;

export const updateActivity = (): void => {
  lastActivity = Date.now();
  resetInactivityTimer();
};

export const resetInactivityTimer = (): void => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    handleInactiveSession();
  }, INACTIVITY_TIMEOUT);
};

export const handleInactiveSession = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    window.location.href = '/auth?reason=inactive';
  } catch (error) {
    console.error('Error during inactive session logout:', error);
  }
};

// Initialize activity tracking
export const initializeActivityTracking = (): void => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  resetInactivityTimer();
};

// Clean up activity tracking
export const cleanupActivityTracking = (): void => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.removeEventListener(event, updateActivity);
  });
  
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
};

// Token validation
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // Check if session is expired
    const now = Date.now();
    const sessionExp = session.expires_at ? session.expires_at * 1000 : 0;
    
    if (sessionExp && now > sessionExp) {
      await supabase.auth.signOut();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

// Secure headers configuration (for future implementation)
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://ralbzuvkyexortqngvxs.supabase.co wss://ralbzuvkyexortqngvxs.supabase.co;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Age verification utilities
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const isLegalAge = (dateOfBirth: string): boolean => {
  return calculateAge(dateOfBirth) >= 21;
};

// Error logging (secure - no sensitive data)
export const logSecurityEvent = (event: string, details?: Record<string, any>): void => {
  const timestamp = new Date().toISOString();
  const sanitizedDetails = details ? { 
    ...details, 
    // Remove any potentially sensitive data
    password: undefined,
    token: undefined,
    session: undefined 
  } : {};
  
  console.warn(`[SECURITY] ${timestamp}: ${event}`, sanitizedDetails);
};