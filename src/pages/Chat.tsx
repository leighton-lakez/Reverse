import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Image, Smile } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { messageSchema } from "@/lib/validationSchemas";
import EmojiPicker from "emoji-picker-react";

interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  timestamp: string;
  imageUrl?: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sellerId, item } = location.state || {};
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  imageUrl: newMsg.image_url
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
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: msg.image_url
      })));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !sellerId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Create temporary URL for optimistic update
    const tempUrl = URL.createObjectURL(file);
    const optimisticMessage: Message = {
      id: Date.now() + Math.random(),
      text: "📷 Image",
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: tempUrl
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      // Update the optimistic message with real URL
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? { ...m, imageUrl: publicUrl } : m
      ));

      // Send message with image
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: sellerId,
          item_id: item?.id || null,
          content: "📷 Image",
          image_url: publicUrl
        });

      if (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        throw error;
      }

      toast({
        title: "Image sent",
        description: "Your image has been sent",
      });
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      // Clean up temporary URL
      URL.revokeObjectURL(tempUrl);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async (imageUrl?: string) => {
    if ((!newMessage.trim() && !imageUrl) || !currentUser || !sellerId) return;
    
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

      const messageContent = validationResult.data.content;
      
      // Optimistically add message to UI immediately
      const optimisticMessage: Message = {
        id: Date.now() + Math.random(),
        text: messageContent,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: imageUrl || undefined
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear input immediately for better UX
      setNewMessage("");

      // Send to database in background
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: sellerId,
          item_id: item?.id || null,
          content: messageContent,
          image_url: imageUrl || null
        });

      if (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
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
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => navigate(`/user/${sellerId}`)}
              >
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
              {message.imageUrl ? (
                <img 
                  src={message.imageUrl} 
                  alt="Shared image" 
                  className="rounded-lg max-w-[200px] max-h-[200px] object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.imageUrl, '_blank')}
                />
              ) : null}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Image className="h-5 w-5" />
          </Button>
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none" align="start">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setNewMessage(prev => prev + emojiData.emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-border"
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            disabled={uploading}
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
