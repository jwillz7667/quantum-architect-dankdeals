import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/PageLoader';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Auth callback error', error);
          toast({
            variant: 'destructive',
            title: 'Authentication failed',
            description: 'There was an error signing you in. Please try again.',
          });
          navigate('/auth/login');
          return;
        }

        if (data.session) {
          logger.info('OAuth sign in successful', {
            userId: data.session.user.id,
            provider: data.session.user.app_metadata.provider,
          });

          // Redirect to home page or intended destination
          // Toast will be shown by AuthContext on SIGNED_IN event
          const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';
          navigate(redirectTo);
        } else {
          // No session found, redirect to login
          navigate('/auth/login');
        }
      } catch (error) {
        logger.error('Unexpected auth callback error', error as Error);
        toast({
          variant: 'destructive',
          title: 'Authentication error',
          description: 'An unexpected error occurred. Please try again.',
        });
        navigate('/auth/login');
      }
    };

    void handleAuthCallback();
  }, [navigate, toast]);

  return <PageLoader />;
}
