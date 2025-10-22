import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { emailOtpSchema } from "@/lib/validationSchemas";
import { X, Mail, CheckCircle } from "lucide-react";
import { ReverseIcon } from "@/components/ReverseIcon";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
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

      setLinkSent(true);
      toast({
        title: "Check Your Email!",
        description: "We've sent you a sign-in link.",
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
            {linkSent ? "Check your email" : "Sign in to continue"}
          </p>
        </div>

        {!linkSent ? (
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
                We'll send you a secure link to sign in.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-sm sm:text-base gradient-primary shadow-glow hover:shadow-glow-secondary transition-all"
              disabled={loading}
            >
              {loading ? "Sending..." : "Continue with Email"}
            </Button>
          </form>
        ) : (
          <div className="glass p-6 sm:p-8 rounded-2xl shadow-glow space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Check Your Inbox</h3>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to
              </p>
              <p className="text-sm font-semibold text-foreground">{email}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Click the button in the email</p>
                  <p className="text-xs text-muted-foreground">Look for "Log In" button in your inbox</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">You'll be signed in automatically</p>
                  <p className="text-xs text-muted-foreground">The link is valid for 60 minutes</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setLinkSent(false);
                  setEmail("");
                }}
                className="text-sm text-primary hover:underline"
              >
                Use a different email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
