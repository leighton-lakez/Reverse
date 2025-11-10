import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { profileSchema } from "@/lib/validationSchemas";
import { getUserFriendlyError } from "@/lib/errorHandler";

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Check if profile is already complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, location")
        .eq("id", session.user.id)
        .single();

      if (profile?.display_name && profile?.location) {
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;
    
    setLoading(true);

    try {
      // Validate profile data
      const validationResult = profileSchema.safeParse({
        display_name: displayName,
        location,
        bio,
      });

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

      const { error } = await supabase
        .from("profiles")
        .update(validationResult.data)
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile complete!",
        description: "Welcome to REVRS.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-gradient mb-3 sm:mb-4">
            Complete Your Profile
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Tell us a bit about yourself to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 glass p-6 sm:p-8 rounded-2xl shadow-glow">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full h-11 sm:h-12 text-sm sm:text-base gradient-primary shadow-glow hover:shadow-glow-secondary transition-all" disabled={loading}>
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
}
