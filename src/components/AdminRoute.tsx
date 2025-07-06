// import { Navigate } from 'react-router-dom';
// import { useAdminAuth } from '@/hooks/useAdminAuth';
// import { Loader2 } from 'lucide-react';

// interface AdminRouteProps {
//   children: React.ReactNode;
// }

// export function AdminRoute({ children }: AdminRouteProps) {
//   const { isAdmin, isLoading } = useAdminAuth();

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-green-600" />
//       </div>
//     );
//   }

//   if (!isAdmin) {
//     return <Navigate to="/" replace />;
//   }

//   return <>{children}</>;
// }

// Disabled Admin Route Component
export function AdminRoute({ children }: { children: React.ReactNode }) {
  // Admin functionality disabled
  return null;
}
