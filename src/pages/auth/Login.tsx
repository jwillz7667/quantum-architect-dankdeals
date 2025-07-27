import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Lock } from '@/lib/icons';
import { SEOHead } from '@/components/SEOHead';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'apple' | 'facebook' | null>(
    null
  );
  const { signIn, signInWithGoogle, signInWithApple, signInWithFacebook } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      setError('root', {
        type: 'manual',
        message: error.message,
      });
      setIsLoading(false);
      return;
    }

    // Redirect to the page they tried to visit or home
    navigate(from, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading('google');
    const { error } = await signInWithGoogle();
    if (error) {
      setError('root', {
        type: 'manual',
        message: error.message,
      });
    }
    setIsOAuthLoading(null);
  };

  const handleAppleSignIn = async () => {
    setIsOAuthLoading('apple');
    const { error } = await signInWithApple();
    if (error) {
      setError('root', {
        type: 'manual',
        message: error.message,
      });
    }
    setIsOAuthLoading(null);
  };

  const handleFacebookSignIn = async () => {
    setIsOAuthLoading('facebook');
    const { error } = await signInWithFacebook();
    if (error) {
      setError('root', {
        type: 'manual',
        message: error.message,
      });
    }
    setIsOAuthLoading(null);
  };

  return (
    <>
      <SEOHead
        title="Login - DankDeals"
        description="Sign in to your DankDeals account to access your orders and manage your profile."
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handleGoogleSignIn()}
                disabled={isLoading || isOAuthLoading !== null}
              >
                {isOAuthLoading === 'google' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handleAppleSignIn()}
                disabled={isLoading || isOAuthLoading !== null}
              >
                {isOAuthLoading === 'apple' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Apple...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
                    </svg>
                    Continue with Apple
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handleFacebookSignIn()}
                disabled={isLoading || isOAuthLoading !== null}
              >
                {isOAuthLoading === 'facebook' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Facebook...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Continue with Facebook
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4 mt-6">
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register('password')}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div className="text-sm text-center text-gray-600">
              Or continue as{' '}
              <Link to="/" className="text-primary hover:underline font-medium">
                guest
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
