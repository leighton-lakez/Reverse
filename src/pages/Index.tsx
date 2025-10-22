import { LogOut, X, Heart, RotateCcw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { ReverseIcon } from "@/components/ReverseIcon";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Item {
  id: string;
  title: string;
  brand: string;
  price: number;
  condition: string;
  location: string;
  images: string[];
  user_id: string;
  description: string;
}

const Index = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [skippedItems, setSkippedItems] = useState<Item[]>([]);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [welcomeCardAnimating, setWelcomeCardAnimating] = useState(false);

  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (session) {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, location")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!profile?.display_name || !profile?.location) {
          navigate("/profile-setup");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchItems();
  }, [user]);

  useEffect(() => {
    // Check if user has started browsing before
    const hasStartedBrowsing = localStorage.getItem("hasStartedBrowsing");
    if (!hasStartedBrowsing) {
      setShowWelcomeCard(true);
    }
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from("items")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });

    // If user is logged in, don't show their own items
    if (user) {
      query = query.neq("user_id", user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully",
    });
    // Stay on browse page after sign out
  };

  const handleStartBrowsing = () => {
    setWelcomeCardAnimating(true);
    setTimeout(() => {
      setShowWelcomeCard(false);
      localStorage.setItem("hasStartedBrowsing", "true");
    }, 800); // Match animation duration
  };

  const sendInterestedMessage = async (item: Item) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: item.user_id,
        content: `I'm interested in this product: ${item.title}`,
        item_id: item.id,
        read: false,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: `You've expressed interest in ${item.title}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (currentIndex >= items.length) return;

    const currentItem = items[currentIndex];

    setSwipeDirection(direction);

    // If swiping right, navigate to product detail page
    if (direction === "right") {
      // Navigate to item detail page with item data
      navigate("/item-detail", { state: { item: currentItem } });
    } else {
      // If swiping left, add to skipped items
      setSkippedItems([...skippedItems, currentItem]);

      // Wait for animation to complete
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
        setDragOffset({ x: 0, y: 0 });
      }, 300);
    }
  };

  const handleUndo = () => {
    if (skippedItems.length === 0) return;

    // Get the last skipped item
    const lastSkipped = skippedItems[skippedItems.length - 1];

    // Remove it from skipped
    setSkippedItems(skippedItems.slice(0, -1));

    // Move back one card
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Touch/Mouse handlers for drag
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;

    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleSwipe("right");
      } else {
        handleSwipe("left");
      }
    } else {
      // Reset position
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];
  const rotation = dragOffset.x / 20;
  const opacity = Math.min(Math.abs(dragOffset.x) / 100, 1);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ position: 'relative', height: '100vh', maxHeight: '100vh', overscrollBehavior: 'none' }}>
      {/* Header */}
      <header className="flex-shrink-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <ReverseIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-gradient">
                REVERSE
              </h1>
            </div>
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign out"
                className="hover:bg-primary/10 transition-all h-9 w-9 sm:h-10 sm:w-10"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => navigate("/auth")}
                className="h-9 sm:h-10 text-xs sm:text-sm gradient-primary"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 sm:px-4 pt-2 pb-1 sm:py-6 flex flex-col items-center justify-start overflow-hidden">
        {showWelcomeCard ? (
          <>
            {/* Welcome Card - UNO Reverse */}
            <div className="relative w-full aspect-[3/4] max-h-[340px] sm:max-h-[600px] flex items-center justify-center">
              <div
                className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-700 ${
                  welcomeCardAnimating
                    ? 'rotate-[720deg] scale-0 opacity-0 translate-x-[200%]'
                    : 'rotate-0 scale-100 opacity-100'
                }`}
                onClick={handleStartBrowsing}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #8B0000 100%)',
                  transformOrigin: 'center center'
                }}
              >
                {/* Glowing ring effect */}
                <div className="absolute inset-0 blur-2xl opacity-30 animate-pulse bg-gradient-to-br from-primary via-secondary to-primary" />

                {/* Card content */}
                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 gap-6">
                  {/* UNO Reverse Icon */}
                  <div className="transform scale-150">
                    <ReverseIcon className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-2xl" />
                  </div>

                  {/* Text */}
                  <div className="text-center space-y-3 animate-pulse">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                      START BROWSING
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base font-medium">
                      Tap to explore luxury fashion
                    </p>
                  </div>
                </div>

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
                     style={{ animation: 'shimmer 3s infinite' }} />
              </div>
            </div>
          </>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Loading items...</p>
          </div>
        ) : currentIndex >= items.length ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">That's all for now!</h2>
            <p className="text-muted-foreground mb-6">
              You've seen all available items. Check back later for more.
            </p>
            <Button onClick={() => { setCurrentIndex(0); fetchItems(); }}>
              Refresh
            </Button>
          </div>
        ) : (
          <>
            {/* Swipe Instructions */}
            <div className="text-center mb-2 sm:mb-4 animate-fade-in">
              <p className="text-xs sm:text-base text-muted-foreground flex items-center justify-center gap-2">
                <span className="text-red-500">← Swipe left to pass</span>
                <span>•</span>
                <span className="text-green-500">Swipe right to like →</span>
              </p>
            </div>

            {/* Card Stack */}
            <div className="relative w-full aspect-[3/4] max-h-[340px] sm:max-h-[600px]">
              {/* Next card (behind) */}
              {nextItem && (
                <div className="absolute inset-0 w-full h-full">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl bg-card border border-border scale-95 opacity-50">
                    <img
                      src={nextItem.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                      alt={nextItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Current card */}
              {currentItem && (
                <div
                  ref={cardRef}
                  className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
                  style={{
                    transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
                    transition: isDragging ? "none" : "all 0.3s ease-out",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={isDragging ? handleMouseMove : undefined}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-card border border-border">
                    {/* Image */}
                    <img
                      src={currentItem.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                      alt={currentItem.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Swipe indicators */}
                    <div
                      className="absolute top-4 sm:top-8 right-4 sm:right-8 pointer-events-none"
                      style={{ opacity: dragOffset.x < 0 ? opacity : 0 }}
                    >
                      <div className="bg-red-500 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-lg sm:text-2xl rotate-12 border-2 sm:border-4 border-white shadow-xl">
                        NOPE
                      </div>
                    </div>
                    <div
                      className="absolute top-4 sm:top-8 left-4 sm:left-8 pointer-events-none"
                      style={{ opacity: dragOffset.x > 0 ? opacity : 0 }}
                    >
                      <div className="bg-green-500 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-base sm:text-2xl -rotate-12 border-2 sm:border-4 border-white shadow-xl">
                        INTERESTED
                      </div>
                    </div>

                    {/* Item info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                      <h2 className="text-xl sm:text-2xl font-bold mb-1 line-clamp-2">{currentItem.title}</h2>
                      <p className="text-base sm:text-lg font-semibold mb-2">${currentItem.price}</p>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-2 flex-wrap">
                        <span className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                          {currentItem.brand}
                        </span>
                        <span className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                          {currentItem.condition}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm opacity-90">{currentItem.location}</p>
                      {currentItem.description && (
                        <p className="text-xs sm:text-sm opacity-75 mt-2 line-clamp-2">
                          {currentItem.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-8">
              <Button
                size="icon"
                variant="outline"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                onClick={() => handleSwipe("left")}
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>

              {skippedItems.length > 0 && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 hover:bg-muted transition-all shadow-lg"
                  onClick={handleUndo}
                >
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}

              <Button
                size="icon"
                variant="outline"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg"
                onClick={() => handleSwipe("right")}
              >
                <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            </div>

            {/* Counter */}
            <div className="mt-2 sm:mt-4 text-center text-xs sm:text-sm text-muted-foreground">
              {currentIndex + 1} / {items.length}
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
