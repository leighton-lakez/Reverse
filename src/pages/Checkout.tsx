import { useState, useEffect } from "react";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { checkoutSchema } from "@/lib/validationSchemas";
import { getStripe } from "@/lib/stripe";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item || {};
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Require authentication for checkout
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to complete your purchase");
        navigate('/auth', { state: { returnTo: '/checkout', item } });
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate, item]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Authentication required");
      navigate('/auth');
      return;
    }

    if (!item.id || !item.user_id) {
      toast.error("Invalid item data");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Validate shipping address input
      const validationData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: formData.get('zip') as string,
      };

      const validationResult = checkoutSchema.safeParse(validationData);

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      // Call Supabase Edge Function to create Stripe checkout session
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (!authSession) {
        toast.error("Please sign in to continue");
        navigate('/auth');
        return;
      }

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          itemId: item.id,
          itemTitle: item.title,
          itemPrice: subtotal,
          buyerId: userId,
          sellerId: item.user_id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to process checkout. Please try again.");
      setLoading(false);
    }
  };

  const subtotal = item.price || 0;
  const shipping = 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/");
                }
              }}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shipping Information */}
              <Card className="p-6 border-border animate-fade-in">
                <h2 className="text-xl font-semibold text-foreground mb-4">Shipping Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" required className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" required className="bg-muted border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" required className="bg-muted border-border" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" required className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" required className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input id="zip" name="zip" required className="bg-muted border-border" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="p-6 border-border animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Secure Payment with Stripe
                </h2>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Powered by Stripe - Industry-leading payment security
                  </p>
                  <p>After submitting your order, you'll be redirected to Stripe's secure checkout to complete payment.</p>
                  <div className="flex items-center gap-2 text-xs pt-2">
                    <div className="bg-muted px-2 py-1 rounded">💳 All major cards</div>
                    <div className="bg-muted px-2 py-1 rounded">🔒 SSL encrypted</div>
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <span className="flex items-center gap-2">Redirecting to Stripe...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Proceed to Secure Payment
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-border sticky top-24 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-xl font-semibold text-foreground mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-4">
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.condition}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground font-medium">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground font-medium">${tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Checkout;
