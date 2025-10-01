/**
 * Server-side admin check hook
 *
 * SECURITY: This checks profiles.role='admin' server-side via database query.
 * Do NOT use user_metadata.is_admin as it can be spoofed client-side.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useIsAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-status', user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Check profiles.role server-side
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to check admin status:', error);
        return false;
      }

      return data?.role === 'admin';
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading: isLoading && !!user,
  };
};
