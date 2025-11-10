import { useState, useEffect } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ReverseIcon } from "@/components/ReverseIcon";

const FollowingList = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const targetUserId = userId || session.user.id;

    // Get following
    const { data: followsData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", targetUserId);

    if (!followsData || followsData.length === 0) {
      setFollowing([]);
      setLoading(false);
      return;
    }

    const followingIds = followsData.map(f => f.following_id);

    // Fetch following profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", followingIds);

    setFollowing(profiles || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ReverseIcon className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter text-gradient">REVRS</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : following.length > 0 ? (
          <div className="space-y-2">
            {following.map((user) => (
              <Card
                key={user.id}
                onClick={() => navigate(`/user/${user.id}`)}
                className="p-3 border-border hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.display_name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{user.display_name}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-border bg-muted/30">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-medium">Not following anyone yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start following people to see them here
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default FollowingList;
