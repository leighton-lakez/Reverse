import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle, ExternalLink, AlertCircle, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReverseIcon } from "@/components/ReverseIcon";

const SellerSettings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [sellerAccount, setSellerAccount] = useState<any>(null);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, available: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to access seller settings");
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
      fetchSellerAccount(session.user.id);
      fetchEarnings(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchSellerAccount = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('seller_accounts')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSellerAccount(data);
    } catch (error) {
      console.error('Error fetching seller account:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async (uid: string) => {
    try {
      // Get completed orders where user is seller
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('seller_amount, status, escrow_release_at')
        .eq('seller_id', uid)
        .in('status', ['completed', 'shipped', 'delivered']);

      if (completedOrders) {
        const now = new Date();
        let total = 0;
        let pending = 0;
        let available = 0;

        completedOrders.forEach(order => {
          total += order.seller_amount;

          if (order.status === 'completed' && order.escrow_release_at) {
            const releaseDate = new Date(order.escrow_release_at);
            if (releaseDate <= now) {
              available += order.seller_amount;
            } else {
              pending += order.seller_amount;
            }
          } else {
            pending += order.seller_amount;
          }
        });

        setEarnings({ total, pending, available });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleConnectStripe = async () => {
    if (!userId) return;

    setConnecting(true);
    try {
      // Call Edge Function to create Stripe Connect account
      const response = await supabase.functions.invoke('create-connect-account', {
        body: { userId },
      });

      if (response.error) throw new Error(response.error.message);

      const { url } = response.data;

      if (url) {
        // Redirect to Stripe onboarding
        window.location.href = url;
      } else {
        throw new Error('Failed to get onboarding URL');
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      toast.error(error.message || 'Failed to connect Stripe account');
    } finally {
      setConnecting(false);
    }
  };

  const handleViewDashboard = async () => {
    if (!sellerAccount?.stripe_account_id) return;

    try {
      const response = await supabase.functions.invoke('create-login-link', {
        body: { stripeAccountId: sellerAccount.stripe_account_id },
      });

      if (response.error) throw new Error(response.error.message);

      const { url } = response.data;
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error: any) {
      console.error('Error getting dashboard link:', error);
      toast.error('Failed to open Stripe dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = sellerAccount?.stripe_onboarding_complete;

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
            <h2 className="text-lg font-semibold">Seller Settings</h2>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Earnings Summary */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Your Earnings
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">${earnings.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">${earnings.pending.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-600">${earnings.available.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Funds become available 3 days after buyer confirms receipt
          </p>
        </Card>

        {/* Stripe Connect Status */}
        <Card className="p-6 border-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
                <Building2 className={`h-6 w-6 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Payout Account</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Your account is connected' : 'Connect to receive payments'}
                </p>
              </div>
            </div>
            <Badge className={isConnected ? 'bg-green-500' : 'bg-yellow-500'}>
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </>
              )}
            </Badge>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your Stripe account is connected. When you make sales, your earnings (minus the 15% platform fee) will be automatically transferred to your bank account.
                </p>
              </div>

              {sellerAccount?.bank_last_four && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Account</p>
                    <p className="font-medium">•••• {sellerAccount.bank_last_four}</p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleViewDashboard}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Stripe Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <strong>Important:</strong> You need to connect a payout account before you can receive payments from sales. This is required to sell items on REVRS.
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">When you connect, you can:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Receive 85% of each sale directly to your bank</li>
                  <li>Track your earnings and payouts</li>
                  <li>Get paid automatically when orders complete</li>
                </ul>
              </div>

              <Button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="w-full h-12 bg-[#635BFF] hover:bg-[#635BFF]/90"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Connect with Stripe
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Powered by Stripe - the world's most trusted payment platform
              </p>
            </div>
          )}
        </Card>

        {/* Fee Information */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Fee Structure</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Platform Fee</span>
              <span className="font-semibold text-foreground">15%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
              <span className="text-sm text-muted-foreground">You Keep</span>
              <span className="font-semibold text-green-600">85%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Example: If you sell an item for $100, you receive $85 and the platform keeps $15.
          </p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default SellerSettings;
