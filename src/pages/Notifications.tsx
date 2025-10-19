import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

const Notifications = () => {
  const navigate = useNavigate();
  const [messageNotifications, setMessageNotifications] = useState<any[]>([]);
  const [listingCount, setListingCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
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
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !messages) return;

    // Fetch sender profiles and items separately
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const itemIds = messages.map(m => m.item_id).filter(Boolean);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", senderIds);

    const { data: items } = await supabase
      .from("items")
      .select("id, title")
      .in("id", itemIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const itemMap = new Map(items?.map(i => [i.id, i]) || []);

    const notifications = messages.map(msg => {
      const sender = profileMap.get(msg.sender_id);
      const item = msg.item_id ? itemMap.get(msg.item_id) : null;
      
      return {
        id: msg.id,
        name: sender?.display_name || "User",
        avatar: sender?.avatar_url || "",
        message: msg.content,
        itemTitle: item?.title || "",
        timeAgo: getTimeAgo(new Date(msg.created_at)),
        unread: !msg.read,
        senderId: msg.sender_id
      };
    });
    
    setMessageNotifications(notifications);
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* Your Activity Stats */}
        <div className="animate-fade-in bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">Your Activity</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Active Listings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{listingCount}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">New Messages</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
            </div>
          </div>
        </div>

        {/* Message Notifications */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xs font-semibold text-muted-foreground mb-2">Messages</h2>
          {messageNotifications.length > 0 ? (
            <div className="space-y-1.5">
              {messageNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  onClick={() => navigate("/chat", { 
                    state: { 
                      sellerId: notification.senderId,
                      item: { title: notification.itemTitle }
                    } 
                  })}
                  className={`p-2.5 border-border hover:bg-muted/50 transition-all cursor-pointer ${
                    notification.unread ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={notification.avatar} />
                      <AvatarFallback>{notification.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">{notification.name}</span>
                          {notification.unread && (
                            <Badge variant="default" className="h-3.5 px-1.5 text-[9px] bg-primary text-primary-foreground">
                              New
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground flex-shrink-0">{notification.timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-foreground line-clamp-1">{notification.message}</p>
                      {notification.itemTitle && (
                        <p className="text-[9px] text-muted-foreground">Re: {notification.itemTitle}</p>
                      )}
                    </div>
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center border-border">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When someone messages you about your listings, they'll appear here
              </p>
            </Card>
          )}
        </div>

        {/* Empty state for friends (since there's no friends system) */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xs font-semibold text-muted-foreground mb-2">Friends</h2>
          <Card className="p-6 text-center border-border bg-muted/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg font-bold text-muted-foreground">0</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">0 Friends Added</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect with other users to see their activity
            </p>
          </Card>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Notifications;