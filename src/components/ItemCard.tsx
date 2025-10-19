import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ItemCardProps {
  id: number;
  image: string;
  title: string;
  price: number;
  condition: string;
  location: string;
}

const ItemCard = ({ id, image, title, price, condition, location }: ItemCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate to detail if not clicking buttons
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      navigate("/item-detail", { state: { item: { id, image, title, price, condition, location } } });
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/checkout", { state: { item: { id, image, title, price, condition, location } } });
  };

  const handleTrade = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/chat", { 
      state: { 
        seller: { name: "Seller Name", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
        item: { id, image, title, price, condition, location }
      } 
    });
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="group overflow-hidden border-border bg-card hover:shadow-[var(--shadow-glow)] transition-all duration-300 animate-scale-in cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <Heart className="h-5 w-5" />
        </Button>
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
          {condition}
        </Badge>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{location}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">${price}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleBuyNow}
            variant="default" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Buy Now
          </Button>
          <Button 
            onClick={handleTrade}
            variant="outline" 
            className="w-full border-primary text-primary hover:bg-primary/10"
          >
            Trade
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ItemCard;
