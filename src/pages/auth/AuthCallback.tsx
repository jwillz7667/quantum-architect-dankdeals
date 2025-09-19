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

        // Handle the OAuth callback by exchanging the code for a session
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthCallback: getSession result:', { data: data?.session ? 'session exists' : 'no session', error });

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

        if (data.session) {
          console.log('AuthCallback: Session found, user logged in successfully');
          logger.info('OAuth sign in successful', {
            userId: data.session.user.id,
            provider: data.session.user.app_metadata.provider,
          });

          // Ensure profile exists and is up to date
          try {
            const { data: profileData, error: profileError } = await supabase
              .rpc('get_user_profile_data', { user_uuid: data.session.user.id });

            if (profileError) {
              logger.warn('Profile fetch error during callback', { error: profileError.message });
            } else if (profileData && profileData.length > 0) {
              logger.info('User profile loaded successfully');
            }
          } catch (profileErr) {
            logger.warn('Profile check failed during callback', { error: String(profileErr) });
          }

          // Check if user needs age verification
          const needsAgeVerification = !data.session.user.user_metadata?.['age_verified'];
          
          // Redirect to appropriate page
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get('redirect_to') || '/';
          
          if (needsAgeVerification && !redirectTo.includes('age-gate')) {
            // Redirect to age verification if needed
            navigate('/age-gate', { replace: true, state: { redirectTo } });
          } else {
            // Redirect to intended destination
            navigate(redirectTo, { replace: true });
          }
        } else {
          // No session found after callback, try to handle URL fragments
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set session manually
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              logger.error('Session setting error', sessionError);
              navigate('/auth/login', { replace: true });
              return;
            }
            
            if (sessionData.session) {
              const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';
              navigate(redirectTo, { replace: true });
              return;
            }
          }
          
          // No session found, redirect to login
          logger.warn('No session found after OAuth callback');
          toast({
            variant: 'destructive',
            title: 'Authentication incomplete',
            description: 'Please try signing in again.',
          });
          navigate('/auth/login', { replace: true });
        }
      } catch (error) {
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
