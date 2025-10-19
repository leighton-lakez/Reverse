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

      <main className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid lg:grid-cols-7 gap-4">
          {/* Image Gallery */}
          <div className="lg:col-span-2 animate-fade-in">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted h-[280px]">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
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
                    Authentic designer piece in excellent condition. Carefully maintained, smoke-free home. Includes original packaging.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Brand</span>
                      <p className="text-xs text-foreground font-semibold">{item.title?.split(' ')[0]}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Category</span>
                      <p className="text-xs text-foreground font-semibold">Accessories</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>


            {/* Seller Info */}
            <Card className="p-3 border-border bg-gradient-to-br from-muted/50 to-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={seller.avatar} />
                  <AvatarFallback>{seller.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-foreground text-sm">{seller.name}</h4>
                    {seller.verified && (
                      <ShieldCheck className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {seller.rating} ({seller.reviews} reviews)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="border-primary text-primary hover:bg-primary/10 text-xs h-8"
                >
                  View Profile
                </Button>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/checkout", { state: { item } })}
                className="h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Buy Now
              </Button>
              <Button
                onClick={() => navigate("/chat", { state: { seller, item } })}
                variant="outline"
                className="h-11 text-sm font-semibold border-primary text-primary hover:bg-primary/10"
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
