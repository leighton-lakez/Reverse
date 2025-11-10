import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Package, Users, Search, UserPlus, UserCheck, Heart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import StoryViewer from "@/components/StoryViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ReverseIcon } from "@/components/ReverseIcon";

// Stories Section Component
const StoriesSection = ({ currentUserId }: { currentUserId: string }) => {
  const [storiesWithUsers, setStoriesWithUsers] = useState<any[]>([]);
  const [selectedUserStories, setSelectedUserStories] = useState<any[]>([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      fetchFriendStories();
    }
  }, [currentUserId]);

  const fetchFriendStories = async () => {
    // Get users that current user follows
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (!following || following.length === 0) {
      setStoriesWithUsers([]);
      return;
    }

    const followingIds = following.map(f => f.following_id);

    // Fetch stories from people you follow
    const { data: stories } = await supabase
      .from("stories")
      .select(`
        *,
        profiles!stories_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .in("user_id", followingIds)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories) {
      setStoriesWithUsers([]);
      return;
    }

    // Filter out soft-deleted stories if the column exists
    const activeStories = stories.filter((story: any) => !story.deleted_at);

    // Group stories by user
    const groupedByUser = activeStories.reduce((acc: any, story: any) => {
      const userId = story.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          profile: story.profiles,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    setStoriesWithUsers(Object.values(groupedByUser));
  };

  const handleStoryClick = (userStories: any) => {
    setSelectedUserStories(userStories.stories);
    setStoryViewerOpen(true);
  };

  if (storiesWithUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          Stories
          <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {storiesWithUsers.map((userStory) => (
            <button
              key={userStory.userId}
              onClick={() => handleStoryClick(userStory)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className="relative">
                <div className="p-1 rounded-full bg-gradient-to-tr from-primary via-yellow-400 to-primary shadow-lg group-hover:shadow-primary/30 transition-all story-pulse">
                  <Avatar className="h-20 w-20 border-[3px] border-background ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage src={userStory.profile?.avatar_url} />
                    <AvatarFallback className="text-lg font-bold">
                      {userStory.profile?.display_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-background shadow-md">
                  {userStory.stories.length}
                </div>
              </div>
              <span className="text-sm text-foreground font-semibold max-w-[80px] truncate group-hover:text-primary transition-colors">
                {userStory.profile?.display_name || 'User'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedUserStories.length > 0 && (
        <StoryViewer
          open={storyViewerOpen}
          onOpenChange={setStoryViewerOpen}
          userId={selectedUserStories[0]?.user_id || ''}
          stories={selectedUserStories}
        />
      )}
    </>
  );
};

// Favorites Section Component
const FavoritesSection = ({ currentUserId }: { currentUserId: string }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      fetchFavorites();
    }
  }, [currentUserId]);

  const fetchFavorites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        item_id,
        created_at,
        items:item_id (
          id,
          title,
          brand,
          price,
          condition,
          location,
          images,
          user_id,
          description,
          category
        )
      `)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFavorites(data as any);
    }
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string, itemTitle: string) => {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (!error) {
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
      toast({
        title: "Removed",
        description: `${itemTitle} removed from favorites`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (item: any) => {
    navigate("/item-detail", { state: { item } });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">No favorites yet</h3>
        <p className="text-muted-foreground mb-6">
          Start browsing and tap the heart icon to save items you like
        </p>
        <Button onClick={() => navigate("/")}>
          Browse Items
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {favorites.map((favorite) => {
        const item = favorite.items;
        if (!item) return null;

        return (
          <Card
            key={favorite.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
          >
            <div onClick={() => handleItemClick(item)}>
              {/* Image */}
              <div className="relative aspect-square bg-muted">
                {item.images && item.images.length > 0 && (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                  {item.title}
                </h3>
                <p className="text-2xl font-bold text-primary mb-2">
                  ${item.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>{item.brand}</span>
                  <span>•</span>
                  <span>{item.condition}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.location}</p>
              </div>
            </div>

            {/* Remove Button */}
            <div className="px-4 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(favorite.id, item.title);
                }}
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Favorites
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Friends Section Component
const FriendsSection = ({ currentUserId }: { currentUserId: string }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchFriends = async () => {
    // Get all users that current user follows (not just mutual follows)
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (!following || following.length === 0) {
      setFriends([]);
      setFollowingIds(new Set());
      return;
    }

    const followingIdsList = following.map(f => f.following_id);
    setFollowingIds(new Set(followingIdsList));

    // Fetch profiles of all people you follow
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", followingIdsList);

    setFriends(profiles || []);
  };

  const searchUsers = async () => {
    setIsSearching(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .ilike("display_name", `%${searchQuery}%`)
      .neq("id", currentUserId)
      .limit(10);

    setSearchResults(profiles || []);
    setIsSearching(false);
  };

  const toggleFollow = async (userId: string) => {
    const isFollowing = followingIds.has(userId);

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      if (!error) {
        const newFollowingIds = new Set(followingIds);
        newFollowingIds.delete(userId);
        setFollowingIds(newFollowingIds);
        fetchFriends();
        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user",
        });
      }
    } else {
      // Follow
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: currentUserId,
          following_id: userId
        });

      if (!error) {
        const newFollowingIds = new Set(followingIds);
        newFollowingIds.add(userId);
        setFollowingIds(newFollowingIds);
        fetchFriends();
        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Search Results</h3>
            {isSearching && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user.id}
                className="group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <div className="relative flex items-center gap-4">
                  <Avatar
                    className="h-14 w-14 border-2 border-background ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all cursor-pointer"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-lg font-bold">{user.display_name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    <p className="text-base font-bold text-foreground mb-1">{user.display_name}</p>
                    <div className="flex items-center gap-2">
                      {followingIds.has(user.id) ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-sm text-muted-foreground">Following</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not following</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(user.id);
                    }}
                    variant={followingIds.has(user.id) ? "outline" : "default"}
                    size="sm"
                    className={followingIds.has(user.id) ? "border-primary/50" : "bg-primary hover:bg-primary/90"}
                  >
                    {followingIds.has(user.id) ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : !isSearching ? (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-border/50">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Following List */}
      {!searchQuery.trim() && (
        <>
          {friends.length > 0 ? (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground pt-2">Following ({friends.length})</h3>
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => navigate(`/user/${friend.id}`)}
                    className="group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback className="text-lg font-bold">{friend.display_name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-foreground mb-1">{friend.display_name}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-sm text-muted-foreground">Following</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-border/50">
              <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                <Users className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <p className="text-base font-semibold text-foreground mb-2">Not Following Anyone</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Use the search above to find and follow users
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const [messageNotifications, setMessageNotifications] = useState<any[]>([]);
  const [listingCount, setListingCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loadingMessages, setLoadingMessages] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view notifications",
        });
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      fetchMessageNotifications(session.user.id);
      fetchListingStats(session.user.id);
    });

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.receiver_id === currentUserId && currentUserId) {
            fetchMessageNotifications(currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, currentUserId]);

  const fetchListingStats = async (userId: string) => {
    const { count } = await supabase
      .from("items")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);
    
    setListingCount(count || 0);
  };

  const fetchMessageNotifications = async (userId: string) => {
    setLoadingMessages(true);
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false });

    if (error || !messages) {
      setLoadingMessages(false);
      return;
    }

    // Group messages by sender
    const groupedBySender = messages.reduce((acc, msg) => {
      if (!acc[msg.sender_id]) {
        acc[msg.sender_id] = {
          messages: [],
          unreadCount: 0,
          latestMessage: msg,
        };
      }
      acc[msg.sender_id].messages.push(msg);
      if (!msg.read) {
        acc[msg.sender_id].unreadCount++;
      }
      // Keep the most recent message
      if (new Date(msg.created_at) > new Date(acc[msg.sender_id].latestMessage.created_at)) {
        acc[msg.sender_id].latestMessage = msg;
      }
      return acc;
    }, {} as Record<string, { messages: any[]; unreadCount: number; latestMessage: any }>);

    // Fetch sender profiles
    const senderIds = Object.keys(groupedBySender);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", senderIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Create notifications array with grouped data
    const notifications = senderIds.map(senderId => {
      const group = groupedBySender[senderId];
      const sender = profileMap.get(senderId);
      const latestMsg = group.latestMessage;
      
      return {
        id: senderId, // Use senderId as the unique key
        name: sender?.display_name || "User",
        avatar: sender?.avatar_url || "",
        message: latestMsg.content,
        messageCount: group.messages.length,
        unreadCount: group.unreadCount,
        timeAgo: getTimeAgo(new Date(latestMsg.created_at)),
        unread: group.unreadCount > 0,
        senderId: senderId
      };
    });

    // Sort by most recent message
    notifications.sort((a, b) => {
      const aTime = new Date(groupedBySender[a.senderId].latestMessage.created_at).getTime();
      const bTime = new Date(groupedBySender[b.senderId].latestMessage.created_at).getTime();
      return bTime - aTime;
    });

    setMessageNotifications(notifications);
    setLoadingMessages(false);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const unreadCount = messageNotifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-10 h-10" />
              <h1 className="text-2xl font-black tracking-tighter text-gradient">REVRS</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {unreadCount} New
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Your Activity Stats */}
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            Your Activity
            <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary">View All</span>
                </div>
                <p className="text-3xl font-black text-foreground mb-1">{listingCount}</p>
                <span className="text-sm font-medium text-muted-foreground">Active Listings</span>
              </div>
            </div>
            <div className="group relative overflow-hidden bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent rounded-2xl p-5 border border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg hover:shadow-secondary/20 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-secondary/10 rounded-xl">
                    <MessageCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <span className="text-xs font-medium text-secondary">View All</span>
                </div>
                <p className="text-3xl font-black text-foreground mb-1">{unreadCount}</p>
                <span className="text-sm font-medium text-muted-foreground">New Messages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="messages" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>

          {/* Stories Tab */}
          <TabsContent value="stories">
            <StoriesSection currentUserId={currentUserId} />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
          <div className="animate-fade-in">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            Messages
            <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
          </h2>
          {loadingMessages ? (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-border/50">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : messageNotifications.length > 0 ? (
            <div className="space-y-3">
              {messageNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => navigate("/chat", {
                    state: {
                      sellerId: notification.senderId
                    }
                  })}
                  className={`group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-xl p-2.5 border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                    notification.unread
                      ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-md shadow-primary/10'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  {notification.unread && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full opacity-50" />
                  )}
                  <div className="relative flex gap-2.5">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-primary/20">
                        <AvatarImage src={notification.avatar} />
                        <AvatarFallback className="text-xs font-bold">{notification.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {notification.unread && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-background animate-pulse">
                          {notification.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{notification.name}</span>
                          {notification.unread && (
                            <Badge variant="default" className="h-4 px-1.5 text-[10px] bg-primary text-primary-foreground shadow-sm">
                              New
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{notification.timeAgo}</span>
                      </div>
                      <p className="text-xs text-foreground/80 line-clamp-2 mb-1">{notification.message}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <MessageCircle className="h-3 w-3" />
                        <span>{notification.messageCount} {notification.messageCount === 1 ? 'message' : 'messages'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-border/50">
              <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <p className="text-base font-semibold text-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                When someone messages you about your listings, they'll appear here
              </p>
            </div>
          )}
        </div>

          </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <FavoritesSection currentUserId={currentUserId} />
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <FriendsSection currentUserId={currentUserId} />
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Notifications;