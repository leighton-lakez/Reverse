import { useState, useEffect } from "react";
import { Settings, MapPin, Calendar, Star, Package, Edit2, Eye, MessageCircle, CheckCircle, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { profileSchema } from "@/lib/validationSchemas";
import { ReverseIcon } from "@/components/ReverseIcon";

const myListings = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop",
    title: "Gucci Leather Handbag",
    price: 1299,
    condition: "Like New",
    status: "Active"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=800&auto=format&fit=crop",
    title: "Prada Sunglasses",
    price: 320,
    condition: "Good",
    status: "Active"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1599003254870-59d164d408ba?w=800&auto=format&fit=crop",
    title: "Versace Silk Scarf",
    price: 180,
    condition: "Like New",
    status: "Sold"
  }
];

const Profile = () => {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLocation, setEditLocation] = useState("");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    avatar: ""
  });

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view your profile",
        });
        navigate("/auth");
      } else {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
        await fetchUserItems(session.user.id);
        await fetchFollowCounts(session.user.id);
      }
    });
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfileData({
        name: data.display_name || "User",
        bio: data.bio || "",
        location: data.location || "",
        avatar: data.avatar_url || ""
      });
      setEditLocation(data.location || "");
    }
  };

  const fetchUserItems = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch conversation counts for each item
      const itemsWithStats = await Promise.all(
        data.map(async (item) => {
          // Count unique conversations (distinct senders) for this item
          const { data: messages } = await supabase
            .from("messages")
            .select("sender_id")
            .eq("item_id", item.id)
            .eq("receiver_id", userId);

          const uniqueSenders = new Set(messages?.map(m => m.sender_id) || []);
          const conversationCount = uniqueSenders.size;

          return {
            ...item,
            conversationCount,
            viewCount: 0 // Placeholder for views (not tracked yet)
          };
        })
      );

      setMyListings(itemsWithStats);
    }
    setLoading(false);
  };

  const handleMarkAsSold = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("items")
        .update({ status: "sold" })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Marked as Sold",
        description: "Your listing has been marked as sold.",
      });

      // Refresh listings
      if (user?.id) {
        await fetchUserItems(user.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  const fetchFollowCounts = async (userId: string) => {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;

    try {
      // Validate profile data
      const validationResult = profileSchema.safeParse({
        display_name: name,
        location: editLocation,
        bio,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(validationResult.data)
        .eq("id", user.id);

      if (error) throw error;

      setProfileData({
        name: validationResult.data.display_name,
        bio: validationResult.data.bio || "",
        location: validationResult.data.location,
        avatar: profileData.avatar
      });
      
      setIsEditOpen(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  const activeListings = myListings;
  const soldListings: any[] = [];

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-7 h-7" />
              <h1 className="text-lg font-black tracking-tighter text-gradient">REVERSE</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3">
        {/* Profile Header */}
        <Card className="p-4 mb-3 animate-fade-in border-border">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary flex-shrink-0">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback>{profileData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">{profileData.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{profileData.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="font-semibold text-foreground">4.9</span>
                    </div>
                  </div>
                </div>
                
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
                      <Edit2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={profileData.name}
                          className="bg-muted border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          defaultValue={profileData.bio}
                          rows={3}
                          className="bg-muted border-border resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <LocationAutocomplete
                          value={editLocation}
                          onChange={setEditLocation}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Save Changes
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-foreground mt-2 line-clamp-2">{profileData.bio}</p>
          
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{myListings.length}</div>
              <div className="text-xs text-muted-foreground">Listings</div>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate("/followers")}
            >
              <div className="text-lg font-bold text-foreground">{followersCount}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate("/following")}
            >
              <div className="text-lg font-bold text-foreground">{followingCount}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
          </div>
        </Card>

        {/* Listings Tabs */}
        <Tabs defaultValue="active" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
            <TabsTrigger value="sold" className="text-sm">Sold</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : activeListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {activeListings.map((item) => (
                  <Card
                    key={item.id}
                    className="group overflow-hidden border-border hover:shadow-[var(--shadow-glow)] transition-all"
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
                      <Badge className="absolute top-1 right-1 text-xs bg-primary text-primary-foreground">
                        Active
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute top-1 left-1 h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => navigate(`/edit-listing/${item.id}`)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkAsSold(item.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Sold
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="p-2 space-y-1">
                      <h3 className="font-semibold text-xs text-foreground line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">${parseFloat(item.price)}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{item.condition}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                          <Eye className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-primary">{item.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                          <MessageCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-primary">{item.conversationCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active listings</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sold">
            {soldListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {soldListings.map((item) => (
                  <Card 
                    key={item.id} 
                    className="overflow-hidden border-border opacity-75 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => navigate(`/edit-listing/${item.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                        alt={item.title}
                        className="h-full w-full object-cover grayscale"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                        }}
                      />
                      <Badge className="absolute top-1 right-1 text-xs bg-secondary text-secondary-foreground">
                        Sold
                      </Badge>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <h3 className="font-semibold text-xs text-foreground line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">${parseFloat(item.price)}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{item.condition}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sold items yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Profile;
