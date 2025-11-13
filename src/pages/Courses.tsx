import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReverseIcon } from "@/components/ReverseIcon";

const Courses = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(null);

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      description: "Perfect for getting started",
      firstPayment: 500,
      firstDuration: "1 month",
      recurringPayment: 200,
      features: [
        "Access to all course materials",
        "Weekly live sessions",
        "Community Discord access",
        "Email support",
        "Certificate upon completion"
      ],
      color: "from-blue-500 to-blue-600",
      badgeColor: "bg-blue-500"
    },
    {
      id: "premium",
      name: "Premium Plan",
      description: "Best value for committed learners",
      firstPayment: 700,
      firstDuration: "2 months",
      recurringPayment: 150,
      features: [
        "Everything in Basic Plan",
        "1-on-1 mentorship sessions",
        "Priority support",
        "Exclusive resources & templates",
        "Lifetime course access",
        "Job placement assistance"
      ],
      color: "from-purple-500 to-purple-600",
      badgeColor: "bg-purple-500",
      recommended: true
    }
  ];

  const handleSelectPlan = (planId: "basic" | "premium") => {
    setSelectedPlan(planId);
    // TODO: Navigate to checkout or payment flow
    console.log(`Selected plan: ${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ReverseIcon className="w-7 h-7" />
              <h1 className="text-lg font-black tracking-tighter text-gradient">REVRS</h1>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-3">My Courses</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the perfect plan to accelerate your learning journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${
                selectedPlan === plan.id
                  ? "border-primary shadow-xl scale-105"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute top-4 right-4">
                  <Badge className={`${plan.badgeColor} text-white`}>
                    Recommended
                  </Badge>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-black bg-gradient-to-r ${plan.color} bg-clip-text text-transparent">
                      ${plan.firstPayment}
                    </span>
                    <span className="text-muted-foreground">
                      for {plan.firstDuration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground font-semibold">
                      Then ${plan.recurringPayment}/month
                    </span>
                    <span className="text-muted-foreground">after</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mt-0.5`}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-foreground/90 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id as "basic" | "premium")}
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold py-6 text-lg shadow-lg transition-all ${
                    selectedPlan === plan.id ? "ring-4 ring-primary/50" : ""
                  }`}
                >
                  {selectedPlan === plan.id ? "Selected" : "Choose Plan"}
                </Button>
              </div>

              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} opacity-0 hover:opacity-5 transition-opacity pointer-events-none`} />
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include a 7-day money-back guarantee</p>
          <p className="mt-2">Cancel anytime, no questions asked</p>
        </div>
      </main>
    </div>
  );
};

export default Courses;
