/**
 * Address management hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Address {
  id: string;
  user_id: string;
  type: 'delivery' | 'billing';
  label: string | null;
  first_name: string;
  last_name: string;
  street_address: string;
  apartment: string | null;
  unit: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  label?: string | null;
  first_name: string;
  last_name: string;
  street_address: string;
  apartment?: string | null;
  unit?: string | null;
  city: string;
  state?: string;
  zip_code: string;
  phone?: string | null;
  delivery_instructions?: string | null;
  is_default?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: string;
}

/**
 * Fetch all addresses for current user
 */
export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return []; // Return empty array for guests instead of throwing
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Address[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAddressData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // If this is set as default, unset other defaults first
      if (data.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }

      const { data: created, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          ...data,
          state: data.state || 'MN',
        })
        .select()
        .single();

      if (error) throw error;
      return created as Address;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address added successfully');
    },
    onError: (error) => {
      console.error('Create address error:', error);
      toast.error('Failed to add address');
    },
  });
}

/**
 * Update an existing address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAddressData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // If this is set as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data: updated, error } = await supabase
        .from('addresses')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return updated as Address;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address updated successfully');
    },
    onError: (error) => {
      console.error('Update address error:', error);
      toast.error('Failed to update address');
    },
  });
}

/**
 * Delete an address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully');
    },
    onError: (error) => {
      console.error('Delete address error:', error);
      toast.error('Failed to delete address');
    },
  });
}

/**
 * Set an address as default
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Unset all defaults
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);

      // Set this one as default
      const { error } = await supabase
        .from('addresses')
        .update({
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    },
    onError: (error) => {
      console.error('Set default address error:', error);
      toast.error('Failed to set default address');
    },
  });
}
