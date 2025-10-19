import { ArrowLeft, Heart, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const friendsPosts = [
  {
    id: 1,
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    itemImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    itemTitle: "Chanel Bag",
    timeAgo: "2h ago"
  },
  {
    id: 2,
    name: "Marcus Cole",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    itemImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
    itemTitle: "Nike Dunks",
    timeAgo: "5h ago"
  },
  {
    id: 3,
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    itemImage: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400",
    itemTitle: "Versace Dress",
    timeAgo: "8h ago"
  },
  {
    id: 4,
    name: "David Park",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    itemImage: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=400",
    itemTitle: "Ray-Ban Sunglasses",
    timeAgo: "12h ago"
  }
];

const messageNotifications = [
  {
    id: 1,
    name: "Alex Thompson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    message: "Is the Gucci bag still available?",
    itemTitle: "Gucci Leather Handbag",
    timeAgo: "10m ago",
    unread: true
  },
  {
    id: 2,
    name: "Jessica Lee",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    message: "Would you trade for my Louis Vuitton wallet?",
    itemTitle: "Prada Sunglasses",
    timeAgo: "1h ago",
    unread: true
  },
  {
    id: 3,
    name: "Michael Brown",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    message: "Thanks for the quick response!",
    itemTitle: "Versace Silk Scarf",
    timeAgo: "3h ago",
    unread: false
  },
  {
    id: 4,
    name: "Sophia Martinez",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    message: "Can you send more photos?",
    itemTitle: "Balenciaga Track Jacket",
    timeAgo: "5h ago",
    unread: false
  }
];

const systemNotifications = [
  {
    id: 1,
    type: "promotion",
    icon: Sparkles,
    title: "New Year Sale!",
    message: "Get 20% off premium listings this week",
    timeAgo: "2h ago"
  },
  {
    id: 2,
    type: "like",
    icon: Heart,
    title: "Your item was liked",
    message: "5 people liked your Gucci Leather Handbag",
    timeAgo: "4h ago"
  },
  {
    id: 3,
    type: "offer",
    icon: ShoppingBag,
    title: "Trade Offer Received",
    message: "Someone wants to trade for your Louis Vuitton Sneakers",
    timeAgo: "6h ago"
  },
  {
    id: 4,
    type: "promotion",
    icon: Sparkles,
    title: "Trending in Your Area",
    message: "Check out hot designer items near you",
    timeAgo: "1d ago"
  }
];

const Notifications = () => {
  const navigate = useNavigate();

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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Friends' Recent Posts */}
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground mb-3">Friends' Activity (24h)</h2>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-2">
              {friendsPosts.map((friend) => (
                <Card key={friend.id} className="flex-shrink-0 w-40 overflow-hidden border-border hover:shadow-[var(--shadow-glow)] transition-all cursor-pointer">
                  <div className="relative aspect-square">
                    <img src={friend.itemImage} alt={friend.itemTitle} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>{friend.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground truncate">{friend.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{friend.itemTitle}</p>
                    <p className="text-xs text-muted-foreground">{friend.timeAgo}</p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Message Notifications */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-semibold text-foreground mb-3">Messages</h2>
          <div className="space-y-3">
            {messageNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 border-border hover:bg-muted/50 transition-all cursor-pointer ${
                  notification.unread ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={notification.avatar} />
                    <AvatarFallback>{notification.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{notification.name}</span>
                        {notification.unread && (
                          <Badge variant="default" className="h-5 px-2 bg-primary text-primary-foreground">
                            New
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{notification.timeAgo}</span>
                    </div>
                    <p className="text-sm text-foreground mb-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">Re: {notification.itemTitle}</p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* System & Promotional Notifications */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-semibold text-foreground mb-3">Design-Up Updates</h2>
          <div className="space-y-3">
            {systemNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Card
                  key={notification.id}
                  className={`p-4 border-border hover:bg-muted/50 transition-all cursor-pointer ${
                    notification.type === 'promotion' ? 'bg-gradient-to-r from-primary/5 to-secondary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'promotion' ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        notification.type === 'promotion' ? 'text-background' : 'text-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-foreground">{notification.title}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{notification.timeAgo}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
