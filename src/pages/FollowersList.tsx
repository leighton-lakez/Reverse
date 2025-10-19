import { useState, useEffect } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

const FollowersList = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const targetUserId = userId || session.user.id;

    // Get followers
    const { data: followsData } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", targetUserId);

    if (!followsData || followsData.length === 0) {
      setFollowers([]);
      setLoading(false);
      return;
    }

    const followerIds = followsData.map(f => f.follower_id);

    // Fetch follower profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", followerIds);

    setFollowers(profiles || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/profile");
                }
              }}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Followers</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : followers.length > 0 ? (
          <div className="space-y-2">
            {followers.map((follower) => (
              <Card
                key={follower.id}
                onClick={() => navigate(`/user/${follower.id}`)}
                className="p-3 border-border hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={follower.avatar_url} />
                    <AvatarFallback>
                      {follower.display_name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{follower.display_name}</p>
                    <p className="text-sm text-muted-foreground">Follower</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-border bg-muted/30">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-medium">No followers yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When people follow you, they'll appear here
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default FollowersList;
