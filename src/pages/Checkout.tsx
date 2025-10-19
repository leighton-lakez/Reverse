import { useState, useEffect } from "react";
import { ArrowLeft, Lock } from "lucide-react";
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

      const shippingAddress = validationResult.data;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          buyer_id: userId,
          seller_id: item.user_id,
          item_id: item.id,
          amount: subtotal,
          status: 'pending',
          shipping_address: shippingAddress as any,
        } as any);

      if (transactionError) throw transactionError;

      // Mark item as pending
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'pending' })
        .eq('id', item.id);

      if (itemError) throw itemError;

      toast.success("Order placed successfully! Payment will be processed separately.");
      navigate("/");
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to process order. Please try again.");
    } finally {
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
              onClick={() => navigate(-1)}
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
                  <Lock className="h-5 w-5" />
                  Payment
                </h2>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Your order will be held pending payment arrangement with the seller.</p>
                  <p className="font-medium text-foreground">No payment information is collected at this time.</p>
                  <p>The seller will contact you to arrange secure payment and delivery.</p>
                </div>
              </Card>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <span className="flex items-center gap-2">Processing...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Complete Purchase
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
