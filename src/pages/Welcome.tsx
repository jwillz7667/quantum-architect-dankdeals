/**
 * Welcome Page
 *
 * Displayed after successful login to greet the user
 * before redirecting them to the home page
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { useProfile } from '@/hooks/useProfile';

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [countdown, setCountdown] = useState(3);

  // Get redirect destination from location state or default to home
  const redirectTo = (location.state as { redirectTo?: string })?.redirectTo || '/';

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectTo, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, redirectTo]);

  const handleContinue = () => {
    navigate(redirectTo, { replace: true });
  };

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <>
      <SEOHead
        title="Welcome Back - DankDeals MN"
        description="Successfully signed in to DankDeals"
        url="https://dankdealsmn.com/welcome"
      />

      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/20 p-3 animate-in zoom-in duration-300 delay-100">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
            <p className="text-muted-foreground">You've successfully signed in to your account</p>
          </div>

          {/* Redirect Info */}
          <div className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the store in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>

            <Button onClick={handleContinue} className="w-full group" size="lg">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/profile', { replace: true })}
              className="w-full"
            >
              Go to My Account
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
