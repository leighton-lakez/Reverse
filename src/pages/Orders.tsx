import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Package, Truck, MapPinned, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReverseIcon } from "@/components/ReverseIcon";

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  seller_amount: number;
  status: string;
  payment_intent_id: string | null;
  shipping_address: any;
  shipping_type: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  buyer_confirmed_at: string | null;
  escrow_release_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  item?: any;
  buyer?: any;
  seller?: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending_seller_confirmation: { label: "Awaiting Seller", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500", icon: CheckCircle },
  shipped: { label: "Shipped", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500", icon: Package },
  completed: { label: "Completed", color: "bg-green-600", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: XCircle },
  disputed: { label: "Disputed", color: "bg-orange-500", icon: AlertCircle },
  refunded: { label: "Refunded", color: "bg-gray-500", icon: XCircle },
};

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("purchases");

  // Dialogs
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to view your orders");
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
      fetchOrders(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchOrders = async (uid: string) => {
    setLoading(true);
    try {
      // Fetch orders where user is buyer
      const { data: buyerData, error: buyerError } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', uid)
        .order('created_at', { ascending: false });

      if (buyerError) throw buyerError;

      // Fetch orders where user is seller
      const { data: sellerData, error: sellerError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false });

      if (sellerError) throw sellerError;

      // Fetch item and user details for each order
      const enrichOrder = async (order: Order, isBuyer: boolean) => {
        const { data: item } = await supabase
          .from('items')
          .select('*')
          .eq('id', order.item_id)
          .single();

        const otherUserId = isBuyer ? order.seller_id : order.buyer_id;
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        return {
          ...order,
          item,
          [isBuyer ? 'seller' : 'buyer']: otherUser,
        };
      };

      const enrichedBuyerOrders = await Promise.all(
        (buyerData || []).map(order => enrichOrder(order, true))
      );

      const enrichedSellerOrders = await Promise.all(
        (sellerData || []).map(order => enrichOrder(order, false))
      );

      setBuyerOrders(enrichedBuyerOrders);
      setSellerOrders(enrichedSellerOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Update item status
      await supabase
        .from('items')
        .update({ status: 'sold' })
        .eq('id', order.item_id);

      toast.success('Order confirmed! Please ship the item.');
      fetchOrders(userId!);
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Failed to confirm order');
    }
  };

  const handleDeclineOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Declined by seller',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Restore item availability
      await supabase
        .from('items')
        .update({ status: 'available' })
        .eq('id', order.item_id);

      toast.success('Order declined. Buyer will be refunded.');
      fetchOrders(userId!);
    } catch (error) {
      console.error('Error declining order:', error);
      toast.error('Failed to decline order');
    }
  };

  const handleAddTracking = async () => {
    if (!selectedOrder || !trackingNumber || !trackingCarrier) {
      toast.error('Please enter tracking information');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber,
          tracking_carrier: trackingCarrier,
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast.success('Tracking added! Buyer has been notified.');
      setShowShippingDialog(false);
      setTrackingNumber('');
      setTrackingCarrier('');
      fetchOrders(userId!);
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast.error('Failed to add tracking');
    }
  };

  const handleConfirmReceipt = async (order: Order) => {
    try {
      // Calculate escrow release date (3 days from now)
      const escrowReleaseDate = new Date();
      escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 3);

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          buyer_confirmed_at: new Date().toISOString(),
          escrow_release_at: escrowReleaseDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Receipt confirmed! Seller will receive payment.');
      setShowConfirmDialog(false);
      fetchOrders(userId!);
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast.error('Failed to confirm receipt');
    }
  };

  const OrderCard = ({ order, isBuyer }: { order: Order; isBuyer: boolean }) => {
    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_seller_confirmation;
    const StatusIcon = statusConfig.icon;
    const otherUser = isBuyer ? order.seller : order.buyer;

    return (
      <Card className="p-4 border-border hover:border-primary/30 transition-colors">
        <div className="flex gap-4">
          {/* Item Image */}
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={order.item?.images?.[0] || '/placeholder.svg'}
              alt={order.item?.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Order Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-foreground line-clamp-1">{order.item?.title}</h3>
              <Badge className={`${statusConfig.color} text-white text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-lg font-bold text-primary mb-1">${order.amount.toFixed(2)}</p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{isBuyer ? 'Seller' : 'Buyer'}: {otherUser?.display_name || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {order.shipping_type === 'local_pickup' ? (
                <>
                  <MapPinned className="h-3 w-3" />
                  <span>Local pickup</span>
                </>
              ) : (
                <>
                  <Truck className="h-3 w-3" />
                  <span>Shipping</span>
                  {order.tracking_number && (
                    <span className="ml-2 text-primary">
                      Tracking: {order.tracking_number}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Seller Actions */}
          {!isBuyer && order.status === 'pending_seller_confirmation' && (
            <>
              <Button
                size="sm"
                onClick={() => handleConfirmOrder(order)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept Order
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeclineOrder(order)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </>
          )}

          {!isBuyer && order.status === 'confirmed' && order.shipping_type !== 'local_pickup' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedOrder(order);
                setShowShippingDialog(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Truck className="h-4 w-4 mr-1" />
              Add Tracking
            </Button>
          )}

          {/* Buyer Actions */}
          {isBuyer && (order.status === 'shipped' || order.status === 'delivered' ||
            (order.status === 'confirmed' && order.shipping_type === 'local_pickup')) && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedOrder(order);
                setShowConfirmDialog(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Receipt
            </Button>
          )}

          {/* Message Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/chat', {
              state: {
                sellerId: isBuyer ? order.seller_id : order.buyer_id,
                item: order.item
              }
            })}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <ReverseIcon className="w-8 h-8" />
              <h1 className="text-xl font-black tracking-tighter text-gradient">REVRS</h1>
            </div>
            <h2 className="text-lg font-semibold">My Orders</h2>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="purchases" className="gap-2">
              <Package className="h-4 w-4" />
              Purchases ({buyerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <Truck className="h-4 w-4" />
              Sales ({sellerOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-4">
            {buyerOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground mb-2">No purchases yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  When you buy items, they'll appear here.
                </p>
                <Button onClick={() => navigate("/")}>Browse Items</Button>
              </Card>
            ) : (
              buyerOrders.map(order => (
                <OrderCard key={order.id} order={order} isBuyer={true} />
              ))
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {sellerOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground mb-2">No sales yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  When you sell items, they'll appear here.
                </p>
                <Button onClick={() => navigate("/sell")}>List an Item</Button>
              </Card>
            ) : (
              sellerOrders.map(order => (
                <OrderCard key={order.id} order={order} isBuyer={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Tracking Dialog */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Information</DialogTitle>
            <DialogDescription>
              Enter the tracking details so the buyer can track their package.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Shipping Carrier</Label>
              <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShippingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTracking}>
              <Truck className="h-4 w-4 mr-2" />
              Add Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Receipt Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Receipt</DialogTitle>
            <DialogDescription>
              By confirming, you acknowledge that you have received the item and it matches the description.
              The seller will receive payment after this confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>Important:</strong> Only confirm if you have received and inspected the item.
                {selectedOrder?.item?.return_policy !== 'no_returns' && (
                  <> You have {selectedOrder?.item?.return_policy === '3_days' ? '3' : '7'} days to request a return if needed.</>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedOrder && handleConfirmReceipt(selectedOrder)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Orders;
