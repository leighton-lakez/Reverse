import { useState } from "react";
import { ArrowLeft, Settings, MapPin, Calendar, Star, Package, Edit2 } from "lucide-react";
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
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

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
  const [profileData, setProfileData] = useState({
    name: "Alex Johnson",
    bio: "Designer fashion enthusiast 👗 Curating luxury finds from around the world",
    location: "New York, NY",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  });

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
    toast.success("Profile updated successfully!");
  };

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {myListings.filter(item => item.status === "Active").map((item) => (
                <Card key={item.id} className="group overflow-hidden border-border hover:shadow-[var(--shadow-glow)] transition-all">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <Badge className="absolute top-1 right-1 text-xs bg-primary text-primary-foreground">
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <h3 className="font-semibold text-xs text-foreground line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">${item.price}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{item.condition}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="sold">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {myListings.filter(item => item.status === "Sold").map((item) => (
                <Card key={item.id} className="overflow-hidden border-border opacity-75">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image}
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
                      <span className="text-sm font-bold text-foreground">${item.price}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{item.condition}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Profile;
