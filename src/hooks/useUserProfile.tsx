import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';

interface UserPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  dark_mode: boolean;
  two_factor_enabled: boolean;
}

interface UserAddress {
  id: string;
  first_name: string;
  last_name: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  type: string;
  label?: string;
  is_default: boolean;
  delivery_instructions?: string;
}

interface UserProfile {
  profile_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  age_verified: boolean;
  age_verified_at?: string;
  marketing_consent: boolean;
  terms_accepted_at?: string;
  role: string;
  preferences: UserPreferences;
  addresses: UserAddress[];
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_user_profile_data', { user_uuid: user.id });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const profileData = data[0];
        if (profileData) {
          setProfile({
            profile_id: profileData.profile_id,
            email: profileData.email || undefined,
            first_name: profileData.first_name || undefined,
            last_name: profileData.last_name || undefined,
            phone: profileData.phone || undefined,
            date_of_birth: profileData.date_of_birth || undefined,
            age_verified: profileData.age_verified || false,
            age_verified_at: profileData.age_verified_at || undefined,
            marketing_consent: profileData.marketing_consent || false,
            terms_accepted_at: profileData.terms_accepted_at || undefined,
            role: profileData.role || 'user',
            preferences: profileData.preferences ? 
              (profileData.preferences as unknown as UserPreferences) : {
                email_notifications: true,
                sms_notifications: true,
                push_notifications: false,
                marketing_emails: false,
                dark_mode: false,
                two_factor_enabled: false,
              },
            addresses: profileData.addresses ? 
              (profileData.addresses as unknown as UserAddress[]) : [],
          });
        }
      } else {
        // Create basic profile if none exists
        setProfile({
          profile_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.['first_name'] || undefined,
          last_name: user.user_metadata?.['last_name'] || undefined,
          age_verified: false,
          marketing_consent: false,
          role: 'user',
          preferences: {
            email_notifications: true,
            sms_notifications: true,
            push_notifications: false,
            marketing_emails: false,
            dark_mode: false,
            two_factor_enabled: false,
          },
          addresses: [],
        });
      }
    } catch (err) {
      logger.error('Error fetching user profile', err as Error);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      setError(null);
      
      // Update the profiles table
      const profileUpdates: Record<string, any> = {};
      if (updates.first_name !== undefined) profileUpdates['first_name'] = updates.first_name;
      if (updates.last_name !== undefined) profileUpdates['last_name'] = updates.last_name;
      if (updates.phone !== undefined) profileUpdates['phone'] = updates.phone;
      if (updates.date_of_birth !== undefined) profileUpdates['date_of_birth'] = updates.date_of_birth;
      if (updates.marketing_consent !== undefined) profileUpdates['marketing_consent'] = updates.marketing_consent;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profileError) {
          throw profileError;
        }
      }

      // Update preferences if provided
      if (updates.preferences) {
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            ...updates.preferences,
            updated_at: new Date().toISOString(),
          });

        if (prefsError) {
          throw prefsError;
        }
      }

      // Refresh profile data
      await fetchProfile();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      logger.error('Error updating profile', err as Error);
      return { success: false, error: errorMessage };
    }
  };

  const addAddress = async (address: Omit<UserAddress, 'id'>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          ...address,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchProfile();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add address';
      setError(errorMessage);
      logger.error('Error adding address', err as Error);
      return { success: false, error: errorMessage };
    }
  };

  const updateAddress = async (addressId: string, updates: Partial<UserAddress>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      setError(null);
      
      const { error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      await fetchProfile();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update address';
      setError(errorMessage);
      logger.error('Error updating address', err as Error);
      return { success: false, error: errorMessage };
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      setError(null);
      
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      await fetchProfile();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address';
      setError(errorMessage);
      logger.error('Error deleting address', err as Error);
      return { success: false, error: errorMessage };
    }
  };

  const getDefaultAddress = () => {
    return profile?.addresses.find(addr => addr.is_default) || profile?.addresses[0] || null;
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
  };
};