import { useState, useEffect } from "react";
import { Settings, MapPin, Calendar, Star, Package, Edit2, Eye, MessageCircle, CheckCircle, MoreVertical, RotateCcw, Upload, X, Plus } from "lucide-react";
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
import CreateStory from "@/components/CreateStory";
import StoryViewer from "@/components/StoryViewer";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [myStories, setMyStories] = useState<any[]>([]);
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
        await fetchMyStories(session.user.id);
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
      console.log('Marking item as sold:', itemId);
      const { error } = await supabase
        .from("items")
        .update({ status: "sold" })
        .eq("id", itemId);

      if (error) {
        console.error('Mark as sold error:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
        });
        throw error;
      }

      toast({
        title: "Marked as Sold",
        description: "Your listing has been marked as sold.",
      });

      // Refresh listings
      if (user?.id) {
        await fetchUserItems(user.id);
      }
    } catch (error: any) {
      console.error('Caught error:', error);
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  const handleReviveListing = async (itemId: string) => {
    try {
      console.log('Reviving listing:', itemId);
      const { error } = await supabase
        .from("items")
        .update({ status: "available" })
        .eq("id", itemId);

      if (error) {
        console.error('Revive listing error:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
        });
        throw error;
      }

      toast({
        title: "Listing Revived",
        description: "Your listing is now active again.",
      });

      // Refresh listings
      if (user?.id) {
        await fetchUserItems(user.id);
      }
    } catch (error: any) {
      console.error('Caught error:', error);
      toast({
        title: "Error Marking as Sold",
        description: error?.message || error?.details || getUserFriendlyError(error),
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

  const fetchMyStories = async (userId: string) => {
    const { data: storiesData, error: storiesError } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return;
    }

    // Fetch profile data separately
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();

    // Combine stories with profile data
    const storiesWithProfile = (storiesData || []).map(story => ({
      ...story,
      profiles: profileData
    }));

    console.log('Fetched stories:', storiesWithProfile);
    setMyStories(storiesWithProfile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;

    try {
      let avatarUrl = profileData.avatar;

      // Upload new profile picture if selected
      if (selectedFile) {
        const uploadedUrl = await uploadProfilePicture(selectedFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Validate profile data
      const validationResult = profileSchema.safeParse({
        display_name: name,
        location: editLocation,
        bio,
        avatar_url: avatarUrl,
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
        avatar: avatarUrl
      });

      // Reset file selection
      setSelectedFile(null);
      setPreviewUrl("");

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

  const activeListings = myListings.filter((item: any) => item.status === 'available');
  const soldListings = myListings.filter((item: any) => item.status === 'sold');

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
            <div className="relative flex-shrink-0">
              {/* Avatar with story ring */}
              <div
                className={`cursor-pointer ${
                  myStories.length > 0
                    ? 'p-0.5 rounded-full bg-gradient-to-tr from-primary via-yellow-500 to-primary'
                    : ''
                }`}
                onClick={() => {
                  if (myStories.length > 0) {
                    setStoryViewerOpen(true);
                  }
                }}
              >
                <Avatar className={`h-16 w-16 ${myStories.length > 0 ? 'border-2 border-background' : 'border-2 border-primary'}`}>
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback>{profileData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              </div>

              {/* Create story button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateStoryOpen(true);
                }}
                className="absolute bottom-0 right-0 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md hover:scale-105 transition-transform"
              >
                <Plus className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
            
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
                      {/* Profile Picture Upload */}
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src={previewUrl || profileData.avatar} />
                            <AvatarFallback>{profileData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="relative overflow-hidden"
                                disabled={uploading}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploading ? "Uploading..." : "Upload Photo"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileSelect}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  disabled={uploading}
                                />
                              </Button>
                              {(previewUrl || selectedFile) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRemoveImage}
                                  disabled={uploading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG or GIF. Max 5MB.
                            </p>
                          </div>
                        </div>
                      </div>

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
                            variant="ghost"
                            className="absolute top-1 left-1 h-7 w-7 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => navigate("/item-detail", { state: { item } })}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Listing
                          </DropdownMenuItem>
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
                    className="group overflow-hidden border-border opacity-75 hover:opacity-90 transition-opacity"
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-1 left-1 h-7 w-7 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleReviveListing(item.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Revive Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/edit-listing/${item.id}`)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Listing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Story Dialogs */}
      <CreateStory
        open={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
        onStoryCreated={() => {
          if (user?.id) {
            fetchMyStories(user.id);
          }
        }}
      />

      {myStories.length > 0 && (
        <StoryViewer
          open={storyViewerOpen}
          onOpenChange={setStoryViewerOpen}
          userId={user?.id || ''}
          stories={myStories}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
