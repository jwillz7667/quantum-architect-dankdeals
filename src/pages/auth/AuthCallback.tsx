import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/PageLoader';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting auth callback handling');
        console.log('AuthCallback: Current URL:', window.location.href);
        console.log('AuthCallback: URL params:', window.location.search);
        console.log('AuthCallback: URL hash:', window.location.hash);

        // Wait a moment for Supabase to process the OAuth callback automatically
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if we now have a session
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthCallback: getSession result:', {
          hasSession: !!data?.session,
          hasUser: !!data?.session?.user,
          error: error?.message,
        });

        if (error) {
          console.log('AuthCallback: getSession error:', error);
          logger.error('Auth callback error', error);
          toast({
            variant: 'destructive',
            title: 'Authentication failed',
            description: 'There was an error signing you in. Please try again.',
          });
          navigate('/auth/login', { replace: true });
          return;
        }

        if (data?.session) {
          console.log('AuthCallback: Session found, user logged in successfully');
          logger.info('OAuth sign in successful', {
            userId: data.session.user.id,
            provider: data.session.user.app_metadata.provider,
          });

          // Get redirect destination from URL params or hash
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const redirectTo =
            urlParams.get('redirect_to') ||
            urlParams.get('redirectTo') ||
            hashParams.get('redirect_to') ||
            hashParams.get('redirectTo') ||
            '/';

          // For OAuth sign-ins, redirect directly to destination (skip welcome page)
          // Welcome page is protected and can cause issues with OAuth flow
          console.log('AuthCallback: Redirecting to:', redirectTo);
          navigate(redirectTo, { replace: true });

          // Show success toast
          toast({
            title: 'Welcome back!',
            description: `Successfully signed in with ${data.session.user.app_metadata.provider || 'OAuth'}`,
          });

          return;
        }

        // If still no session, wait a bit longer and try once more
        console.log('AuthCallback: No session yet, waiting longer...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { data: finalData, error: finalError } = await supabase.auth.getSession();
        console.log('AuthCallback: Final session check:', {
          hasSession: !!finalData?.session,
          error: finalError?.message,
        });

        if (finalData?.session) {
          console.log('AuthCallback: Session found on retry');
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const redirectTo =
            urlParams.get('redirect_to') ||
            urlParams.get('redirectTo') ||
            hashParams.get('redirect_to') ||
            hashParams.get('redirectTo') ||
            '/';

          console.log('AuthCallback: Redirecting to:', redirectTo);
          navigate(redirectTo, { replace: true });

          toast({
            title: 'Welcome!',
            description: 'Successfully signed in',
          });

          return;
        }

        // No session found after waiting, redirect to login
        console.log('AuthCallback: No session found after retries, redirecting to login');
        logger.warn('No session found after OAuth callback');
        toast({
          variant: 'destructive',
          title: 'Authentication incomplete',
          description: 'Please try signing in again.',
        });
        navigate('/auth/login', { replace: true });
      } catch (error) {
        console.log('AuthCallback: Unexpected error:', error);
        logger.error('Unexpected auth callback error', error as Error);
        toast({
          variant: 'destructive',
          title: 'Authentication error',
          description: 'An unexpected error occurred. Please try again.',
        });
        navigate('/auth/login', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      void handleAuthCallback();
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  if (isProcessing) {
    return <PageLoader />;
  }

  // This should rarely be seen since we navigate away immediately
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
