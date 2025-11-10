import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

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
  category: string;
}

interface Favorite {
  id: string;
  item_id: string;
  created_at: string;
  items: Item;
}

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        item_id,
        created_at,
        items:item_id (
          id,
          title,
          brand,
          price,
          condition,
          location,
          images,
          user_id,
          description,
          category
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFavorites(data as any);
    }
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string, itemTitle: string) => {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (!error) {
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
      toast({
        title: "Removed",
        description: `${itemTitle} removed from favorites`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (item: Item) => {
    navigate("/item-detail", { state: { item } });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <h1 className="text-2xl font-bold">My Favorites</h1>
            </div>
          </div>
          {favorites.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2 ml-14">
              {favorites.length} saved item{favorites.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start browsing and tap the heart icon to save items you like
            </p>
            <Button onClick={() => navigate("/")}>
              Browse Items
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((favorite) => {
              const item = favorite.items as unknown as Item;
              if (!item) return null;

              return (
                <Card
                  key={favorite.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                >
                  <div onClick={() => handleItemClick(item)}>
                    {/* Image */}
                    <div className="relative aspect-square bg-muted">
                      {item.images && item.images.length > 0 && (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-2xl font-bold text-primary mb-2">
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{item.brand}</span>
                        <span>•</span>
                        <span>{item.condition}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="px-4 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(favorite.id, item.title);
                      }}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Favorites
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Favorites;
