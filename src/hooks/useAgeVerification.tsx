import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface AgeVerificationState {
  isVerified: boolean;
  isLoading: boolean;
  dateOfBirth: Date | null;
}

interface ProfileData {
  date_of_birth: string | null;
  age_verified: boolean | null;
}

export function useAgeVerification() {
  const { user } = useAuth();
  const [state, setState] = useState<AgeVerificationState>({
    isVerified: false,
    isLoading: true,
    dateOfBirth: null,
  });

  const checkVerificationStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('date_of_birth, age_verified')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const profileData = data as ProfileData;
      
      setState({
        isVerified: profileData?.age_verified || false,
        isLoading: false,
        dateOfBirth: profileData?.date_of_birth ? new Date(profileData.date_of_birth) : null,
      });
    } catch (error) {
      logger.error('Failed to check age verification', error as Error);
      setState({ isVerified: false, isLoading: false, dateOfBirth: null });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void checkVerificationStatus();
    } else {
      setState({ isVerified: false, isLoading: false, dateOfBirth: null });
    }
  }, [user, checkVerificationStatus]);

  const verifyAge = async (dateOfBirth: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      // Log the attempt (for compliance)
      const birthDateString = dateOfBirth.toISOString().substring(0, 10);
      await supabase.rpc('log_age_verification', {
        birth_date: birthDateString,
        ip: window.location.hostname,
        agent: navigator.userAgent,
      });

      // Verify age
      const response = await supabase.rpc('verify_user_age', {
        birth_date: birthDateString,
      });
      const { data, error } = response;

      if (error) throw error;

      const isVerified = Boolean(data);

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
