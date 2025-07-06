// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '@/integrations/supabase/client';
// import { toast } from 'sonner';
// import { logger } from '@/lib/logger';
// import type { AdminUser } from '@/types/admin';

// export function useAdminAuth() {
//   const [isAdmin, setIsAdmin] = useState<boolean>(false);
//   const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     checkAdminStatus();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
//       logger.debug('Auth state changed', {
//         context: {
//           event,
//           userId: session?.user?.id
//         }
//       });
//       if (event === 'SIGNED_OUT') {
//         setIsAdmin(false);
//         setAdminUser(null);
//       } else if (event === 'SIGNED_IN' && session?.user) {
//         checkAdminStatus();
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const checkAdminStatus = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();

//       if (!user) {
//         setIsAdmin(false);
//         setAdminUser(null);
//         setIsLoading(false);
//         return;
//       }

//       logger.debug('Checking admin status for user', {
//         context: { email: user.email }
//       });

//       // Check if user is in admins table
//       const { data: adminData, error: adminError } = await supabase
//         .from('admins')
//         .select('*')
//         .eq('user_id', user.id)
//         .maybeSingle();

//       if (adminError) {
//         logger.error('Failed to check admin status', adminError);
//         setIsAdmin(false);
//         setAdminUser(null);
//       } else if (!adminData) {
//         logger.debug('User is not an admin', {
//           context: { message: 'No admin record found' }
//         });
//         setIsAdmin(false);
//         setAdminUser(null);
//       } else {
//         logger.info('Admin user authenticated', {
//           userId: user.id,
//           context: {
//             email: user.email,
//             role: adminData.role
//           }
//         });
//         setIsAdmin(true);
//         setAdminUser({
//           ...user,
//           role: adminData.role,
//           permissions: adminData.permissions
//         } as AdminUser);
//       }
//     } catch (error) {
//       logger.error('Failed to check admin status', error as Error);
//       setIsAdmin(false);
//       setAdminUser(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const signOut = async () => {
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;

//       setIsAdmin(false);
//       setAdminUser(null);
//       navigate('/');
//       toast.success('Signed out successfully');
//     } catch (error) {
//       logger.error('Failed to sign out', error as Error);
//       toast.error('Failed to sign out');
//     }
//   };

//   const hasPermission = (permission: string): boolean => {
//     if (!adminUser) return false;
//     if (adminUser.role === 'super_admin') return true;
//     return adminUser.permissions?.includes(permission) || false;
//   };

//   const isSuperAdmin = (): boolean => {
//     return adminUser?.role === 'super_admin';
//   };

//   return {
//     isAdmin,
//     adminUser,
//     isLoading,
//     checkAdminStatus,
//     hasPermission,
//     isSuperAdmin,
//     signOut
//   };
// }

// Disabled Admin Auth Hook
export function useAdminAuth() {
  return {
    isAdmin: false,
    adminUser: null,
    isLoading: false,
    checkAdminStatus: () => {},
    hasPermission: () => false,
    isSuperAdmin: () => false,
    signOut: async () => {},
  };
}
