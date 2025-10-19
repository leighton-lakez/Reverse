import { useState } from "react";
import { ArrowLeft, MapPin, Heart, Share2, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ItemDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item || {};
  const [liked, setLiked] = useState(false);

  const seller = {
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    rating: 4.9,
    reviews: 87,
    verified: true
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Image Gallery */}
          <div className="lg:col-span-2 animate-fade-in">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted sticky top-24">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Item Details */}
          <div className="lg:col-span-3 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Card className="p-5 border-border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">{item.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{item.location}</span>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">{item.condition}</Badge>
              </div>
              <div className="text-3xl font-bold text-primary">${item.price}</div>
            </Card>

            {/* Description */}
            <Card className="p-5 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Authentic designer piece in excellent condition. This item has been carefully maintained and comes from a smoke-free home. 
                Original packaging and authenticity certificate included. Perfect for anyone looking to add a luxury piece to their collection.
              </p>
            </Card>

            {/* Item Details */}
            <Card className="p-5 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Brand</span>
                  <p className="text-foreground font-semibold">{item.title?.split(' ')[0]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Condition</span>
                  <p className="text-foreground font-semibold">{item.condition}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Category</span>
                  <p className="text-foreground font-semibold">Accessories</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Size</span>
                  <p className="text-foreground font-semibold">One Size</p>
                </div>
              </div>
            </Card>

            {/* Seller Info */}
            <Card className="p-5 border-border bg-gradient-to-br from-muted/50 to-muted/30">
              <h3 className="text-lg font-semibold text-foreground mb-4">Seller Information</h3>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarImage src={seller.avatar} />
                  <AvatarFallback>{seller.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground text-base">{seller.name}</h4>
                    {seller.verified && (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ⭐ {seller.rating} ({seller.reviews} reviews)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  View Profile
                </Button>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 sticky bottom-4 bg-background p-4 rounded-lg border border-border shadow-lg">
              <Button
                onClick={() => navigate("/checkout", { state: { item } })}
                className="h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Buy Now
              </Button>
              <Button
                onClick={() => navigate("/chat", { state: { seller, item } })}
                variant="outline"
                className="h-12 text-base font-semibold border-primary text-primary hover:bg-primary/10"
              >
                Offer Trade
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemDetail;
