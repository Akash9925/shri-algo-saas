import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

export default function Upgrade() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [upgrading, setUpgrading] = useState(false);

  const { data: subscription } = trpc.subscription.getCurrent.useQuery();
  const upgradeMutation = trpc.subscription.upgradeToPaid.useMutation();

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await upgradeMutation.mutateAsync();
      toast.success("Successfully upgraded to paid plan!");
      setLocation("/dashboard");
    } catch (error) {
      toast.error((error as any).message || "Failed to upgrade");
    } finally {
      setUpgrading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "Perfect for beginners",
      features: [
        { name: "1 active strategy", included: true },
        { name: "Basic stoploss & target", included: true },
        { name: "Real-time P&L tracking", included: true },
        { name: "Trade execution logs", included: true },
        { name: "Trailing stoploss", included: false },
        { name: "Re-entry support", included: false },
        { name: "Unlimited strategies", included: false },
      ],
      current: subscription?.plan === "free",
    },
    {
      name: "Paid",
      price: "₹999/mo",
      description: "For serious traders",
      features: [
        { name: "Unlimited active strategies", included: true },
        { name: "Basic stoploss & target", included: true },
        { name: "Real-time P&L tracking", included: true },
        { name: "Trade execution logs", included: true },
        { name: "Trailing stoploss", included: true },
        { name: "Re-entry support", included: true },
        { name: "Priority support", included: true },
      ],
      current: subscription?.plan === "paid",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Upgrade Your Plan</h1>
          <p className="text-gray-600 mt-2">Choose the plan that works best for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`p-8 relative ${plan.current ? "ring-2 ring-blue-600 shadow-lg" : ""}`}>
              {plan.current && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                <div className="text-3xl font-bold text-gray-900 mt-4">{plan.price}</div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? "text-gray-900" : "text-gray-400"}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {plan.current ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {upgrading ? "Upgrading..." : "Upgrade Now"}
                </Button>
              )}
            </Card>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-8 max-w-2xl mx-auto w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Can I cancel anytime?</h4>
              <p className="text-sm text-gray-600 mt-1">Yes, you can downgrade to free plan anytime.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-600 mt-1">We accept all major credit cards and digital wallets.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Is there a free trial?</h4>
              <p className="text-sm text-gray-600 mt-1">Start with our free plan - no credit card required.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
