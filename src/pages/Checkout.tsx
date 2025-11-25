import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Truck, MapPinned, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { checkoutSchema } from "@/lib/validationSchemas";
import { getStripe } from "@/lib/stripe";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "@/components/PaymentForm";
import { ReverseIcon } from "@/components/ReverseIcon";

const PLATFORM_FEE_PERCENT = 0.15; // 15% platform fee

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item || {};
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [shippingComplete, setShippingComplete] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'local_pickup'>(
    item.shipping_type === 'local_pickup' ? 'local_pickup' : 'shipping'
  );
  const [shippingData, setShippingData] = useState<any>(null);
  const stripePromise = getStripe();

  // Check if both options are available
  const canShip = item.shipping_type === 'shipping' || item.shipping_type === 'both';
  const canPickup = item.shipping_type === 'local_pickup' || item.shipping_type === 'both';

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

  const handleShippingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      let validationData = null;

      // Only validate shipping if not local pickup
      if (deliveryMethod === 'shipping') {
        const formData = new FormData(e.currentTarget);

        validationData = {
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

        setShippingData(validationData);
      }

      // Create PaymentIntent via Supabase Edge Function
      const response = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(total * 100), // Convert to cents
          itemId: item.id,
          itemTitle: item.title,
          buyerId: userId,
          sellerId: item.user_id,
          platformFee: Math.round(subtotal * PLATFORM_FEE_PERCENT * 100), // 15% in cents
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { clientSecret: secret } = response.data;

      if (secret) {
        setClientSecret(secret);
        setShippingComplete(true);
        toast.success(deliveryMethod === 'shipping'
          ? "Shipping information saved. Please enter your payment details."
          : "Ready for payment. Please enter your payment details.");
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to process checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Create the order in the database
      const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
      const sellerAmount = subtotal - platformFee;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          item_id: item.id,
          buyer_id: userId,
          seller_id: item.user_id,
          amount: total,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'pending_seller_confirmation',
          payment_intent_id: paymentIntentId,
          shipping_address: deliveryMethod === 'shipping' ? shippingData : null,
          shipping_type: deliveryMethod,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      // Update item status to pending
      await supabase
        .from('items')
        .update({ status: 'pending' })
        .eq('id', item.id);

      toast.success("Payment successful! Order sent to seller for confirmation.");
      navigate("/orders", { state: { newOrderId: order.id } });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error("Payment succeeded but order creation failed. Please contact support.");
    }
  };

  const subtotal = item.price || 0;
  const shipping = deliveryMethod === 'shipping' ? 0 : 0; // Shipping included in price
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ReverseIcon className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter text-gradient">REVRS</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              {/* Delivery Method Selection */}
              {canShip && canPickup && (
                <Card className="p-6 border-border animate-fade-in">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Delivery Method</h2>
                  <RadioGroup
                    value={deliveryMethod}
                    onValueChange={(value) => setDeliveryMethod(value as 'shipping' | 'local_pickup')}
                    className="space-y-3"
                  >
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${deliveryMethod === 'shipping' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <RadioGroupItem value="shipping" id="shipping" />
                      <Label htmlFor="shipping" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Truck className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Ship to me</p>
                          <p className="text-sm text-muted-foreground">Seller will ship the item to your address</p>
                        </div>
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${deliveryMethod === 'local_pickup' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <RadioGroupItem value="local_pickup" id="local_pickup" />
                      <Label htmlFor="local_pickup" className="flex items-center gap-2 cursor-pointer flex-1">
                        <MapPinned className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Local pickup</p>
                          <p className="text-sm text-muted-foreground">Meet the seller in {item.location || 'their location'}</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </Card>
              )}

              {/* Shipping Information - Only show if shipping */}
              {deliveryMethod === 'shipping' && (
                <Card className="p-6 border-border animate-fade-in">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Shipping Address</h2>
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
              )}

              {/* Local Pickup Info */}
              {deliveryMethod === 'local_pickup' && (
                <Card className="p-6 border-border animate-fade-in bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <MapPinned className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Local Pickup Selected</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        After the seller confirms your order, you'll coordinate a safe meeting location through messages.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Seller location:</strong> {item.location || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Buyer Protection Notice */}
              <Card className="p-4 border-border bg-green-500/5 border-green-500/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Buyer Protection</h3>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely until you confirm receipt of the item.
                      {item.return_policy !== 'no_returns' && ` Returns accepted within ${item.return_policy === '3_days' ? '3' : '7'} days.`}
                    </p>
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                disabled={loading || shippingComplete}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <span className="flex items-center gap-2">Processing...</span>
                ) : shippingComplete ? (
                  <span className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {deliveryMethod === 'shipping' ? 'Shipping Information Saved' : 'Ready for Payment'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Continue to Payment
                  </span>
                )}
              </Button>
            </form>

            {/* Payment Form - Only show after shipping is complete */}
            {shippingComplete && clientSecret && (
              <Card className="p-6 border-border animate-fade-in">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Secure Payment
                </h2>
                <div className="text-sm text-muted-foreground mb-6">
                  <p className="font-medium text-foreground flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Powered by Stripe - Industry-leading payment security
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="bg-muted px-2 py-1 rounded">💳 All major cards</div>
                    <div className="bg-muted px-2 py-1 rounded">🔒 SSL encrypted</div>
                  </div>
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm onSuccess={handlePaymentSuccess} amount={total} />
                </Elements>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-border sticky top-24 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-xl font-semibold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-4 mb-4">
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.condition}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      {deliveryMethod === 'shipping' ? (
                        <>
                          <Truck className="h-3 w-3" />
                          <span>Shipping</span>
                        </>
                      ) : (
                        <>
                          <MapPinned className="h-3 w-3" />
                          <span>Local pickup</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item price</span>
                  <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'}
                  </span>
                  <span className="text-foreground font-medium text-green-600">Included</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="text-foreground font-medium">${tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Seller must confirm order within 72 hours
                </p>
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
