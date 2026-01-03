import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Layers, CheckCircle2, RefreshCw, Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^[0-9+\-\s()]+$/, 'Please enter a valid mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  captcha: z.string().min(1, 'Please enter the captcha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score += 20;
  if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score <= 20) return { score, label: 'Weak', color: 'text-destructive' };
  if (score <= 40) return { score, label: 'Fair', color: 'text-warning' };
  if (score <= 60) return { score, label: 'Good', color: 'text-info' };
  if (score <= 80) return { score, label: 'Strong', color: 'text-success' };
  return { score, label: 'Very Strong', color: 'text-success' };
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('signin');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if this is a password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setShowPasswordReset(true);
    } else if (searchParams.get('reset') === 'true') {
      setShowPasswordReset(true);
    }
  }, [searchParams]);

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateCaptcha());
    setCaptcha('');
  }, []);

  const validateSignInForm = () => {
    try {
      signInSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateSignUpForm = () => {
    try {
      signUpSchema.parse({ fullName, email, mobileNumber, password, confirmPassword, captcha });
      if (captcha.toLowerCase() !== captchaCode.toLowerCase()) {
        setErrors({ captcha: 'Captcha does not match' });
        return false;
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignInForm()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : error.message,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in to SychDesk.',
      });
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUpForm()) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName, mobileNumber);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: error.message.includes('already registered') 
          ? 'This email is already registered. Please sign in instead.' 
          : error.message,
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Welcome to SychDesk. Redirecting to dashboard...',
      });
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email address.',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: error.message,
      });
    } else {
      setResetSent(true);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match.',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully updated.',
      });
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmNewPassword('');
      // Clear the URL hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const features = [
    'Meeting file organizer',
    'Deadline conflict detection',
    'AI submission validation',
    'Shared file change alerts',
    'Unified dashboard',
  ];

  const RequiredStar = () => <span className="text-destructive ml-1">*</span>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl animate-float stagger-2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-info rounded-full blur-3xl animate-pulse-subtle" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-sidebar-foreground">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-glow shine-effect">
              <Layers className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-4xl font-bold text-primary-foreground">SychDesk</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-primary-foreground animate-fade-in stagger-1">
            Your unified work & study management platform
          </h1>
          <p className="text-lg text-sidebar-foreground/80 mb-8 animate-fade-in stagger-2">
            Organize meetings, track deadlines, validate submissions, and stay on top of everything in one intelligent system.
          </p>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 animate-slide-in hover-lift p-2 rounded-lg transition-all cursor-default" 
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sidebar-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Layers className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">SychDesk</span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="transition-all">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card className="border-border/50 shadow-lg card-interactive">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email<RequiredStar /></Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password<RequiredStar /></Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => setForgotPasswordOpen(true)}
                    >
                      Forgot Password?
                    </Button>
                    <Button type="submit" className="w-full gradient-primary btn-ripple" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-border/50 shadow-lg card-interactive">
                <CardHeader>
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>
                    Get started with your personal workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name<RequiredStar /></Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={errors.fullName ? 'border-destructive' : ''}
                        required
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email<RequiredStar /></Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-mobile">Mobile Number<RequiredStar /></Label>
                      <Input
                        id="signup-mobile"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className={errors.mobileNumber ? 'border-destructive' : ''}
                        required
                      />
                      {errors.mobileNumber && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.mobileNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password<RequiredStar /></Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {password && (
                        <div className="space-y-1 animate-fade-in">
                          <Progress value={passwordStrength.score} className="h-2" />
                          <p className={`text-xs ${passwordStrength.color}`}>
                            Password strength: {passwordStrength.label}
                          </p>
                        </div>
                      )}
                      {errors.password && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password<RequiredStar /></Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-captcha">Captcha<RequiredStar /></Label>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 bg-muted rounded-md p-3 font-mono text-lg tracking-widest select-none text-center border-2 border-dashed">
                          {captchaCode}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={refreshCaptcha}
                          className="shrink-0"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        id="signup-captcha"
                        type="text"
                        placeholder="Enter captcha"
                        value={captcha}
                        onChange={(e) => setCaptcha(e.target.value)}
                        className={errors.captcha ? 'border-destructive' : ''}
                        required
                      />
                      {errors.captcha && (
                        <p className="text-sm text-destructive animate-fade-in">{errors.captcha}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full gradient-primary btn-ripple" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resetSent ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Mail className="w-5 h-5 text-primary" />}
              {resetSent ? 'Check your email' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription>
              {resetSent 
                ? 'We have sent a password reset link to your email address.'
                : 'Enter your email address and we will send you a link to reset your password.'}
            </DialogDescription>
          </DialogHeader>
          
          {!resetSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setForgotPasswordOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleForgotPassword} disabled={isLoading} className="flex-1 gradient-primary">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <p className="text-sm text-success">
                  A password reset link has been sent to <strong>{resetEmail}</strong>. 
                  Please check your inbox and spam folder.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setForgotPasswordOpen(false);
                  setResetSent(false);
                  setResetEmail('');
                }} 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog (after reset link click) */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Set New Password
            </DialogTitle>
            <DialogDescription>
              Enter your new password below to complete the reset process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-1 animate-fade-in">
                  <Progress value={getPasswordStrength(newPassword).score} className="h-2" />
                  <p className={`text-xs ${getPasswordStrength(newPassword).color}`}>
                    Password strength: {getPasswordStrength(newPassword).label}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              {confirmNewPassword && newPassword !== confirmNewPassword && (
                <p className="text-sm text-destructive animate-fade-in">Passwords do not match</p>
              )}
            </div>
            
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isLoading || !newPassword || newPassword !== confirmNewPassword} 
              className="w-full gradient-primary"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
