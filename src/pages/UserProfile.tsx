import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Star, UserPlus, UserCheck, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { ReverseIcon } from "@/components/ReverseIcon";

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFriend, setIsFriend] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    avatar: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      if (userId) {
        await fetchUserProfile(userId);
        await fetchUserItems(userId);
        await checkFollowStatus(session.user.id, userId);
        await fetchFollowCounts(userId);
      }
    });
  }, [navigate, userId]);

  const fetchUserProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (!error && data) {
      setProfileData({
        name: data.display_name || "User",
        bio: data.bio || "",
        location: data.location || "",
        avatar: data.avatar_url || ""
      });
    }
  };

  const fetchUserItems = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", uid)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUserListings(data);
    }
    setLoading(false);
  };

  const checkFollowStatus = async (currentUid: string, targetUid: string) => {
    const { data: following } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUid)
      .eq("following_id", targetUid)
      .maybeSingle();

    setIsFollowing(!!following);

    // Check if they're friends (mutual follow)
    const { data: followsBack } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", targetUid)
      .eq("following_id", currentUid)
      .maybeSingle();

    setIsFriend(!!following && !!followsBack);
  };

  const fetchFollowCounts = async (uid: string) => {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", uid);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", uid);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !userId) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw error;

        setIsFollowing(false);
        setIsFriend(false);
        setFollowersCount(prev => prev - 1);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profileData.name}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUserId,
            following_id: userId
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        
        // Check if now friends
        const { data: followsBack } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", userId)
          .eq("following_id", currentUserId)
          .maybeSingle();

        if (followsBack) {
          setIsFriend(true);
          toast({
            title: "You're now friends!",
            description: `You and ${profileData.name} are now friends`,
          });
        } else {
          toast({
            title: "Following",
            description: `You're now following ${profileData.name}`,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ReverseIcon className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter text-gradient">REVERSE</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3">
        <Card className="p-4 mb-3 animate-fade-in border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary flex-shrink-0">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback>{profileData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{profileData.name}</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{profileData.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">4.9</span>
                </div>
              </div>
              
              <Button
                onClick={handleFollowToggle}
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                className="w-full sm:w-auto gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    {isFriend ? "Friends" : "Following"}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-foreground mt-3 line-clamp-3">{profileData.bio}</p>
          
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{userListings.length}</div>
              <div className="text-xs text-muted-foreground">Listings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{followersCount}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{followingCount}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
          </div>
        </Card>

        {/* Listings */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-semibold text-foreground mb-2">Listings</h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : userListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {userListings.map((item) => (
                <Card 
                  key={item.id} 
                  className="group overflow-hidden border-border hover:shadow-[var(--shadow-glow)] transition-all cursor-pointer"
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <h3 className="font-semibold text-xs text-foreground line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">${parseFloat(item.price)}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{item.condition}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center border-border">
              <p className="text-sm text-muted-foreground">No listings yet</p>
            </Card>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default UserProfile;
