import { useState } from "react";
import { ArrowLeft, Send, Image, Smile } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  timestamp: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { seller, item } = location.state || {};
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm interested in your item.",
      sender: "me",
      timestamp: "10:30 AM"
    },
    {
      id: 2,
      text: "Great! It's still available. Would you like to know more about it?",
      sender: "them",
      timestamp: "10:32 AM"
    }
  ]);
  
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
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
      <div className="border-t border-border bg-background p-4 pb-safe">
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
    </div>
  );
};

export default Chat;
