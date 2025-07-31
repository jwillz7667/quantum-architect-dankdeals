import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
// import { setSentryUser, clearSentryUser } from '@/lib/sentry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
  signInWithFacebook: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Record<string, unknown>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error('Error initializing auth', error as Error);
      } finally {
        setLoading(false);
        // Mark initial load as complete after first check
        setTimeout(() => setIsInitialLoad(false), 1000);
      }
    };

    void initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed', { event, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Update Sentry user context (temporarily disabled)
      // if (session?.user) {
      //   setSentryUser({
      //     id: session.user.id,
      //     email: session.user.email,
      //     username: session.user.user_metadata?.first_name || session.user.email,
      //   });
      // } else {
      //   clearSentryUser();
      // }

      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          // Only show welcome toast if:
          // 1. Not the initial load (page refresh/revisit)
          // 2. Haven't shown it already in this session
          // 3. There's an actual user (not just session restoration)
          if (!isInitialLoad && !hasShownWelcomeToast && session?.user) {
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
            });
            setHasShownWelcomeToast(true);
          }
          break;
        case 'SIGNED_OUT':
          // Reset the welcome toast flag on sign out
          setHasShownWelcomeToast(false);
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
          break;
        case 'USER_UPDATED':
          // Only show if not initial load to avoid showing on page refresh
          if (!isInitialLoad) {
            toast({
              title: 'Profile updated',
              description: 'Your profile has been updated successfully.',
            });
          }
          break;
        case 'PASSWORD_RECOVERY':
          toast({
            title: 'Password reset',
            description: 'Check your email for the password reset link.',
          });
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [toast, isInitialLoad, hasShownWelcomeToast]);

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Sign up error', error);
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: error.message,
        });
        return { error };
      }

      if (data.user && !data.session) {
        toast({
          title: 'Check your email',
          description: 'Please check your email to confirm your account.',
        });
      }

      return { error: null };
    } catch (error) {
      logger.error('Unexpected sign up error', error as Error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Reset the toast flag before sign in to ensure it shows
      setHasShownWelcomeToast(false);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Sign in error', error);
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: error.message,
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Unexpected sign in error', error as Error);
      return { error: error as AuthError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Reset the toast flag before sign in to ensure it shows
      setHasShownWelcomeToast(false);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Google sign in error', error);
        toast({
          variant: 'destructive',
          title: 'Google sign in failed',
          description: error.message,
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Unexpected Google sign in error', error as Error);
      return { error: error as AuthError };
    }
  };

  const signInWithApple = async () => {
    try {
      // Reset the toast flag before sign in to ensure it shows
      setHasShownWelcomeToast(false);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Apple sign in error', error);
        toast({
          variant: 'destructive',
          title: 'Apple sign in failed',
          description: error.message,
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Unexpected Apple sign in error', error as Error);
      return { error: error as AuthError };
    }
  };

  const signInWithFacebook = async () => {
    try {
      // Reset the toast flag before sign in to ensure it shows
      setHasShownWelcomeToast(false);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email',
        },
      });

      if (error) {
        logger.error('Facebook sign in error', error);
        toast({
          variant: 'destructive',
          title: 'Facebook sign in failed',
          description: error.message,
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Unexpected Facebook sign in error', error as Error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Sign out error', error);
        toast({
          variant: 'destructive',
          title: 'Sign out failed',
          description: error.message,
        });
      }
    } catch (error) {
      logger.error('Unexpected sign out error', error as Error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logger.error('Password reset error', error);
        toast({
          variant: 'destructive',
          title: 'Password reset failed',
          description: error.message,
        });
        return { error };
      }

      toast({
        title: 'Password reset email sent',
        description: 'Check your email for the password reset link.',
      });

      return { error: null };
    } catch (error) {
      logger.error('Unexpected password reset error', error as Error);
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error('Password update error', error);
        toast({
          variant: 'destructive',
          title: 'Password update failed',
          description: error.message,
        });
        return { error };
      }

      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
      });

      return { error: null };
    } catch (error) {
      logger.error('Unexpected password update error', error as Error);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Record<string, unknown>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

      if (error) {
        logger.error('Profile update error', error);
        toast({
          variant: 'destructive',
          title: 'Profile update failed',
          description: error.message,
        });
        return { error };
      }

      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (metadataError) {
        logger.error('User metadata update error', metadataError);
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      return { error: null };
    } catch (error) {
      logger.error('Unexpected profile update error', error as Error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
