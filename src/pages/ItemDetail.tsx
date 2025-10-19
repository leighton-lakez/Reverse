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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="animate-fade-in">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-foreground">{item.title}</h1>
                <Badge className="bg-primary text-primary-foreground">{item.condition}</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{item.location}</span>
              </div>
              <div className="text-4xl font-bold text-primary mb-6">${item.price}</div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                Authentic designer piece in excellent condition. This item has been carefully maintained and comes from a smoke-free home. 
                Original packaging and authenticity certificate included. Perfect for anyone looking to add a luxury piece to their collection.
              </p>
            </div>

            <Separator />

            {/* Item Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Brand</span>
                  <p className="text-foreground font-medium">{item.title?.split(' ')[0]}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Condition</span>
                  <p className="text-foreground font-medium">{item.condition}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category</span>
                  <p className="text-foreground font-medium">Accessories</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Size</span>
                  <p className="text-foreground font-medium">One Size</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seller Info */}
            <Card className="p-4 border-border bg-muted/30">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={seller.avatar} />
                  <AvatarFallback>{seller.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{seller.name}</h4>
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
                  onClick={() => navigate("/profile")}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  View Profile
                </Button>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                onClick={() => navigate("/checkout", { state: { item } })}
                className="h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Buy Now
              </Button>
              <Button
                onClick={() => navigate("/chat", { state: { seller, item } })}
                variant="outline"
                className="h-14 text-lg font-semibold border-primary text-primary hover:bg-primary/10"
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
