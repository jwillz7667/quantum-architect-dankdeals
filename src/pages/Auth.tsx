import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { IDVerification } from "@/components/IDVerification";
import { useAuth } from "@/hooks/useAuth";
import { signInSchema, signUpSchema, type SignInForm, type SignUpForm } from "@/lib/validation";
import { Eye, EyeOff, AlertTriangle, Shield } from "lucide-react";

export default function Auth() {
  const [activeTab, setActiveTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ lockedUntil?: number } | null>(null);
  const [showIDVerification, setShowIDVerification] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);
  const [verifiedDateOfBirth, setVerifiedDateOfBirth] = useState<string | null>(null);
  
  const { signIn, signUp, user, loading, csrfToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Form validation
  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" }
  });
  
  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" }
  });

  // Check for session timeout or other auth reasons
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'inactive') {
      setAuthError('Your session expired due to inactivity. Please sign in again.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (data: SignInForm) => {
    setAuthError(null);
    setRateLimitInfo(null);
    
    const result = await signIn(data.email, data.password);
    
    if (result.rateLimited) {
      setRateLimitInfo({ lockedUntil: result.lockedUntil });
    }
    
    if (result.error && !result.rateLimited) {
      setAuthError(result.error.message);
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    setAuthError(null);
    setRateLimitInfo(null);
    
    // For signup, we'll first show ID verification
    setShowIDVerification(true);
  };

  const handleVerificationComplete = (isVerified: boolean, dateOfBirth?: string) => {
    if (isVerified && dateOfBirth) {
      setVerificationCompleted(true);
      setVerifiedDateOfBirth(dateOfBirth);
      setShowIDVerification(false);
      // Proceed with actual signup
      proceedWithSignup();
    } else {
      setAuthError("ID verification failed. You must be 21+ to create an account.");
      setShowIDVerification(false);
    }
  };

  const proceedWithSignup = async () => {
    const data = signUpForm.getValues();
    const result = await signUp(data.email, data.password, data.firstName, data.lastName);
    
    if (result.rateLimited) {
      setRateLimitInfo({ lockedUntil: result.lockedUntil });
    }
    
    if (result.error && !result.rateLimited) {
      setAuthError(result.error.message);
    }
  };

  const handleSkipVerification = () => {
    setShowIDVerification(false);
    setAuthError("ID verification is required to create an account for cannabis delivery.");
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopHeader />
      <MobileHeader title="Account" showMenu={false} />

      <div className="max-w-md mx-auto px-4 md:px-6 pt-6 md:pt-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Welcome to DankDeals
            </h2>
          </div>
          <p className="text-muted-foreground">
            Premium cannabis delivery in Minnesota
          </p>
        </div>

        {/* Security alerts */}
        {authError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
        
        {rateLimitInfo?.lockedUntil && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account temporarily locked due to too many failed attempts. 
              Try again after {new Date(rateLimitInfo.lockedUntil).toLocaleTimeString()}.
            </AlertDescription>
          </Alert>
        )}

        {showIDVerification ? (
          <IDVerification 
            onVerificationComplete={handleVerificationComplete}
            onSkip={handleSkipVerification}
          />
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <input type="hidden" name="csrf_token" value={csrfToken} />
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      {...signInForm.register("email")}
                      className={signInForm.formState.errors.email ? "border-destructive" : ""}
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        {...signInForm.register("password")}
                        className={signInForm.formState.errors.password ? "border-destructive pr-10" : "pr-10"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12" 
                    disabled={loading || signInForm.formState.isSubmitting}
                  >
                    {loading || signInForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join DankDeals to start shopping premium cannabis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <input type="hidden" name="csrf_token" value={csrfToken} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="John"
                        {...signUpForm.register("firstName")}
                        className={signUpForm.formState.errors.firstName ? "border-destructive" : ""}
                      />
                      {signUpForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">{signUpForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Doe"
                        {...signUpForm.register("lastName")}
                        className={signUpForm.formState.errors.lastName ? "border-destructive" : ""}
                      />
                      {signUpForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">{signUpForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      {...signUpForm.register("email")}
                      className={signUpForm.formState.errors.email ? "border-destructive" : ""}
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        {...signUpForm.register("password")}
                        className={signUpForm.formState.errors.password ? "border-destructive pr-10" : "pr-10"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        {...signUpForm.register("confirmPassword")}
                        className={signUpForm.formState.errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium mb-1">Password requirements:</p>
                      <ul className="space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Contains uppercase and lowercase letters</li>
                        <li>• Contains at least one number</li>
                        <li>• Contains at least one special character</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our terms and confirm you are 21+ years old.
                  </p>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12"
                    disabled={loading || signUpForm.formState.isSubmitting}
                  >
                    {loading || signUpForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}