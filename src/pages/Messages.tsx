import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ReverseIcon } from "@/components/ReverseIcon";

interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  unreadCount: number;
  itemTitle?: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    let channel: any = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      fetchConversations(session.user.id);

      // Set up realtime subscription to refresh when messages are read
      channel = supabase
        .channel('messages-list')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => {
            // Refresh conversations when any message changes
            fetchConversations(session.user.id);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate]);

  const fetchConversations = async (userId: string) => {
    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, display_name, avatar_url),
        item:items(title)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error || !messages) return;

    // Group messages by conversation (unique user pairs)
    const conversationMap = new Map<string, Conversation>();

    messages.forEach((msg: any) => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;

      if (!conversationMap.has(otherUserId)) {
        // Count unread messages for this conversation
        const unreadCount = messages.filter((m: any) =>
          m.receiver_id === userId &&
          m.sender_id === otherUserId &&
          !m.read
        ).length;

        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUser?.display_name || "User",
          userAvatar: otherUser?.avatar_url || "",
          lastMessage: msg.content,
          lastMessageTime: new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          unread: unreadCount > 0,
          unreadCount: unreadCount,
          itemTitle: msg.item?.title
        });
      }
    });

    setConversations(Array.from(conversationMap.values()));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ReverseIcon className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter text-gradient">REVERSE</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.userId}
                onClick={() =>
                  navigate("/chat", {
                    state: {
                      sellerId: conversation.userId,
                      item: { title: conversation.itemTitle }
                    }
                  })
                }
                className={`p-3 border-border hover:bg-muted/50 transition-all cursor-pointer ${
                  conversation.unread ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={conversation.userAvatar} />
                    <AvatarFallback>
                      {conversation.userName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {conversation.userName}
                        </span>
                        {conversation.unread && (
                          <Badge variant="default" className="h-4 px-1.5 text-xs">
                            {conversation.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-1">
                      {conversation.lastMessage}
                    </p>
                    {conversation.itemTitle && (
                      <p className="text-xs text-muted-foreground">
                        Re: {conversation.itemTitle}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Messages;
