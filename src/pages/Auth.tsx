import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { authSchema } from "@/lib/validationSchemas";
import { X } from "lucide-react";
import { ReverseIcon } from "@/components/ReverseIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore PASSWORD_RECOVERY events - let the reset password page handle those
      if (event === 'PASSWORD_RECOVERY') {
        return;
      }

      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        // Check if profile exists
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (!profile || !profile.display_name) {
              navigate("/profile-setup");
            } else {
              navigate("/");
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email and password
      const validationResult = authSchema.safeParse({ email, password });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: validationResult.data.email,
          password: validationResult.data.password,
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Account created successfully.",
        });

        // Check if profile exists and redirect
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!profile || !profile.display_name) {
            navigate("/profile-setup");
          } else {
            navigate("/");
          }
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: validationResult.data.email,
          password: validationResult.data.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      toast({
        title: "Error",
        description: error?.message || getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      // Validate email
      const emailValidation = authSchema.shape.email.safeParse(resetEmail);

      if (!emailValidation.success) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        setResetLoading(false);
        return;
      }

      // Call Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check Your Email",
        description: "We've sent you a password reset link. Please check your inbox.",
      });

      // Close dialog and clear form
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center px-4 sm:px-6 relative">
      {/* Skip button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 hover:bg-primary/10 transition-all h-10 w-10"
        title="Browse without signing in"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <ReverseIcon className="w-12 h-12 sm:w-16 sm:h-16" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-gradient">
              REVRS
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 sm:space-y-6 glass p-6 sm:p-8 rounded-2xl shadow-glow">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-xs sm:text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-base"
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-sm sm:text-base gradient-primary shadow-glow hover:shadow-glow-secondary transition-all"
            disabled={loading}
          >
            {loading ? (isSignUp ? "Creating Account..." : "Signing In...") : (isSignUp ? "Sign Up" : "Sign In")}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary"
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
