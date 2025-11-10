import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, GripVertical } from "lucide-react";
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
  const [position, setPosition] = useState({ x: 16, y: 80 }); // Start at bottom-left
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Comprehensive knowledge base about REVRS
  const knowledgeBase = {
    // Profile features
    reviews: {
      keywords: ["review", "rating", "feedback", "received", "given", "stars", "rate", "reviews"],
      response: "Reviews can be found on your Profile page! There are two sections:\n\n1. **Listings** - Shows your Active, Sold, and Draft items\n2. **Reviews Section** (below listings) - Has two tabs:\n   • Received - Reviews others left for you\n   • Given - Reviews you left for others\n\nWant me to take you to your profile?",
      action: "/profile"
    },

    listings: {
      keywords: ["listing", "active", "sold", "drafts", "my items", "my stuff", "what i'm selling"],
      response: "Your listings are on your Profile page with 3 tabs:\n\n• **Active** - Items currently for sale\n• **Sold** - Items you've sold\n• **Drafts** - Unfinished listings you saved\n\nYou can edit, preview, mark as sold, or delete items from there. Want me to take you there?",
      action: "/profile"
    },

    sell: {
      keywords: ["sell", "list", "upload", "post", "create listing", "add item"],
      response: "To sell something:\n\n1. Go to the **Sell** page (bottom nav)\n2. Add photos, title, brand, category\n3. Set price and condition\n4. Add description and location\n5. Publish or save as draft\n\nYou can also save drafts and finish them later! Ready to list something?",
      action: "/sell"
    },

    browse: {
      keywords: ["browse", "swipe", "shop", "find items", "look for", "search items", "home"],
      response: "The Browse page is where you discover items! Features:\n\n• **Swipe** through items (like/skip)\n• **Category filters** at the top\n• **MAP VIEW** button to see items on a map\n• Items you like are saved to your favorites\n\nTake me there now?",
      action: "/"
    },

    mapView: {
      keywords: ["map", "map view", "location", "nearby", "zillow", "where"],
      response: "The Map View shows items by location! Features:\n\n• **Split screen** - Listings on left, map on right\n• **Click a listing** to see its location on map\n• **Hover** on cards or markers to highlight them\n• **Price markers** show item prices on map\n• **Filters** for location search and price range\n\nOn mobile, toggle between List and Map views. Want to check it out?",
      action: "/"
    },

    messages: {
      keywords: ["message", "chat", "dm", "inbox", "conversation", "talk to seller"],
      response: "Messages are in the **Chat** section (bottom nav)!\n\nYou can:\n• Message sellers about items\n• Negotiate prices\n• Arrange meetups\n• See all your conversations\n\nWant me to open your messages?",
      action: "/chat"
    },

    profile: {
      keywords: ["profile", "my account", "edit profile", "bio", "avatar", "my page"],
      response: "Your Profile page has everything about you:\n\n• **Edit Profile** - Update name, bio, avatar, location\n• **Payment Methods** - Add Venmo, Cash App, Zelle, PayPal, etc.\n• **Stories** - Create and manage 24hr stories\n• **Stats** - Followers, following, listings count\n• **Tabs** - Active/Sold/Drafts listings\n• **Reviews** - Separate section below\n\nTake you there?",
      action: "/profile"
    },

    payment: {
      keywords: ["payment", "pay", "venmo", "cashapp", "zelle", "paypal", "apple pay", "how to pay"],
      response: "Payment methods are set up in your Profile!\n\n1. Go to Profile → **Edit Profile**\n2. Scroll to **Payment Methods** section\n3. Add your:\n   • Venmo (@username)\n   • Cash App ($cashtag)\n   • Zelle (email/phone)\n   • PayPal (email)\n   • Apple Pay\n   • Other methods\n\nBuyers will see these on your profile. Want to add yours?",
      action: "/profile"
    },

    stories: {
      keywords: ["story", "stories", "24 hour", "post story", "create story", "my stories"],
      response: "Stories work like Instagram! Found on your Profile:\n\n• **Create** button - Post photos visible for 24hrs\n• **View Stories** - Tap your avatar or others'\n• **Manage Stories** - Delete or view past stories\n• Stories auto-delete after 24 hours\n\nPerfect for showcasing new items! Check them out?",
      action: "/profile"
    },

    followers: {
      keywords: ["follower", "following", "follow", "friends", "connections"],
      response: "Your followers/following are on your Profile!\n\n• Tap **Followers** to see who follows you\n• Tap **Following** to see who you follow\n• Follow users to see their items first\n• Build your marketplace network!\n\nWant to view your connections?",
      action: "/profile"
    },

    settings: {
      keywords: ["settings", "dark mode", "theme", "preferences", "account settings"],
      response: "Settings let you customize REVRS:\n\n• **Dark/Light Mode** toggle\n• **Account settings**\n• **Notification preferences**\n• **Privacy settings**\n• **About & Help**\n\nMake the app yours! Open settings?",
      action: "/settings"
    },

    notifications: {
      keywords: ["notification", "alerts", "updates", "bell"],
      response: "Notifications show you:\n\n• New messages from buyers/sellers\n• Likes on your items\n• New followers\n• Price drops on items you liked\n• System updates\n\nCheck them in the Notifications page (bottom nav). Take a look?",
      action: "/notifications"
    },

    uno: {
      keywords: ["uno", "game", "play", "play uno", "reverse card"],
      response: "UNO game is in the top right! 🎮\n\n• Play UNO Reverse against others\n• Fun mini-game while browsing\n• Click the blue UNO card icon\n\nWant to play a game?",
      action: "/uno"
    },

    editListing: {
      keywords: ["edit listing", "change price", "update item", "modify listing"],
      response: "To edit a listing:\n\n1. Go to your **Profile**\n2. Find the item in **Active** tab\n3. Click the **three dots** (⋮) menu\n4. Select **Edit Listing**\n5. Make your changes and save\n\nYou can change price, photos, description, etc. Need help with a specific listing?",
      action: "/profile"
    },

    markSold: {
      keywords: ["mark sold", "sold out", "item sold", "mark as sold"],
      response: "To mark an item as sold:\n\n1. Go to your **Profile**\n2. Find item in **Active** tab\n3. Click **three dots** (⋮) menu\n4. Select **Mark as Sold**\n\nThe item moves to your **Sold** tab. Want to do this now?",
      action: "/profile"
    },

    drafts: {
      keywords: ["draft", "save draft", "unfinished", "incomplete listing"],
      response: "Drafts let you save incomplete listings:\n\n• Click **Save as Draft** when creating a listing\n• Find drafts in Profile → **Drafts tab**\n• **Continue editing** or **Publish** when ready\n• Or **Delete** drafts you don't need\n\nGreat for listing multiple items! Check your drafts?",
      action: "/profile"
    },

    viewItem: {
      keywords: ["view item", "item detail", "see listing", "product page"],
      response: "To view an item in detail:\n\n• **Swipe/Browse**: Tap the item card\n• **Map View**: Click a listing or marker\n• **Profile**: Tap any of your listings\n\nYou'll see:\n- All photos & videos\n- Full description\n- Seller info & payment methods\n- Message seller button\n- Location on map\n\nBrowse items now?",
      action: "/"
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "Hi! 👋 I'm your REVRS assistant. I know everything about this app!\n\nAsk me anything like:\n• Where can I find my reviews?\n• How do I add payment methods?\n• Where are my drafts?\n• How does the map work?",
        [
          "Where are my reviews?",
          "How do I sell something?",
          "Show me the map view",
          "Where are my drafts?",
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

  const findBestMatch = (query: string): { response: string; action?: string; suggestions?: string[] } | null => {
    const lowerQuery = query.toLowerCase();

    // Check each knowledge base entry
    for (const [key, data] of Object.entries(knowledgeBase)) {
      for (const keyword of data.keywords) {
        if (lowerQuery.includes(keyword)) {
          return {
            response: data.response,
            action: data.action,
            suggestions: ["Go there now", "Tell me more", "Something else"]
          };
        }
      }
    }

    return null;
  };

  const handleNavigationQuery = (query: string) => {
    const match = findBestMatch(query);

    if (match) {
      addBotMessage(match.response, match.suggestions);

      // Store the action for later use
      if (match.action) {
        (window as any).__pendingNavigation = match.action;
      }
    } else {
      // If no match, provide helpful default
      addBotMessage(
        "I'm not quite sure about that. Here's what I can help you with:\n\n• Finding your reviews, listings, or drafts\n• Selling items and using the map\n• Payment methods and profile settings\n• Messages, notifications, and stories\n• Any feature on REVRS!\n\nTry asking something specific!",
        [
          "Where are my reviews?",
          "How do I add payment methods?",
          "Show me the map",
          "How do I sell something?",
        ]
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    handleNavigationQuery(inputValue);
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Go there now" && (window as any).__pendingNavigation) {
      const path = (window as any).__pendingNavigation;
      addUserMessage(suggestion);
      addBotMessage("Taking you there now! ✨");
      setTimeout(() => {
        navigate(path);
        setIsOpen(false);
        delete (window as any).__pendingNavigation;
      }, 800);
    } else if (suggestion === "Tell me more") {
      addUserMessage(suggestion);
      addBotMessage(
        "I'd love to help more! Ask me about:\n\n• Specific features you want to learn\n• How to do something step-by-step\n• Where to find things in the app\n• Tips and tricks for using REVRS\n\nWhat would you like to know?",
        ["Where are my reviews?", "How do I sell?", "Payment methods", "Map view"]
      );
    } else if (suggestion === "Something else") {
      addUserMessage(suggestion);
      addBotMessage(
        "Sure! What else can I help you with? Just ask naturally like:\n\n\"Where can I find...\"\n\"How do I...\"\n\"What is...\"\n\"Show me...\"\n\nI'm here to help! 😊"
      );
    } else {
      addUserMessage(suggestion);
      handleNavigationQuery(suggestion);
    }
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (chatboxRef.current) {
      setIsDragging(true);
      const rect = chatboxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && chatboxRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - chatboxRef.current.offsetWidth;
        const maxY = window.innerHeight - chatboxRef.current.offsetHeight;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

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
        <div
          ref={chatboxRef}
          className="fixed z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] animate-fade-in"
          style={{
            left: `${position.x}px`,
            bottom: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <Card className="h-full flex flex-col bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
            {/* Header - Draggable */}
            <div
              className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">REVRS Bot</h3>
                  <p className="text-xs text-muted-foreground">Drag me anywhere!</p>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-background border-border"
                />
                <Button type="submit" size="icon" className="h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatboxAssistant;
