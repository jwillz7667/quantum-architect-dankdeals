import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { validateSession } from '@/lib/security';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!loading && user) {
        const isValid = await validateSession();
        setSessionValid(isValid);

        if (!isValid) {
          navigate('/auth?reason=session_invalid');
        }
      } else if (!loading && !user) {
        navigate('/auth');
      }
    };

    checkSession();
  }, [user, loading, navigate]);

  if (loading || sessionValid === null) {
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

  return <>{children}</>;
};
