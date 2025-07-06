import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface AgeVerificationState {
  isVerified: boolean;
  isLoading: boolean;
  dateOfBirth: Date | null;
}

export function useAgeVerification() {
  const { user } = useAuth();
  const [state, setState] = useState<AgeVerificationState>({
    isVerified: false,
    isLoading: true,
    dateOfBirth: null,
  });

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    } else {
      setState({ isVerified: false, isLoading: false, dateOfBirth: null });
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('date_of_birth, age_verified')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setState({
        isVerified: data?.age_verified || false,
        isLoading: false,
        dateOfBirth: data?.date_of_birth ? new Date(data.date_of_birth) : null,
      });
    } catch (error) {
      logger.error('Failed to check age verification', error as Error);
      setState({ isVerified: false, isLoading: false, dateOfBirth: null });
    }
  };

  const verifyAge = async (dateOfBirth: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      // Log the attempt (for compliance)
      await supabase.rpc('log_age_verification', {
        birth_date: dateOfBirth.toISOString().split('T')[0],
        ip: window.location.hostname,
        agent: navigator.userAgent,
      });

      // Verify age
      const { data, error } = await supabase.rpc('verify_user_age', {
        birth_date: dateOfBirth.toISOString().split('T')[0],
      });

      if (error) throw error;

      const isVerified = data === true;

      setState((prev) => ({
        ...prev,
        isVerified,
        dateOfBirth: isVerified ? dateOfBirth : null,
      }));

      logger.audit('age_verification', user.id, {
        verified: isVerified,
        timestamp: new Date().toISOString(),
      });

      return isVerified;
    } catch (error) {
      logger.error('Age verification failed', error as Error);
      return false;
    }
  };

  return {
    isVerified: state.isVerified,
    isLoading: state.isLoading,
    dateOfBirth: state.dateOfBirth,
    verifyAge,
    checkVerificationStatus,
  };
}
