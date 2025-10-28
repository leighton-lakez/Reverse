import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { authSchema } from "@/lib/validationSchemas";
import { ReverseIcon } from "@/components/ReverseIcon";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidRecovery, setIsValidRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      setIsValidRecovery(true);
      return; // Don't set up subscription if we already know this is a recovery
    }

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password
      const validation = authSchema.shape.password.safeParse(password);

      if (!validation.success) {
        toast({
          title: "Invalid Password",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please ensure both passwords are identical.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset.",
      });

      // Redirect to home
      setTimeout(() => navigate("/"), 1500);
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidRecovery) {
    return (
      <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-muted-foreground mb-4">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate("/auth")}>
            Return to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <ReverseIcon className="w-12 h-12 sm:w-16 sm:h-16" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-gradient">
              REVERSE
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Choose a new password
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6 glass p-6 sm:p-8 rounded-2xl shadow-glow">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-sm sm:text-base gradient-primary shadow-glow hover:shadow-glow-secondary transition-all"
            disabled={loading}
          >
            {loading ? "Updating Password..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-sm text-primary hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
