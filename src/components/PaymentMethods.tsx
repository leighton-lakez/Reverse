import { useState } from "react";
import { CreditCard, Smartphone, Wallet, DollarSign, Copy, Check } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";

interface PaymentMethodsProps {
  venmo?: string | null;
  cashapp?: string | null;
  zelle?: string | null;
  paypal?: string | null;
  apple_pay?: string | null;
  other_payment?: string | null;
}

const PaymentMethods = ({
  venmo,
  cashapp,
  zelle,
  paypal,
  apple_pay,
  other_payment,
}: PaymentMethodsProps) => {
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);

  const paymentMethods = [
    { name: "Venmo", value: venmo, icon: Smartphone, color: "bg-blue-500" },
    { name: "Cash App", value: cashapp, icon: DollarSign, color: "bg-green-500" },
    { name: "Zelle", value: zelle, icon: CreditCard, color: "bg-purple-500" },
    { name: "PayPal", value: paypal, icon: CreditCard, color: "bg-blue-600" },
    { name: "Apple Pay", value: apple_pay, icon: Smartphone, color: "bg-gray-800" },
    { name: "Other", value: other_payment, icon: Wallet, color: "bg-orange-500" },
  ].filter(method => method.value);

  if (paymentMethods.length === 0) {
    return null;
  }

  const handleCopy = async (methodName: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMethod(methodName);
      toast({
        title: "Copied!",
        description: `${methodName} info copied to clipboard`,
      });
      setTimeout(() => setCopiedMethod(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">Accepted Payment Methods</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isCopied = copiedMethod === method.name;
          return (
            <Badge
              key={method.name}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border cursor-pointer transition-all active:scale-95"
              onClick={() => handleCopy(method.name, method.value as string)}
            >
              <Icon className="h-3.5 w-3.5" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium">{method.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{method.value}</span>
              </div>
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500 ml-1" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground ml-1 hover:text-foreground" />
              )}
            </Badge>
          );
        })}
      </div>
    </Card>
  );
};

export default PaymentMethods;
