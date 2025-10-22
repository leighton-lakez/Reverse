import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { emailOtpSchema } from "@/lib/validationSchemas";
import { X } from "lucide-react";
import { ReverseIcon } from "@/components/ReverseIcon";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email
      const validationResult = emailOtpSchema.safeParse({ email });

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

      // Send magic link via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        email: validationResult.data.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Check Your Email!",
        description: "We've sent you a magic link to sign in.",
      });
    } catch (error: any) {
      console.error('Magic Link Error:', error);
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
            Sign in with your email
          </p>
        </div>

        <form onSubmit={handleSendMagicLink} className="space-y-5 sm:space-y-6 glass p-6 sm:p-8 rounded-2xl shadow-glow">
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
            <p className="text-xs text-muted-foreground">
              We'll send you a magic link to sign in.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-sm sm:text-base gradient-primary shadow-glow hover:shadow-glow-secondary transition-all"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
