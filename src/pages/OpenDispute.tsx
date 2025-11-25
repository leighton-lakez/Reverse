import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReverseIcon } from "@/components/ReverseIcon";

const DISPUTE_REASONS = [
  { value: "not_received", label: "Item not received", description: "I haven't received the item" },
  { value: "not_as_described", label: "Not as described", description: "Item is different from the listing" },
  { value: "damaged", label: "Item damaged", description: "Item arrived damaged or broken" },
  { value: "wrong_item", label: "Wrong item", description: "I received a different item" },
  { value: "other", label: "Other issue", description: "Another problem with my order" },
];

const OpenDispute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  const [userId, setUserId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in");
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();

    if (!order) {
      toast.error("No order selected");
      navigate('/orders');
    }
  }, [navigate, order]);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    setSubmitting(true);
    try {
      // Create dispute
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          order_id: order.id,
          opened_by: userId,
          reason,
          description: description.trim(),
          status: 'open',
        });

      if (disputeError) throw disputeError;

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      toast.success("Dispute opened. We'll review it within 24-48 hours.");
      navigate('/orders');
    } catch (error: any) {
      console.error('Error opening dispute:', error);
      toast.error(error.message || "Failed to open dispute");
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Open a Dispute</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Order Info */}
        <Card className="p-4 border-border">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={order.item?.images?.[0] || '/placeholder.svg'}
                alt={order.item?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold">{order.item?.title}</h3>
              <p className="text-sm text-muted-foreground">${order.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Order #{order.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </Card>

        {/* Warning */}
        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Before opening a dispute
              </p>
              <p className="text-muted-foreground">
                Please try to resolve the issue with the seller first by messaging them.
                Disputes should only be opened if you cannot reach a resolution.
              </p>
            </div>
          </div>
        </Card>

        {/* Reason Selection */}
        <Card className="p-6 border-border">
          <h2 className="text-lg font-semibold mb-4">What's the issue?</h2>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {DISPUTE_REASONS.map((r) => (
              <div
                key={r.value}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  reason === r.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
                onClick={() => setReason(r.value)}
              >
                <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                <Label htmlFor={r.value} className="cursor-pointer flex-1">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Card>

        {/* Description */}
        <Card className="p-6 border-border">
          <h2 className="text-lg font-semibold mb-4">Describe the issue</h2>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about what happened. Include any relevant information that will help us understand the issue."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Be specific. Include dates, what you expected vs what you received, etc.
          </p>
        </Card>

        {/* What happens next */}
        <Card className="p-6 border-border">
          <h2 className="text-lg font-semibold mb-3">What happens next?</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-primary">1.</span>
              We'll review your dispute within 24-48 hours
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">2.</span>
              The seller will be notified and can respond
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">3.</span>
              We'll make a decision based on the evidence
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">4.</span>
              If approved, you'll receive a full or partial refund
            </li>
          </ol>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !reason || !description.trim()}
          className="w-full h-12 bg-red-600 hover:bg-red-700"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Submit Dispute
            </>
          )}
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default OpenDispute;
