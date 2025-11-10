import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Home, ShoppingBag, Mail, User, Settings, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  suggestions?: string[];
}

const ChatboxAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "Hi! I'm your navigation assistant. I can help you find your way around the app. What would you like to do?",
        [
          "Browse items",
          "Sell something",
          "View my profile",
          "Check messages",
          "View notifications",
        ]
      );
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (content: string, suggestions?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content,
      suggestions,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleNavigationQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Browse/Home/Swipe
    if (
      lowerQuery.includes("browse") ||
      lowerQuery.includes("home") ||
      lowerQuery.includes("swipe") ||
      lowerQuery.includes("items") ||
      lowerQuery.includes("shop") ||
      lowerQuery.includes("look")
    ) {
      addBotMessage("Taking you to the browse page where you can swipe through items!");
      setTimeout(() => {
        navigate("/");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Sell/List
    if (
      lowerQuery.includes("sell") ||
      lowerQuery.includes("list") ||
      lowerQuery.includes("upload") ||
      lowerQuery.includes("post")
    ) {
      addBotMessage("Taking you to the sell page where you can list your items!");
      setTimeout(() => {
        navigate("/sell");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Profile
    if (
      lowerQuery.includes("profile") ||
      lowerQuery.includes("my account") ||
      lowerQuery.includes("my items") ||
      lowerQuery.includes("my listings")
    ) {
      addBotMessage("Taking you to your profile!");
      setTimeout(() => {
        navigate("/profile");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Messages/Chat
    if (
      lowerQuery.includes("message") ||
      lowerQuery.includes("chat") ||
      lowerQuery.includes("inbox") ||
      lowerQuery.includes("conversation")
    ) {
      addBotMessage("Taking you to your messages!");
      setTimeout(() => {
        navigate("/chat");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Notifications
    if (
      lowerQuery.includes("notification") ||
      lowerQuery.includes("alerts") ||
      lowerQuery.includes("updates")
    ) {
      addBotMessage("Taking you to your notifications!");
      setTimeout(() => {
        navigate("/notifications");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Settings
    if (
      lowerQuery.includes("setting") ||
      lowerQuery.includes("preferences") ||
      lowerQuery.includes("dark mode") ||
      lowerQuery.includes("light mode") ||
      lowerQuery.includes("theme")
    ) {
      addBotMessage("Taking you to settings!");
      setTimeout(() => {
        navigate("/settings");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Stories
    if (
      lowerQuery.includes("stor") ||
      lowerQuery.includes("create story") ||
      lowerQuery.includes("post story")
    ) {
      addBotMessage("You can create stories from your profile page. Taking you there now!");
      setTimeout(() => {
        navigate("/profile");
        setIsOpen(false);
      }, 1000);
      return;
    }

    // Default response
    addBotMessage(
      "I'm not sure what you're looking for. Here are some things I can help you with:",
      [
        "Browse items",
        "Sell something",
        "View my profile",
        "Check messages",
        "View notifications",
        "Go to settings",
      ]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    handleNavigationQuery(inputValue);
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    addUserMessage(suggestion);
    handleNavigationQuery(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-24 left-4 sm:left-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open navigation assistant"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -left-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        </button>
      )}

      {/* Chatbox */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 left-4 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] animate-fade-in">
          <Card className="h-full flex flex-col bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Navigation Assistant</h3>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.type === "user"
                        ? "bg-gradient-to-br from-primary to-secondary text-white"
                        : "bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Quick Actions/Suggestions */}
              {messages.length > 0 && messages[messages.length - 1].suggestions && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-primary/30 hover:border-primary"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-muted/20">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Where would you like to go?"
                  className="flex-1 bg-background border-border/50 focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-to-br from-primary to-secondary hover:opacity-90 transition-opacity flex-shrink-0"
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Ask me to go anywhere in the app
              </p>
            </form>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatboxAssistant;
