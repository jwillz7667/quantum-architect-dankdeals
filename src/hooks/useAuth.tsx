import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  sanitizeInput,
  generateCSRFToken,
} from '@/lib/validation';
import {
  initializeActivityTracking,
  cleanupActivityTracking,
  logSecurityEvent,
} from '@/lib/security';

interface AuthResult {
  error: AuthError | null;
  rateLimited?: boolean;
  lockedUntil?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { is_admin?: boolean } | null;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: AuthError | null }>;
  loading: boolean;
  csrfToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ is_admin?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string>(generateCSRFToken());
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);

    try {
      // First check if user has admin role in auth metadata
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Error fetching auth user:', authError);
        setProfile({ is_admin: false });
        return;
      }

      // Check multiple possible locations for admin flag
      const isAdminFromMetadata =
        authUser?.app_metadata?.is_admin === true ||
        authUser?.app_metadata?.role === 'admin' ||
        authUser?.user_metadata?.is_admin === true;

      if (isAdminFromMetadata) {
        console.log('User is admin from metadata:', {
          userId,
          app_metadata: authUser?.app_metadata,
        });
        setProfile({ is_admin: true });
        return;
      }

      // Fallback: directly query auth.users table using RPC function
      const result: PostgrestSingleResponse<boolean> = await supabase.rpc('check_user_is_admin', {
        user_id: userId,
      });
      const { data: adminData, error: adminError } = result;

      if (!adminError && typeof adminData === 'boolean') {
        console.log('User admin status from RPC:', { userId, is_admin: adminData });
        setProfile({ is_admin: adminData });
      } else {
        console.log('Could not determine admin status, defaulting to false:', adminError);
        setProfile({ is_admin: false });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile({ is_admin: false });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);

      // Initialize activity tracking when user signs in
      if (event === 'SIGNED_IN' && session) {
        initializeActivityTracking();
        resetRateLimit(session.user.email || '');
        logSecurityEvent('User signed in', { userId: session.user.id });
      }

      // Clean up activity tracking when user signs out
      if (event === 'SIGNED_OUT') {
        cleanupActivityTracking();
        setCsrfToken(generateCSRFToken()); // Generate new CSRF token
        logSecurityEvent('User signed out');
      }
    });

    // THEN check for existing session
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);

      // Initialize activity tracking if user is already signed in
      if (session) {
        initializeActivityTracking();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupActivityTracking();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResult> => {
    try {
      setLoading(true);

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFirstName = firstName ? sanitizeInput(firstName) : '';
      const sanitizedLastName = lastName ? sanitizeInput(lastName) : '';

      // Check rate limiting
      const rateCheck = checkRateLimit(sanitizedEmail);
      if (!rateCheck.allowed) {
        const message = rateCheck.lockedUntil
          ? `Account temporarily locked. Try again after ${new Date(rateCheck.lockedUntil).toLocaleTimeString()}`
          : `Too many attempts. ${rateCheck.remainingAttempts} attempts remaining.`;

        toast({
          title: 'Sign up failed',
          description: message,
          variant: 'destructive',
        });

        logSecurityEvent('Sign up rate limited', { email: sanitizedEmail });

        return {
          error: { message, status: 429 } as AuthError,
          rateLimited: true,
          lockedUntil: rateCheck.lockedUntil,
        };
      }

      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
          },
        },
      });

      if (error) {
        recordFailedAttempt(sanitizedEmail);

        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });

        logSecurityEvent('Sign up failed', {
          email: sanitizedEmail,
          error: error.message,
        });
      } else {
        toast({
          title: 'Success!',
          description: 'Please check your email to confirm your account.',
        });

        logSecurityEvent('Sign up successful', { email: sanitizedEmail });
      }

      return { error };
    } catch (error) {
      recordFailedAttempt(email);

      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      toast({
        title: 'Sign up failed',
        description: errorMessage,
        variant: 'destructive',
      });

      logSecurityEvent('Sign up error', { error: errorMessage });

      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true);

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);

      // Check rate limiting
      const rateCheck = checkRateLimit(sanitizedEmail);
      if (!rateCheck.allowed) {
        const message = rateCheck.lockedUntil
          ? `Account temporarily locked. Try again after ${new Date(rateCheck.lockedUntil).toLocaleTimeString()}`
          : `Too many attempts. ${rateCheck.remainingAttempts} attempts remaining.`;

        toast({
          title: 'Sign in failed',
          description: message,
          variant: 'destructive',
        });

        logSecurityEvent('Sign in rate limited', { email: sanitizedEmail });

        return {
          error: { message, status: 429 } as AuthError,
          rateLimited: true,
          lockedUntil: rateCheck.lockedUntil,
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        recordFailedAttempt(sanitizedEmail);

        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });

        logSecurityEvent('Sign in failed', {
          email: sanitizedEmail,
          error: error.message,
        });
      } else {
        logSecurityEvent('Sign in successful', { email: sanitizedEmail });
      }

      return { error };
    } catch (error) {
      recordFailedAttempt(email);

      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      toast({
        title: 'Sign in failed',
        description: errorMessage,
        variant: 'destructive',
      });

      logSecurityEvent('Sign in error', { error: errorMessage });

      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: 'Sign out failed',
          description: error.message,
          variant: 'destructive',
        });

        logSecurityEvent('Sign out failed', { error: error.message });
      }

      return { error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      toast({
        title: 'Sign out failed',
        description: errorMessage,
        variant: 'destructive',
      });

      logSecurityEvent('Sign out error', { error: errorMessage });

      return { error: { message: errorMessage } as AuthError };
    }
  };

  const value = {
    user,
    session,
    profile,
    signUp,
    signIn,
    signOut,
    loading,
    csrfToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export useAuth separately to fix fast refresh warning
export { useAuth };
