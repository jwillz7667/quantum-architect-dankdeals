import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkAdminStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setAdminUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async () => {
    console.log('🔍 Starting admin status check...');
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.email);
      
      if (!user) {
        console.log('❌ No user found');
        setIsAdmin(false);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      // Check if this is the admin email
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@dankdealsmn.com';
      if (user.email !== adminEmail) {
        console.log('❌ User is not admin email');
        setIsAdmin(false);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      console.log('✅ User has admin email, checking profile...');

      // Check if user has admin role in profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      console.log('📊 Profile query result:', { profile, error });

      if (error) {
        console.error('❌ Error fetching admin profile:', error);
        
        // If profile doesn't exist, create it for the admin user
        if (error.code === 'PGRST116') {
          console.log('🔨 Creating admin profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              role: 'admin',
              first_name: 'Admin',
              last_name: 'User'
            });

          if (insertError) {
            console.error('❌ Error creating admin profile:', insertError);
            setIsAdmin(false);
            setAdminUser(null);
          } else {
            console.log('✅ Admin profile created successfully');
            setIsAdmin(true);
            setAdminUser({
              id: user.id,
              email: user.email || '',
              role: 'admin',
              firstName: 'Admin',
              lastName: 'User',
            });
          }
        } else {
          setIsAdmin(false);
          setAdminUser(null);
        }
      } else if (profile?.role === 'admin') {
        console.log('✅ User is admin!');
        setIsAdmin(true);
        setAdminUser({
          id: user.id,
          email: user.email || '',
          role: profile.role,
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
        });
      } else {
        console.log('❌ User profile exists but role is not admin:', profile?.role);
        setIsAdmin(false);
        setAdminUser(null);
      }
    } catch (error) {
      console.error('❌ Admin auth check error:', error);
      setIsAdmin(false);
      setAdminUser(null);
    } finally {
      console.log('🏁 Admin status check complete');
      setIsLoading(false);
    }
  };

  const requireAdmin = () => {
    if (!isLoading && !isAdmin) {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@dankdealsmn.com';
      toast({
        title: "Access Denied",
        description: `Admin access is restricted to ${adminEmail} only.`,
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isAdmin,
    adminUser,
    isLoading,
    requireAdmin,
    signOut,
    checkAdminStatus,
  };
} 