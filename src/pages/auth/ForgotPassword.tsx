import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from '@/lib/icons';
import { SEOHead } from '@/components/SEOHead';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    const { error } = await resetPassword(data.email);

    if (error) {
      setError('root', {
        type: 'manual',
        message: error.message,
      });
      setIsLoading(false);
      return;
    }

    setIsSubmitted(true);
    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <>
        <SEOHead
          title="Password Reset Sent - DankDeals"
          description="Password reset instructions have been sent to your email."
        />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
              <CardDescription className="text-center">
                We've sent password reset instructions to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  If you don't see the email, check your spam folder or try resending the
                  instructions.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                Send again
              </Button>
            </CardContent>
            <CardFooter>
              <Link
                to="/auth/login"
                className="text-sm text-primary hover:underline flex items-center justify-center w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Forgot Password - DankDeals"
        description="Reset your DankDeals account password."
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Forgot your password?</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
              {errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending instructions...
                  </>
                ) : (
                  'Send reset instructions'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Link
              to="/auth/login"
              className="text-sm text-primary hover:underline flex items-center justify-center w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
