import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield } from '@/lib/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setCookie, getCookie } from '@/lib/cookies';

const AGE_GATE_KEY = 'dankdeals_age_verified';
const AGE_GATE_EXPIRY_DAYS = 30;

export function AgeGate() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has already verified age
    const checkAgeVerification = () => {
      try {
        const verified = getCookie(AGE_GATE_KEY);

        if (verified === 'true') {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error('Error checking age verification:', error);
        setIsVerified(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAgeVerification();
  }, []);

  const handleVerification = (isOfAge: boolean) => {
    if (isOfAge) {
      // Set secure cookie with proper flags
      setCookie(AGE_GATE_KEY, 'true', AGE_GATE_EXPIRY_DAYS, {
        secure: true,
        sameSite: 'strict',
      });
      setIsVerified(true);
    } else {
      // Redirect to Google
      window.location.href = 'https://www.google.com';
    }
  };

  // Don't render anything while checking
  if (isChecking || isVerified) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <Card className="w-full max-w-lg mx-4 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Age Verification Required</CardTitle>
          <p className="text-muted-foreground mt-2">
            You must be 21 years or older to access this website
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm">
              <strong className="block text-amber-900 mb-1">Minnesota Legal Notice:</strong>
              <span className="text-amber-800">
                Cannabis products have not been analyzed or approved by the FDA. There may be health
                risks associated with consumption of these products. Keep out of reach of children
                and pets. For use only by adults 21 years of age and older.
              </span>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              By entering this site, you agree to our Terms of Service and acknowledge that:
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Cannabis products are for adults 21+ only</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You will not redistribute products to minors</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Valid government-issued ID is required for all deliveries</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  All sales are final - <strong>CASH DUE ON DELIVERY</strong>
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={() => handleVerification(true)} className="w-full" size="lg">
              I am 21 or older - Enter Site
            </Button>
            <Button
              onClick={() => handleVerification(false)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              I am under 21 - Exit
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            We use cookies to remember your age verification for 30 days. By clicking "I am 21 or
            older", you consent to the use of cookies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
