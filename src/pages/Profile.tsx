import { useState, useEffect } from "react";
import { Settings, MapPin, Calendar, Star, Package, Edit2, Eye, MessageCircle, CheckCircle, MoreVertical, RotateCcw, Upload, X, Plus, Trash2, Clock, Image as ImageIcon } from "lucide-react";
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
  const [pastStories, setPastStories] = useState<any[]>([]);
  const [manageStoriesOpen, setManageStoriesOpen] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [givenReviews, setGivenReviews] = useState<any[]>([]);
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
        await fetchUserRating(session.user.id);
        await fetchUserReviews(session.user.id);
        await fetchGivenReviews(session.user.id);
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

  const fetchUserRating = async (userId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewed_user_id", userId);

    if (error) {
      console.error('Error fetching reviews:', error);
      return;
    }

    if (data && data.length > 0) {
      const total = data.reduce((sum, review) => sum + review.rating, 0);
      const avg = total / data.length;
      setAverageRating(Number(avg.toFixed(1)));
      setReviewCount(data.length);
    } else {
      setAverageRating(null);
      setReviewCount(0);
    }
  };

  const fetchUserReviews = async (userId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles!reviews_reviewer_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq("reviewed_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return;
    }

    if (data) {
      setReviews(data);
    }
  };

  const fetchGivenReviews = async (userId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles!reviews_reviewed_user_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq("reviewer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching given reviews:', error);
      return;
    }

    if (data) {
      setGivenReviews(data);
    }
  };

  const fetchMyStories = async (userId: string) => {
    // Fetch active stories (not expired)
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

    // Filter active stories (exclude deleted ones if deleted_at column exists)
    const activeStories = (storiesData || []).filter(story => !story.deleted_at);

    // Fetch past stories (expired)
    const { data: pastStoriesData } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .lt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    // Combine with deleted stories if they exist in active query
    const deletedStories = (storiesData || []).filter(story => story.deleted_at);

    // Fetch profile data separately
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();

    // Combine active stories with profile data
    const activeStoriesWithProfile = activeStories.map(story => ({
      ...story,
      profiles: profileData
    }));

    // Combine past stories (expired + deleted) with profile data
    const allPastStories = [...(pastStoriesData || []), ...deletedStories];
    const pastStoriesWithProfile = allPastStories.map(story => ({
      ...story,
      profiles: profileData
    }));

    console.log('Fetched active stories:', activeStoriesWithProfile);
    console.log('Fetched past stories:', pastStoriesWithProfile);
    setMyStories(activeStoriesWithProfile);
    setPastStories(pastStoriesWithProfile);
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      // Try to soft delete first (if deleted_at column exists)
      const { error: updateError } = await supabase
        .from("stories")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", storyId);

      // If soft delete fails (column doesn't exist), do hard delete
      if (updateError) {
        const { error: deleteError } = await supabase
          .from("stories")
          .delete()
          .eq("id", storyId);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Story deleted",
        description: "Your story has been removed",
      });

      // Refresh stories
      if (user?.id) {
        await fetchMyStories(user.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 shadow-md">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-card/80 via-card/60 to-primary/5 backdrop-blur-sm rounded-3xl p-6 mb-6 animate-fade-in border border-border/50 shadow-lg">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl opacity-50" />

          <div className="relative">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0">
                {/* Avatar with modern story ring */}
                <div
                  className={`cursor-pointer transition-all duration-300 ${
                    myStories.length > 0
                      ? 'p-1 rounded-full bg-gradient-to-tr from-primary via-yellow-400 to-primary story-pulse shadow-xl shadow-primary/30'
                      : 'p-1 rounded-full bg-gradient-to-tr from-muted-foreground/20 to-muted-foreground/10'
                  }`}
                  onClick={() => {
                    if (myStories.length > 0) {
                      setStoryViewerOpen(true);
                    }
                  }}
                >
                  <Avatar className="h-24 w-24 border-4 border-background ring-4 ring-primary/20">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-2xl font-bold">{profileData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </div>
                {myStories.length > 0 && (
                  <div className="mt-2 text-center">
                    <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      {myStories.length} {myStories.length === 1 ? 'story' : 'stories'}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-black text-foreground truncate mb-2">{profileData.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{profileData.location}</span>
                      </div>
                      {averageRating !== null && reviewCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-bold text-foreground">{averageRating}</span>
                          <span className="text-muted-foreground">({reviewCount} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                      <Edit2 className="h-4 w-4" />
                      <span>Edit Profile</span>
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

            {profileData.bio && (
              <p className="text-base text-foreground/80 leading-relaxed line-clamp-3 mb-4">{profileData.bio}</p>
            )}

            {/* Story Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setCreateStoryOpen(true)}
                className="bg-gradient-to-r from-primary via-primary to-secondary hover:from-primary/90 hover:via-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="font-semibold">Create</span>
              </Button>
              <Button
                onClick={() => setManageStoriesOpen(true)}
                variant="outline"
                className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <ImageIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Manage</span>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="group text-center p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-default">
                <div className="text-3xl font-black text-foreground mb-1">{myListings.length}</div>
                <div className="text-sm font-medium text-muted-foreground">Listings</div>
              </div>
              <div
                className="group text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/10"
                onClick={() => navigate("/followers")}
              >
                <div className="text-3xl font-black text-foreground mb-1">{followersCount}</div>
                <div className="text-sm font-medium text-primary">Followers</div>
              </div>
              <div
                className="group text-center p-4 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10"
                onClick={() => navigate("/following")}
              >
                <div className="text-3xl font-black text-foreground mb-1">{followingCount}</div>
                <div className="text-sm font-medium text-secondary">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Tabs */}
        <Tabs defaultValue="active" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <TabsList className="grid w-full grid-cols-4 mb-6 p-1.5 bg-muted/50 backdrop-blur-sm rounded-2xl border border-border/50">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-xl transition-all text-xs sm:text-sm">
              Active
            </TabsTrigger>
            <TabsTrigger value="sold" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground font-semibold rounded-xl transition-all text-xs sm:text-sm">
              Sold
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-foreground data-[state=active]:text-background font-semibold rounded-xl transition-all text-xs sm:text-sm">
              Received ({reviewCount})
            </TabsTrigger>
            <TabsTrigger value="given" className="data-[state=active]:bg-foreground data-[state=active]:text-background font-semibold rounded-xl transition-all text-xs sm:text-sm">
              Given ({givenReviews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeListings.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                        }}
                      />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <Badge className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground shadow-md">
                        Active
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 left-2 h-8 w-8 bg-background/90 hover:bg-background backdrop-blur-sm shadow-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-sm">
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

                    <div className="p-3 space-y-2">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-primary">${parseFloat(item.price)}</span>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30">{item.condition}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1.5 rounded-lg flex-1">
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold text-primary">{item.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-secondary/10 px-2.5 py-1.5 rounded-lg flex-1">
                          <MessageCircle className="h-3.5 w-3.5 text-secondary" />
                          <span className="text-xs font-bold text-secondary">{item.conversationCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-20 text-center border border-border/50">
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                  <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
                <p className="text-base font-semibold text-foreground mb-2">No active listings</p>
                <p className="text-sm text-muted-foreground">Your active listings will appear here</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sold">
            {soldListings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {soldListings.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 opacity-80 hover:opacity-100 transition-all"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                        alt={item.title}
                        className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                        }}
                      />
                      <div className="absolute inset-0 bg-secondary/20" />
                      <Badge className="absolute top-2 right-2 text-xs bg-secondary text-secondary-foreground shadow-md">
                        Sold
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 left-2 h-8 w-8 bg-background/90 hover:bg-background backdrop-blur-sm shadow-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-sm">
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

                    <div className="p-3 space-y-2">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-foreground">${parseFloat(item.price)}</span>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-secondary/30">{item.condition}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-20 text-center border border-border/50">
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                  <CheckCircle className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
                <p className="text-base font-semibold text-foreground mb-2">No sold items yet</p>
                <p className="text-sm text-muted-foreground">Items you've sold will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4 border-border">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={review.profiles?.avatar_url} />
                        <AvatarFallback>
                          {review.profiles?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {review.profiles?.display_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-foreground">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">Reviews from other users will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="given">
            {givenReviews.length > 0 ? (
              <div className="space-y-3">
                {givenReviews.map((review) => (
                  <Card key={review.id} className="p-4 border-border">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={review.profiles?.avatar_url} />
                        <AvatarFallback>
                          {review.profiles?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Review for {review.profiles?.display_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-foreground">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No reviews given yet</p>
                <p className="text-sm text-muted-foreground mt-1">Reviews you give to other users will appear here</p>
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

      {/* Manage Stories Dialog */}
      <Dialog open={manageStoriesOpen} onOpenChange={setManageStoriesOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Stories</DialogTitle>
            <DialogDescription>
              View and delete your active stories. Past stories show only expired ones (deleted stories are permanently removed).
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active">Active ({myStories.length})</TabsTrigger>
              <TabsTrigger value="past">Expired ({pastStories.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {myStories.length > 0 ? (
                myStories.map((story) => (
                  <Card key={story.id} className="p-4 border-border">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {story.media_type === 'image' ? (
                          <img
                            src={story.media_url}
                            alt="Story"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={story.media_url}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {story.media_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(story.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(story.expires_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStory(story.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No active stories</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3">
              {pastStories.length > 0 ? (
                pastStories.map((story) => (
                  <Card key={story.id} className="p-4 border-border opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {story.media_type === 'image' ? (
                          <img
                            src={story.media_url}
                            alt="Story"
                            className="h-full w-full object-cover grayscale"
                          />
                        ) : (
                          <video
                            src={story.media_url}
                            className="h-full w-full object-cover grayscale"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            Expired
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(story.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expired: {new Date(story.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        24h
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No expired stories</p>
                  <p className="text-sm text-muted-foreground mt-2">Stories automatically expire after 24 hours</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
