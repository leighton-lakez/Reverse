import { useState, useEffect } from "react";
import { Settings, MapPin, Calendar, Star, Package, Edit2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

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
  const [profileData, setProfileData] = useState({
    name: "Alex Johnson",
    bio: "Designer fashion enthusiast 👗 Curating luxury finds from around the world",
    location: "New York, NY",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  });

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserItems(session.user.id);
      }
    });
  }, [navigate]);

  const fetchUserItems = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMyListings(data);
    }
    setLoading(false);
  };

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setProfileData({
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      location: formData.get("location") as string,
      avatar: profileData.avatar
    });
    setIsEditOpen(false);
    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
  };

  const activeListings = myListings;
  const soldListings: any[] = [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Profile</h1>
            <Button variant="ghost" size="icon" className="hover:bg-muted">
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
                        <Input
                          id="location"
                          name="location"
                          defaultValue={profileData.location}
                          className="bg-muted border-border"
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
          
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{myListings.length}</div>
              <div className="text-xs text-muted-foreground">Listings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">1</div>
              <div className="text-xs text-muted-foreground">Sold</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">23</div>
              <div className="text-xs text-muted-foreground">Followers</div>
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
                  <Card key={item.id} className="group overflow-hidden border-border hover:shadow-[var(--shadow-glow)] transition-all">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <Badge className="absolute top-1 right-1 text-xs bg-primary text-primary-foreground">
                        Active
                      </Badge>
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active listings</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sold">
            {soldListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {soldListings.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-border opacity-75">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                        alt={item.title}
                        className="h-full w-full object-cover grayscale"
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
