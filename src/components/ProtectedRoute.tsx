import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { validateSession } from '@/lib/security';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requiresAdmin = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!loading && user) {
        const isValid = await validateSession();
        setSessionValid(isValid);

        if (!isValid) {
          navigate('/auth?reason=session_invalid');
        } else if (requiresAdmin && profile && !profile.is_admin) {
          console.log('Admin check failed:', {
            requiresAdmin,
            profile,
            is_admin: profile?.is_admin,
          });
          navigate('/auth?reason=not_admin');
        }
      } else if (!loading && !user) {
        navigate('/auth');
      }
    };

    checkSession().catch((error) => {
      console.error('Session check failed:', error);
      navigate('/auth?reason=error');
    });
  }, [user, profile, loading, navigate, requiresAdmin]);

  // Show loading if auth is loading or session is being validated
  if (loading || (user && sessionValid === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user || !sessionValid) {
    return null;
  }

  // For admin routes, wait for profile to load
  if (requiresAdmin && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
