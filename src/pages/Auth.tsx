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

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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
      if (session && event === 'SIGNED_IN') {
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
        const { error } = await supabase.auth.signUp({
          email: validationResult.data.email,
          password: validationResult.data.password,
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Account created successfully.",
        });
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
              REVERSE
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
            <Label htmlFor="password">Password</Label>
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
    </div>
  );
}
