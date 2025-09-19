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

        // First, try to exchange the auth code for a session
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(window.location.search);
        console.log('AuthCallback: exchangeCodeForSession result:', { 
          hasSession: !!sessionData?.session, 
          hasUser: !!sessionData?.user,
          error: sessionError?.message 
        });

        if (sessionError) {
          console.log('AuthCallback: exchangeCodeForSession error:', sessionError);
          logger.error('Auth callback error', sessionError);
          toast({
            variant: 'destructive',
            title: 'Authentication failed',
            description: 'There was an error signing you in. Please try again.',
          });
          navigate('/auth/login', { replace: true });
          return;
        }

        if (sessionData?.session) {
          console.log('AuthCallback: Session established successfully');
          logger.info('OAuth sign in successful', {
            userId: sessionData.session.user.id,
            provider: sessionData.session.user.app_metadata.provider,
          });

          // Small delay to ensure auth context updates
          setTimeout(() => {
            // Check if user needs age verification
            const needsAgeVerification = !sessionData.session?.user.user_metadata?.['age_verified'];
            
            // Get redirect destination
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect_to') || '/';
            
            if (needsAgeVerification && !redirectTo.includes('age-gate')) {
              navigate('/age-gate', { replace: true, state: { redirectTo } });
            } else {
              navigate(redirectTo, { replace: true });
            }
          }, 100);
          
          return;
        }

        // Fallback: Try getting existing session
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthCallback: getSession fallback result:', { 
          hasSession: !!data?.session, 
          error: error?.message 
        });

        if (data?.session) {
          console.log('AuthCallback: Found existing session');
          const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';
          navigate(redirectTo, { replace: true });
          return;
        }

        // If no session found anywhere, redirect to login
        console.log('AuthCallback: No session found, redirecting to login');
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
    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  if (isProcessing) {
    return <PageLoader />;
  }

  // This should rarely be seen since we navigate away immediately
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
