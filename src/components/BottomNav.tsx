import { useState, useEffect } from "react";
import { Home, PlusCircle, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user and fetch unread count
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUserId(session.user.id);
        fetchUnreadCount(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('bottom-nav-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.receiver_id === currentUserId) {
            fetchUnreadCount(currentUserId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          if (updatedMsg.receiver_id === currentUserId) {
            fetchUnreadCount(currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchUnreadCount = async (userId: string) => {
    const { data: messages } = await supabase
      .from("messages")
      .select("sender_id, read")
      .eq("receiver_id", userId)
      .eq("read", false);

    if (messages) {
      // Count unique senders with unread messages
      const uniqueSenders = new Set(messages.map(m => m.sender_id));
      setUnreadCount(uniqueSenders.size);
    }
  };

  const getActiveStyles = (path: string) => {
    const isActive = location.pathname === path;
    return isActive
      ? "text-primary"
      : "";
  };

  const getActiveGlow = (path: string) => {
    const isActive = location.pathname === path;
    return isActive
      ? {
          boxShadow:
            "0 0 0 2px hsl(var(--primary) / 0.3), 0 0 12px hsl(var(--primary) / 0.5), 0 0 24px hsl(var(--primary) / 0.3), 0 0 36px hsl(var(--primary) / 0.15)",
        }
      : {};
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
        <div className="grid grid-cols-4 gap-0.5 sm:gap-1 py-1.5 sm:py-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-1.5 sm:py-2 hover:text-primary hover:bg-primary/10 rounded-xl transition-all ${getActiveStyles(
              "/"
            )}`}
            style={getActiveGlow("/")}
          >
            <Home className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs font-medium">Browse</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/sell")}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-1.5 sm:py-2 hover:text-primary hover:bg-primary/10 rounded-xl transition-all ${getActiveStyles(
              "/sell"
            )}`}
            style={getActiveGlow("/sell")}
          >
            <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs font-medium">Sell</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/notifications")}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-1.5 sm:py-2 hover:text-primary hover:bg-primary/10 rounded-xl transition-all ${getActiveStyles(
              "/notifications"
            )}`}
            style={getActiveGlow("/notifications")}
          >
            <div className="relative">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-medium">Alerts</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-1.5 sm:py-2 hover:text-primary hover:bg-primary/10 rounded-xl transition-all ${getActiveStyles(
              "/profile"
            )}`}
            style={getActiveGlow("/profile")}
          >
            <User className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs font-medium">Profile</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
