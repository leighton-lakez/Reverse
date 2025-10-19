import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const mockItems = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop",
    title: "Gucci Leather Handbag",
    price: 1299,
    condition: "Like New",
    location: "New York, NY"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop",
    title: "Louis Vuitton Sneakers",
    price: 850,
    condition: "Excellent",
    location: "Los Angeles, CA"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop",
    title: "Chanel Classic Dress",
    price: 2100,
    condition: "New",
    location: "Miami, FL"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=800&auto=format&fit=crop",
    title: "Prada Sunglasses",
    price: 320,
    condition: "Good",
    location: "Chicago, IL"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1599003254870-59d164d408ba?w=800&auto=format&fit=crop",
    title: "Versace Silk Scarf",
    price: 180,
    condition: "Like New",
    location: "San Francisco, CA"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=800&auto=format&fit=crop",
    title: "Balenciaga Track Jacket",
    price: 750,
    condition: "Excellent",
    location: "Boston, MA"
  }
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if profile is complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, location")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile?.display_name || !profile?.location) {
        navigate("/profile-setup");
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
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Design-Up
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search designer items..."
              className="pl-10 bg-muted border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Trending Designer Items</h2>
          <p className="text-muted-foreground">Discover luxury pieces from your community</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Loading...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map((item, index) => (
              <div key={item.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <ItemCard 
                  id={item.id}
                  image={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"}
                  title={item.title}
                  price={parseFloat(item.price)}
                  condition={item.condition}
                  location={item.location}
                  userId={item.user_id}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery ? "Try searching with different keywords" : "Be the first to list an item!"}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
