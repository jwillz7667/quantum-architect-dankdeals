import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirectTo = '/auth/login',
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Auth check', { user: !!user, loading, currentPath: location.pathname });

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loader');
    return <PageLoader />;
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    // Save the attempted location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.user_metadata?.['is_admin']) {
    console.log('ProtectedRoute: User not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};
