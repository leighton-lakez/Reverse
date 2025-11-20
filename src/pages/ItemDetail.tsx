import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Heart, Share2, ShieldCheck, MessageCircle } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReverseIcon } from "@/components/ReverseIcon";
import LocationMap from "@/components/LocationMap";

const ItemDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [item, setItem] = useState<any>(location.state?.item || null);
  const [liked, setLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(!location.state?.item);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    // Fetch real item data with seller information from database
    const fetchItemDetails = async () => {
      if (location.state?.item?.id) {
        const itemId = location.state.item.id;

        // Fetch item data
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single();

        if (itemError) {
          console.error('Error fetching item:', itemError);
          toast.error('Failed to load item details');
          navigate('/');
          return;
        }

        // Fetch seller profile separately
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', itemData.user_id)
          .single();

        // Combine item and seller data
        setItem({
          ...itemData,
          seller: sellerData
        });
        setLoading(false);

        // Track view (only if not the owner)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.id !== itemData.user_id) {
          // Insert view record (will auto-increment view_count via trigger)
          await supabase
            .from('item_views')
            .insert({
              item_id: itemId,
              user_id: session.user.id
            })
            .select()
            .single()
            .catch(() => {
              // Ignore duplicate view errors (same user viewing again)
              // The unique constraint will prevent duplicate entries
            });
        }

        // Check if item is favorited
        if (session) {
          const { data: favoriteData } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('item_id', itemId)
            .maybeSingle();

          setIsFavorited(!!favoriteData);
        }
      } else {
        toast.error('Item not found');
        navigate('/');
      }
    };

    fetchItemDetails();
  }, [location.state?.item, navigate]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      navigate('/auth');
      return;
    }

    if (!item?.id) return;

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', item.id);

        if (error) {
          console.error('Error removing favorite:', error);
          toast.error('Failed to remove favorite');
          return;
        }

        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_id: item.id,
          });

        if (error) {
          console.error('Error adding favorite:', error);
          toast.error('Failed to add favorite');
          return;
        }

        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      console.error('Unexpected error toggling favorite:', err);
      toast.error('Something went wrong');
    }
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const seller = item.seller || { display_name: 'Unknown Seller', avatar_url: null };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-8 h-8" />
              <h1 className="text-xl font-black tracking-tighter text-gradient">REVRS</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className="hover:bg-muted"
              >
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid lg:grid-cols-7 gap-4">
          {/* Image/Video Gallery */}
          <div className="lg:col-span-2 animate-fade-in">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted h-[280px]">
              {item.images?.[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                  }}
                />
              ) : item.videos?.[0] ? (
                <video
                  src={item.videos[0]}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Item Details */}
          <div className="lg:col-span-5 space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground mb-1">{item.title}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{item.location}</span>
                </div>
                <div className="text-2xl font-bold text-primary">${item.price}</div>
              </div>
              <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1">{item.condition}</Badge>
            </div>

            {/* Description & Details Combined */}
            <Card className="p-3 border-border bg-card">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description || "No description provided."}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Brand</span>
                      <p className="text-xs text-foreground font-semibold">{item.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Category</span>
                      <p className="text-xs text-foreground font-semibold">{item.category || 'N/A'}</p>
                    </div>
                    {item.size && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Size</span>
                        <p className="text-xs text-foreground font-semibold">{item.size}</p>
                      </div>
                    )}
                    {item.trade_preference && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Trade</span>
                        <p className="text-xs text-foreground font-semibold">{item.trade_preference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>


            {/* Seller Info */}
            <Card className="p-3 border-border bg-gradient-to-br from-muted/50 to-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={seller.avatar_url || undefined} />
                  <AvatarFallback>
                    {seller.display_name ? seller.display_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-foreground text-sm">{seller.display_name || 'Seller'}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">View profile for reviews</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/user/${item.user_id}`)}
                  className="border-primary text-primary hover:bg-primary/10 text-xs h-8"
                >
                  View Profile
                </Button>
              </div>
            </Card>

            {/* Action Button */}
            <Button
              onClick={() => navigate("/chat", { state: { sellerId: item.user_id, item: { id: item.id, title: item.title, price: item.price, image: item.images?.[0] || item.image } } })}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Message Seller
            </Button>

            {/* Quick Message Templates */}
            <Card className="p-3 border-border bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-2">Quick Messages</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      toast.error('Please sign in to message');
                      navigate('/auth');
                      return;
                    }

                    const message = `Hi! I'm interested in buying "${item.title}". Is it still available?`;
                    await supabase.from('messages').insert({
                      sender_id: session.user.id,
                      receiver_id: item.user_id,
                      content: message,
                      item_id: item.id,
                      read: false
                    });

                    toast.success('Message sent!');
                    navigate("/chat", { state: { sellerId: item.user_id, item: { id: item.id, title: item.title, price: item.price, image: item.images?.[0] || item.image } } });
                  }}
                  className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                >
                  <span className="text-xs">💰 I want to buy this</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      toast.error('Please sign in to message');
                      navigate('/auth');
                      return;
                    }

                    const message = `Hi! Is the price negotiable for "${item.title}"?`;
                    await supabase.from('messages').insert({
                      sender_id: session.user.id,
                      receiver_id: item.user_id,
                      content: message,
                      item_id: item.id,
                      read: false
                    });

                    toast.success('Message sent!');
                    navigate("/chat", { state: { sellerId: item.user_id, item: { id: item.id, title: item.title, price: item.price, image: item.images?.[0] || item.image } } });
                  }}
                  className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                >
                  <span className="text-xs">💵 Is the price negotiable?</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      toast.error('Please sign in to message');
                      navigate('/auth');
                      return;
                    }

                    const message = `Hi! Could you share more pictures of "${item.title}"? I'd love to see different angles.`;
                    await supabase.from('messages').insert({
                      sender_id: session.user.id,
                      receiver_id: item.user_id,
                      content: message,
                      item_id: item.id,
                      read: false
                    });

                    toast.success('Message sent!');
                    navigate("/chat", { state: { sellerId: item.user_id, item: { id: item.id, title: item.title, price: item.price, image: item.images?.[0] || item.image } } });
                  }}
                  className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                >
                  <span className="text-xs">📸 Can I see more pictures?</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      toast.error('Please sign in to message');
                      navigate('/auth');
                      return;
                    }

                    const message = `Hi! Can we arrange a meetup to see "${item.title}" in person?`;
                    await supabase.from('messages').insert({
                      sender_id: session.user.id,
                      receiver_id: item.user_id,
                      content: message,
                      item_id: item.id,
                      read: false
                    });

                    toast.success('Message sent!');
                    navigate("/chat", { state: { sellerId: item.user_id, item: { id: item.id, title: item.title, price: item.price, image: item.images?.[0] || item.image } } });
                  }}
                  className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                >
                  <span className="text-xs">🤝 Can we meet in person?</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      toast.error('Please sign in to message');
                      navigate('/auth');
                      return;
                    }

                    const message = `Hi! What's the condition of "${item.title}"? Are there any flaws or defects I should know about?`;
                    await supabase.from('messages').insert({
                      sender_id: session.user.id,
                      receiver_id: item.user_id,
                      content: message,
                      item_id: item.id,
                      read: false
                    });

                    toast.success('Message sent!');
                    navigate("/chat", { state: { sellerId: item.user_id, item: { id: item.id, title: item.title, price: item.price, image: item.images?.[0] || item.image } } });
                  }}
                  className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                >
                  <span className="text-xs">🔍 What's the condition like?</span>
                </Button>
              </div>
            </Card>

            {/* Location Map */}
            {item.location && (
              <Card className="p-3 border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  Seller Location
                </h3>
                <LocationMap location={item.location} />
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ItemDetail;
