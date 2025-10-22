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

const ItemDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [item, setItem] = useState<any>(location.state?.item || null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(!location.state?.item);

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
      } else {
        toast.error('Item not found');
        navigate('/');
      }
    };

    fetchItemDetails();
  }, [location.state?.item, navigate]);

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
              <h1 className="text-xl font-black tracking-tighter text-gradient">REVERSE</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLiked(!liked)}
                className="hover:bg-muted"
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-primary text-primary" : ""}`} />
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
          {/* Image Gallery */}
          <div className="lg:col-span-2 animate-fade-in">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted h-[280px]">
              <img
                src={item.images?.[0] || item.image || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop";
                }}
              />
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
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ItemDetail;
