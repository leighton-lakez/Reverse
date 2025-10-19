import { useState, useEffect } from "react";
import { ArrowLeft, Send, Image, Smile } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { messageSchema } from "@/lib/validationSchemas";

interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  timestamp: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sellerId, item } = location.state || {};
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    let channel: any = null;

    // Get current user and set up realtime
    const setupChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setCurrentUser(session.user);
      
      // Fetch seller profile and messages
      if (sellerId) {
        fetchSellerProfile(sellerId);
        fetchMessages(session.user.id, sellerId, item?.id);
        
        // Set up realtime subscription AFTER we have the user
        channel = supabase
          .channel('messages-chat')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages'
            },
            (payload) => {
              const newMsg = payload.new as any;
              // Check if message is part of this conversation
              if ((newMsg.sender_id === sellerId && newMsg.receiver_id === session.user.id) ||
                  (newMsg.sender_id === session.user.id && newMsg.receiver_id === sellerId)) {
                setMessages(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  text: newMsg.content,
                  sender: newMsg.sender_id === session.user.id ? "me" : "them",
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
              }
            }
          )
          .subscribe();
      }
    };

    setupChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate, sellerId, item]);

  const fetchSellerProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setSeller({
        name: data.display_name || "User",
        avatar: data.avatar_url
      });
    }
  };

  const fetchMessages = async (userId: string, otherUserId: string, itemId?: string) => {
    // Use .in() method to avoid string interpolation - safer and more readable
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .in('sender_id', [userId, otherUserId])
      .in('receiver_id', [userId, otherUserId])
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data.map(msg => ({
        id: Date.now() + Math.random(),
        text: msg.content,
        sender: msg.sender_id === userId ? "me" : "them",
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || !sellerId) return;
    
    try {
      // Validate message content
      const validationResult = messageSchema.safeParse({
        content: newMessage.trim(),
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

      // Optimistically add message to UI immediately
      const optimisticMessage = {
        id: Date.now(),
        text: validationResult.data.content,
        sender: "me" as const,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");

      // Then send to database
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: sellerId,
          item_id: item?.id || null,
          content: validationResult.data.content
        });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
      // Optionally remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== Date.now()));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={seller?.avatar} />
                <AvatarFallback>{seller?.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-foreground">{seller?.name}</h2>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Item Preview */}
      {item && (
        <Card className="mx-4 mt-4 p-3 border-border bg-muted/30 animate-fade-in">
          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1">{item.title}</h3>
              <p className="text-primary font-bold">${item.price}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.sender === "me"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-[10px] mt-1 ${
                message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background p-4 pb-28">
        <div className="max-w-7xl mx-auto flex gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Image className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-border"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Chat;
