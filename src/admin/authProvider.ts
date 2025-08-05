import type { AuthProvider } from 'react-admin';
import type { supabase } from '@/integrations/supabase/client';

interface LoginParams {
  username: string;
  password: string;
}

interface ProfileData {
  role?: string;
  full_name?: string;
  avatar_url?: string;
}

export const supabaseAuthProvider = (client: typeof supabase): AuthProvider => ({
  login: async ({ username, password }: LoginParams) => {
    const { data, error } = await client.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Check if user is admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if ((profile as ProfileData | null)?.role !== 'admin') {
      await client.auth.signOut();
      throw new Error('Access denied. Admin privileges required.');
    }

    return Promise.resolve();
  },

  logout: async () => {
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return Promise.resolve();
  },

  checkAuth: async () => {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session) {
      return Promise.reject(new Error('No session'));
    }

    // Check if user is admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if ((profile as ProfileData | null)?.role !== 'admin') {
      return Promise.reject(new Error('Admin access required'));
    }

    return Promise.resolve();
  },

  checkError: (error: { status?: number }) => {
    if (error?.status === 401 || error?.status === 403) {
      return Promise.reject(new Error('Unauthorized'));
    }
    return Promise.resolve();
  },

  getPermissions: async () => {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session) {
      return Promise.resolve(null);
    }

    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    return Promise.resolve((profile as ProfileData | null)?.role || 'user');
  },

  getIdentity: async () => {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session) {
      return Promise.reject(new Error('No session'));
    }

    const result = await client.from('profiles').select('*').eq('id', session.user.id).single();

    const profile = result.data as ProfileData | null;

    return Promise.resolve({
      id: session.user.id,
      email: session.user.email || '',
      fullName: profile?.full_name || session.user.email || '',
      avatar: profile?.avatar_url,
    });
  },
});
